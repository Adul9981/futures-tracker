const REFERRAL_PARAM = 'via=serene77mc-g6kj'
const HOME_REF = 'r=adul'

export function getHomeLink(): string {
  return `https://polymarket.com/?${HOME_REF}`
}

export function getEventLink(slug: string): string {
  return `https://polymarket.com/event/${slug}?${REFERRAL_PARAM}`
}
