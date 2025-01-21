import { graphql } from '@/graphql/generated';

export const ActualityListItem = graphql(`
  fragment ActualityListItem on Actuality {
    id
    title
    summary
    activeSince
    slug
    tags {
      ...TagProps
    }
    isExternal
    isPinned
    link
    coverPhoto {
      ...Photo
    }
    previewPhoto {
      ...Photo
    }
    video {
      ...VideoPreview
    }
  }
`);
export const ActualityListItemEdge = graphql(`
  fragment ActualityListItemEdge on QueryActualitySearchByTagsWebConnectionEdge {
    node {
      ...ActualityListItem
    }
    cursor
  }
`);

export const GetWebActualityList = graphql(`
  query GetWebActualityList($first: Int, $after: String) {
    actualityListWeb(first: $first, after: $after) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
        node {
          isPinned
          id
          title
          subTitle
          tags {
            ...TagProps
          }
          coverPhoto {
            ...Photo
          }
          previewPhoto {
            ...Photo
          }
          video {
            ...VideoPreview
          }
          summary
          text
          activeSince
          link
          isExternal
          slug
          updatedAt
        }
      }
    }
  }
`);

export const GetWebActualityDetail = graphql(`
  query GetWebActualityDetail($slug: String!) {
    actualityDetailBySlug(slug: $slug) {
      id
      title
      slug
      activeSince
      activeTo
      text
      summary
      subTitle
      coverPhoto {
        ...Photo
      }
      previewPhoto {
        ...Photo
      }
      images {
        ...Photo
      }
      tags {
        ...TagProps
      }
      video {
        link
      }
      production {
        id
        name
      }
    }
  }
`);

export const GetRelatedActualitiesByTags = graphql(`
  query GetRelatedActualitiesByTags(
    $tagIds: [ID!]!
    $ignoredActualityId: ID
    $first: Int
  ) {
    relatedActualitiesByTags(
      tagIds: $tagIds
      ignoredActualityId: $ignoredActualityId
      first: $first
    ) {
      edges {
        node {
          ...ActualityListItem
        }
      }
    }
  }
`);
export const SearchActualitiesByTags = graphql(`
  query actualitySearchById($tagIds: [Int!]!, $first: Int, $after: String) {
    actualitySearchByTagsWeb(tagIds: $tagIds, first: $first, after: $after) {
      edges {
        ...ActualityListItemEdge
      }
      pageInfo {
        ...PageInfo
      }
    }
  }
`);
export const TextSearchActualities = graphql(`
  query actualityTextSearchListWeb($search: String!, $first: Int) {
    actualityTextSearchListWeb(search: $search, first: $first) {
      edges {
        node {
          ...ActualityListItem
        }
      }
    }
  }
`);
