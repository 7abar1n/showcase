import { CardImage } from '../ui/card';
import {
  ActualityListItemFragment,
  VideoSource,
} from '@/graphql/generated/graphql';
import YouTubeVideo from '../widgets/video/YouTubeVideo';
import ClientsVideo from '../widgets/video/ClientsVideo';
import { ActualityLink } from './ActualityLink';
import { Tooltip } from '@ui/tooltip';
import { Pin } from 'lucide-react';
import React from 'react';

const StyledPreview = ({
  isPinned,
  children,
}: React.PropsWithChildren<{ isPinned: boolean }>) => (
  <div className="relative aspect-video w-full object-cover object-center">
    {children}
    <div className="absolute right-0 top-0 m-2">
      {isPinned && (
        <Tooltip label="Připnutá aktualita">
          <Pin className="text-white" />
        </Tooltip>
      )}
    </div>
  </div>
);

/**
 * Component that renders either an Image, YouTube or clients video
 */
export const ActualityCardPreview = ({
  actuality,
}: {
  actuality: ActualityListItemFragment;
}) => {
  const preview =
    actuality.video || actuality.previewPhoto || actuality.coverPhoto;
  if (!preview) return null;
  if (preview.__typename === 'Image')
    return (
      <ActualityLink
        isExternal={actuality.isExternal}
        link={actuality.video?.link || actuality.link}
        slug={actuality.slug}
      >
        <StyledPreview isPinned={actuality.isPinned}>
          <CardImage
            src={preview.link}
            alt={preview?.name || ''}
            title={preview?.name || ''}
            width={920}
            height={520}
          />
        </StyledPreview>
      </ActualityLink>
    );
  if (preview.__typename === 'Video') {
    return preview.source === VideoSource.YouTube ? (
      <StyledPreview isPinned={actuality.isPinned}>
        <YouTubeVideo video={preview} autoplay />
      </StyledPreview>
    ) : (
      <StyledPreview isPinned={actuality.isPinned}>
        <ClientsVideo video={preview} />
      </StyledPreview>
    );
  }
};

export default ActualityCardPreview;
