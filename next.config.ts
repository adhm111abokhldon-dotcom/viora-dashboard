import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Loads the i18n request config from ./i18n/request.ts (the default path).
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);

