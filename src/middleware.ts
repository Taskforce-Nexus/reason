import { proxy } from './proxy'

export default proxy

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|branding|robots.txt|sitemap.xml|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
