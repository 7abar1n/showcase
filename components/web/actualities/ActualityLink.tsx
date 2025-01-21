import { Maybe } from '@/graphql/generated/graphql'
import { Link } from '@/navigation'
import { ReactNode } from 'react'

export const ActualityLink = ({
  isExternal,
  link,
  slug,
  className,
  children,
}: {
  isExternal: boolean
  link?: Maybe<string>
  slug: string
  className?: string
  children: ReactNode
}) => {
  if (isExternal && link)
    return (
      <a className={className} href={link} target="_blank">
        {children}
      </a>
    )
  if (!isExternal && link)
    return (
      <a className={className} href={link} target="_blank">
        {children}
      </a>
    )
  if (!isExternal)
    return (
      <Link className={className} href={{ pathname: '/actuality/[slug]', params: { slug } }}>
        {children}
      </Link>
    )
  return children
}
