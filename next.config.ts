import type { NextConfig } from "next";
import withPWA, { runtimeCaching } from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  customWorkerSrc: "worker",
  customWorkerPrefix: "swe-worker",
  workboxOptions: {
    runtimeCaching: [
      {
        // 로그인과 인증 코드 응답은 기기에 캐시하지 않습니다.
        urlPattern: /^https?:\/\/[^/]+\/(?:auth\/|login(?:[/?]|$))/,
        handler: "NetworkOnly",
      },
      ...runtimeCaching,
    ],
  },
})(nextConfig);
