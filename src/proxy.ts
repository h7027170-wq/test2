import { NextResponse, type NextRequest } from "next/server";
import { isLocale, matchLocale } from "@/i18n/config";

/** Every route carries a locale prefix. Visitors without one are redirected by Accept-Language (default /ar). */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];
  if (isLocale(first)) return NextResponse.next();
  const locale = matchLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|icon.svg|robots.txt|.*\..*).*)"],
};
