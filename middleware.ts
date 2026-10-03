import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match every request that is not a static file / internal Next path.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
