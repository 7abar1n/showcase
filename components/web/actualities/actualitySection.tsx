'use client'

import * as React from 'react'
import { useState } from 'react'

import { fetchActualities } from '@/app/[locale]/(web)/actions'
import {
  Actuality,
  GetWebActualityListQuery,
  QueryActualityListWebConnectionEdge,
} from '@/graphql/generated/graphql'
import { Button } from '@/components/web/ui/button'
import { useTranslations } from 'next-intl'
import { Typography } from '@/components/web/ui/typography'
import ActualityList from './actualityList'
import { ArrowRight, LoaderIcon } from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import { Link } from '@/navigation'

export default function ActualitySection({
  initialData,
}: {
  initialData: GetWebActualityListQuery | undefined
}) {
  const mappedInitialActualities = initialData?.actualityListWeb.edges.filter(
    (el): el is QueryActualityListWebConnectionEdge => !!el,
  )

  const [actualities, setActualities] = useState<QueryActualityListWebConnectionEdge[]>(
    mappedInitialActualities || [],
  )
  const [hasNextPage, setHasNextPage] = useState<boolean | undefined>(
    initialData?.actualityListWeb.pageInfo.hasNextPage,
  )

  const [isLoading, setIsLoading] = useState(false)

  async function loadActualities() {
    setIsLoading(true)

    const after = actualities?.length !== 0 ? actualities[actualities.length - 1].cursor : null
    const data = await fetchActualities({ take: 3, after: after })

    if (data) {
      setHasNextPage(data.actualityListWeb.pageInfo.hasNextPage)
      const actualityEdges = data.actualityListWeb.edges.filter(
        (el): el is QueryActualityListWebConnectionEdge => !!el,
      )

      setActualities((prev) => [...(prev?.length ? prev : []), ...actualityEdges])
      setIsLoading(false)
    }
  }

  const t = useTranslations('web.actualityList')
  const { ref } = useInView({
    onChange: (inView) => {
      if (inView) {
        loadActualities()
      }
    },
  })
  const loadingElement =
    actualities.length < 10 ? (
      <div ref={ref}>
        {isLoading && (
          <div>
            <LoaderIcon className="animate-spin" />
          </div>
        )}
      </div>
    ) : (
      <Button variant={'outline'} asChild>
        <Link href={{ pathname: '/actuality' }}>
          <span>{t('showAllActualities')}</span> <ArrowRight className="h-4" />
        </Link>
      </Button>
    )

  return (
    <section className="mx-auto flex w-full max-w-[58.125rem] flex-col items-center gap-2 ">
      <Typography component={'h3'} variant={'h5'} className="flex w-full justify-start pl-0 uppercase">
        {t('currentlyInTheatre')}
      </Typography>
      <ActualityList actualities={actualities.map((el) => el?.node).filter((el): el is Actuality => !!el)} />
      <div className={'justify-left flex w-full justify-center py-5'}>
        {hasNextPage ? loadingElement : null}
      </div>
    </section>
  )
}
