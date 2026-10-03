import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/*
 * Locale-aware navigation primitives.
 *
 * Every internal Link / router / pathname usage in the app goes through
 * these so hrefs stay locale-independent ("/dashboard") while the actual
 * URLs are always prefixed ("/en/dashboard", "/ar/dashboard").
 */
export const { Link, useRouter, usePathname, redirect, getPathname } =
  createNavigation(routing);
