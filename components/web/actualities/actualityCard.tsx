import React from 'react'
import { ActualityListItemFragment } from '@/graphql/generated/graphql'
import { Typography } from '@/components/web/ui/typography'
import TagsCloud from '@/components/web/tag/TagsCloud'
import { ActualityLink } from './ActualityLink'
import { Card } from '../ui/card'
import { useFormatter } from 'next-intl'
import { DateFormat } from '@/lib/utils/formatUtils'
import ActualityCardPreview from './actualityCardPreview'
import { cn } from '@/lib/twUtils'

export const ActualityCardTime = ({ dateTime }: { dateTime: Date }) => {
  const format = useFormatter()
  return (
    <Typography className="whitespace-nowrap pt-1 text-sm" component="span">
      {format.dateTime(dateTime, DateFormat.Date)}
    </Typography>
  )
}

export const ActualityCardSummary = ({
  summary,
  className,
}: {
  summary?: string | null
  className?: string
}) => {
  return (
    <div className="pt-4">
      <Typography
        variant="body0"
        className={cn(`line-clamp-4 text-justify md:line-clamp-3 lg:text-base`, className)}
        component="p"
      >
        {summary}
      </Typography>
    </div>
  )
}
const ActualityCard = ({ actuality }: { actuality: ActualityListItemFragment }) => {
  const activeSinceDate = new Date(actuality.activeSince)

  return (
    <Card className="hoverScaleEffect w-full md:hover:scale-micro ">
      <ActualityCardPreview actuality={actuality} />
      <div className="px-4 py-2 md:px-8 md:pb-6 md:pt-8">
        <div className="flex flex-col">
          <ActualityLink
            isExternal={actuality.isExternal}
            link={actuality.link}
            slug={actuality.slug}
            className="link-with-underline-transition"
          >
            <Typography component="h1" variant="h3" className={'font-black'}>
              {actuality.title}
            </Typography>
          </ActualityLink>
          <ActualityCardTime dateTime={activeSinceDate} />
        </div>
        <ActualityCardSummary summary={actuality.summary} />

        <div className="pt-4">
          {!!actuality.tags?.length && (
            <TagsCloud tags={actuality.tags} singleRow variant={'platinumTagBg'} />
          )}
        </div>
      </div>
    </Card>
  )
}

export default ActualityCard
