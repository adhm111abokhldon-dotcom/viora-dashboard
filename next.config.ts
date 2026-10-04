import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Loads the i18n request config from ./i18n/request.ts (the default path).
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    domains: ["res.cloudinary.com"],
  },
};

export default withNextIntl(nextConfig);
