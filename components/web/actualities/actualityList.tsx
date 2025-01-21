'use client'

import * as React from 'react'
import { ActualityListItemFragment } from '@/graphql/generated/graphql'
import ActualityCard from '@/components/web/actualities/actualityCard'

export default function ActualityList({ actualities }: { actualities?: ActualityListItemFragment[] }) {
  return (
    <section className="flex w-full flex-col items-center gap-10 pt-5 md:hover:scale-100">
      {actualities?.map((actuality, i) => {
        return <ActualityCard key={actuality.id} actuality={actuality} />
      })}
    </section>
  )
}
