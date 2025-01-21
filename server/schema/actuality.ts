import { builder } from '@/server/builder';
import { prismaPothos } from '@/server/db';
import { parseID } from '@/server/utils';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { TranslatableError } from '../errors/TranslatableError';
import zod, { ZodError } from 'zod';
import { Count } from './utils';
import { decodeGlobalID, parseGlobalID } from '@/lib/utils/globalId';
import { ActualityStatusKey } from '@/lib/constants';
import { slugRegexPattern } from '@/lib/utils/string';
import { Prisma } from '@prisma/client';
import { encodeGlobalID } from '@pothos/plugin-relay';
import { PrismaClientErrorCode } from '../errors/PrismaClientErrorCode';
import { VideoInput } from './video';

builder.enumType(ActualityStatusKey, {
  name: 'ActualityStatus',
});

builder.prismaNode('Actuality', {
  id: { field: 'id' },
  fields: (t) => ({
    title: t.exposeString('title', { nullable: false }),
    summary: t.exposeString('summary', { nullable: true }),
    text: t.expose('text', { type: 'JSON', nullable: true }),
    coverPhoto: t.relation('coverPhoto', { nullable: true }),
    coverPhotoId: t.exposeInt('coverPhotoId', { nullable: true }),
    previewPhoto: t.relation('previewPhoto', { nullable: true }),
    previewPhotoId: t.exposeInt('previewPhotoId', { nullable: true }),
    images: t.relation('images'),
    video: t.relation('video', { nullable: true }),
    videoId: t.exposeInt('videoId', { nullable: true }),
    link: t.exposeString('link', { nullable: true }),
    activeSince: t.expose('activeSince', { type: 'DateTime', nullable: false }),
    activeTo: t.expose('activeTo', { type: 'DateTime', nullable: true }),
    subTitle: t.exposeString('subTitle', { nullable: true }),
    tags: t.relation('tags', {
      query: (_args, _ctx) => ({
        orderBy: {
          name: 'asc',
        },
      }),
    }),
    isExternal: t.exposeBoolean('isExternal'),
    slug: t.exposeString('slug', {
      description: 'kebab-case URL slug.',
    }),
    status: t.field({
      type: ActualityStatusKey,
      nullable: false,
      resolve: (parent) => parent.status as ActualityStatusKey,
    }),
    isPinned: t.exposeBoolean('isPinned'),
    production: t.relation('production', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime', nullable: false }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime', nullable: false }),
  }),
});

const ActualityPreviewInput = builder.inputType('ActualityPreviewInput', {
  description:
    'Input for preview element rendered in the `ActualityCard` component. Either `Image` or `Video` has to be set. ',

  fields: (t) => ({
    previewPhotoId: t.string({
      required: false,
      validate: {
        type: 'string',
      },
    }),
    video: t.field({
      type: VideoInput,
      required: false,
    }),
  }),
});

const ActualityInput = builder.inputType('ActualityInput', {
  fields: (t) => ({
    title: t.string({
      required: true,
      validate: {
        type: 'string',
        minLength: 3,
      },
    }),
    activeSince: t.field({
      required: true,
      type: 'DateTime',
    }),
    activeTo: t.field({
      required: false,
      type: 'DateTime',
    }),
    subTitle: t.string({ required: false }),
    summary: t.string({ required: false }),
    text: t.field({
      required: false,
      type: 'JSON',
    }),
    coverPhotoId: t.string({
      required: false,
      validate: {
        type: 'string',
      },
    }),

    link: t.string({
      required: false,
      validate: {
        type: 'string',
      },
    }),
    tags: t.stringList({
      required: false,
      validate: {
        items: {
          type: 'string',
        },
      },
    }),
    status: t.field({ type: ActualityStatusKey, required: true }),
    productionId: t.string({
      required: false,
      validate: {
        type: 'string',
      },
    }),
    isPinned: t.boolean({ required: true }),
    isExternal: t.boolean({ required: true }),
    slug: t.string({
      required: true,
      validate: {
        type: 'string',
        schema: zod.string().regex(new RegExp(slugRegexPattern), {
          message: 'Format of the slug is incorrect.',
        }),
      },
    }),
    images: t.stringList({
      required: false,
      validate: {
        items: {
          type: 'string',
        },
      },
    }),
    preview: t.field({
      description: 'Used to render content in the `ActualityCard` component',
      type: ActualityPreviewInput,
      required: true,
    }),
  }),
});

builder.queryFields((t) => ({
  getActualityById: t.prismaField({
    description: 'Query for specific actuality.',
    type: 'Actuality',
    errors: {
      types: [TranslatableError, ZodError],
    },
    args: { id: t.arg.id({ required: true }) },
    nullable: true,
    resolve: async (query, _, { id }) => {
      try {
        return await prismaPothos.actuality.findUniqueOrThrow({
          ...query,
          where: {
            id: parseID(decodeGlobalID(id)),
          },
        });
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
          if (e.code === 'P2025') {
            throw new TranslatableError('actualityNotFound');
          }
        }
        throw e;
      }
    },
  }),

  getActualities: t.prismaConnection({
    description: 'Query for retrieving details about all actualities.',
    type: 'Actuality',
    cursor: 'id',
    resolve: async (query) => {
      return prismaPothos.actuality.findMany({
        ...query,
        orderBy: [{ isPinned: 'desc' }, { activeSince: 'desc' }],
      });
    },
  }),
}));

builder.mutationFields((t) => ({
  createActuality: t.prismaField({
    description: 'Mutation for creating a new actuality.',
    type: 'Actuality',
    nullable: true,
    errors: {
      types: [ZodError, TranslatableError],
    },
    args: {
      input: t.arg({ type: ActualityInput, required: true }),
    },
    resolve: async (query, _root, { input }) => {
      const {
        preview,
        activeTo,
        productionId,
        text,
        subTitle,
        images,
        tags,
        coverPhotoId,
        ...rest
      } = input;

      if (!preview.previewPhotoId && !preview.video) {
        // At least one
        throw new TranslatableError('previewImageOrVideoMissing');
      }
      if (preview.previewPhotoId && preview.video) {
        // You have to choose one
        throw new TranslatableError('eitherPreviewImageOrVideo');
      }

      const previewPhoto = preview.previewPhotoId
        ? parseGlobalID(preview.previewPhotoId)
        : null;
      const previewVideo = preview.video ?? null;

      const whereClause = previewVideo?.id
        ? { id: parseGlobalID(previewVideo.id) }
        : previewVideo?.videoId
        ? { videoId: previewVideo.videoId }
        : previewVideo?.link
        ? { link: previewVideo.link }
        : {
            id: 0,
          };

      try {
        const resolvedVideo = await prismaPothos.video.upsert({
          where: whereClause,
          update: {},
          create: {
            link: previewVideo?.link,
            videoId: previewVideo?.videoId,
            source: previewVideo?.source,
            thumbnailLink: previewVideo?.thumbnailLink,
          },
        });

        return await prismaPothos.actuality.create({
          ...query,
          data: {
            ...rest,
            activeTo: activeTo ? new Date(activeTo) : null,
            coverPhotoId: coverPhotoId ? parseGlobalID(coverPhotoId) : null,
            videoId: previewVideo ? resolvedVideo.id : null,
            previewPhotoId: previewPhoto,
            productionId: productionId
              ? parseID(decodeGlobalID(productionId))
              : undefined,
            text: text as Prisma.InputJsonValue,
            subTitle: subTitle || '',
            images: {
              connect: images?.map((imgId) => ({
                id: parseID(decodeGlobalID(imgId)),
              })),
            },
            tags: {
              connectOrCreate: tags?.map((tagName) => ({
                where: {
                  name: tagName,
                },
                create: {
                  name: tagName,
                },
              })),
            },
          },
        });
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
          if (e.code === 'P2002') {
            throw new TranslatableError('actualityAlreadyExists');
          }
        }
        throw e;
      }
    },
  }),

  updateActuality: t.prismaField({
    description: 'Mutation for updating actuality.',
    type: 'Actuality',
    nullable: true,
    errors: {
      types: [TranslatableError, ZodError],
    },
    args: {
      id: t.arg.id({
        required: true,
      }),
      input: t.arg({ type: ActualityInput, required: true }),
    },
    resolve: async (query, _root, { id, input }) => {
      try {
        const {
          preview,
          activeTo,
          productionId,
          text,
          subTitle,
          images,
          tags,
          coverPhotoId,
          ...rest
        } = input;

        if (!preview.previewPhotoId && !preview.video) {
          // At least one
          throw new TranslatableError('previewImageOrVideoMissing');
        }
        if (preview.previewPhotoId && preview.video) {
          // You have to choose one
          throw new TranslatableError('eitherPreviewImageOrVideo');
        }
        const previewPhoto = preview.previewPhotoId
          ? parseGlobalID(preview.previewPhotoId)
          : null;
        const previewVideo = preview.video ?? null;

        const connectedTags = await prismaPothos.actuality.findUnique({
          where: {
            id: parseID(decodeGlobalID(id)),
          },
          select: {
            tags: {
              select: {
                name: true,
              },
            },
          },
        });

        const connectedImages = await prismaPothos.actuality.findUnique({
          where: {
            id: parseID(decodeGlobalID(id)),
          },
          select: {
            images: {
              select: {
                id: true,
              },
            },
          },
        });

        const tagsToDisconnect = connectedTags?.tags
          .map((tag) => tag.name)
          .filter((tagName) => !input.tags?.includes(tagName));

        const imagesToDisconnect = connectedImages?.images
          .map((img) => img.id)
          .filter((id) => !input.images?.includes(encodeGlobalID('Image', id)));

        const whereClause = previewVideo?.id
          ? { id: parseGlobalID(previewVideo.id) }
          : previewVideo?.videoId
          ? { videoId: previewVideo.videoId }
          : previewVideo?.link
          ? { link: previewVideo.link }
          : {
              id: 0,
            };

        const resolvedVideo = await prismaPothos.video.upsert({
          where: whereClause,
          update: {},
          create: {
            link: previewVideo?.link,
            videoId: previewVideo?.videoId,
            source: previewVideo?.source,
            thumbnailLink: previewVideo?.thumbnailLink,
          },
        });

        return await prismaPothos.actuality.update({
          ...query,
          where: {
            id: parseID(decodeGlobalID(id)),
          },
          data: {
            ...rest,
            activeTo: input.activeTo ? new Date(input.activeTo) : null,
            coverPhotoId: input.coverPhotoId
              ? parseID(decodeGlobalID(input.coverPhotoId))
              : null,
            videoId: previewVideo ? resolvedVideo.id : null,
            previewPhotoId: previewPhoto,
            productionId: input.productionId
              ? parseID(decodeGlobalID(input.productionId))
              : undefined,
            text: input.text as Prisma.InputJsonValue,
            images: {
              connect: input.images?.map((imgId) => ({
                id: parseID(decodeGlobalID(imgId)),
              })),
              disconnect: imagesToDisconnect?.map((imgId) => ({
                id: imgId,
              })),
            },
            tags: {
              connectOrCreate: input.tags?.map((tagName) => ({
                where: {
                  name: tagName,
                },
                create: {
                  name: tagName,
                },
              })),
              disconnect: tagsToDisconnect?.map((tagName) => ({
                name: tagName,
              })),
            },
          },
        });
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
          if (e.code === 'P2002') {
            throw new TranslatableError('actualityNotFound');
          }
        }
        throw e;
      }
    },
  }),

  setActualityActiveState: t.prismaField({
    description: 'Mutation for setting the `isActive` state of one actuality.',
    type: 'Actuality',
    nullable: true,
    errors: {
      types: [TranslatableError, ZodError],
    },
    args: {
      id: t.arg.id({
        required: true,
      }),
      isActive: t.arg.boolean({
        required: true,
      }),
    },
    resolve: async (query, _, { id }) => {
      try {
        return await prismaPothos.actuality.update({
          ...query,
          where: {
            id: parseID(id),
          },
          data: {
            status: ActualityStatusKey.Active,
          },
        });
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
          if (e.code === 'P2025') {
            throw new TranslatableError('actualityNotFound');
          }
        }
        throw e;
      }
    },
  }),

  setActualityPinnedState: t.prismaField({
    description: 'Mutation for setting the `isPinned` state of one actuality.',
    type: 'Actuality',
    nullable: true,
    errors: {
      types: [TranslatableError, ZodError],
    },
    args: {
      id: t.arg.id({
        required: true,
      }),
      isPinned: t.arg.boolean({
        required: true,
      }),
    },
    resolve: async (query, _, { id, isPinned }) => {
      try {
        return await prismaPothos.actuality.update({
          ...query,
          where: {
            id: parseID(decodeGlobalID(id)),
          },
          data: {
            isPinned: isPinned,
          },
        });
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
          if (e.code === 'P2025') {
            throw new TranslatableError('actualityNotFound');
          }
        }
        throw e;
      }
    },
  }),

  setManyActualitiesState: t.field({
    description:
      'Mutation for setting the `isActive` state of many actualities.',
    type: Count,
    nullable: true,
    args: {
      idList: t.arg.idList({
        required: true,
      }),
      isActive: t.arg.boolean({
        required: true,
      }),
    },
    resolve: async (_, { idList }) => {
      const numericIds = idList.map((id) => parseID(id));
      try {
        return await prismaPothos.actuality.updateMany({
          where: {
            id: {
              in: numericIds,
            },
          },
          data: {
            status: ActualityStatusKey.Active,
          },
        });
      } catch (e) {
        throw e;
      }
    },
  }),

  deleteActuality: t.prismaField({
    type: 'Actuality',
    nullable: true,
    errors: {
      types: [TranslatableError, ZodError],
    },
    args: {
      id: t.arg.id({
        required: true,
      }),
    },
    resolve: async (query, _, { id }) => {
      try {
        return await prismaPothos.actuality.delete({
          ...query,
          where: {
            id: parseGlobalID(id),
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === PrismaClientErrorCode.RecordNotFound) {
            throw new TranslatableError('actualityNotFound');
          }
        }
        throw e;
      }
    },
  }),
}));
