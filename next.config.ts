import type { NextConfig } from "next";
import { GCS_DOMAIN } from "@/utils/constants";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: GCS_DOMAIN,
            },
        ],
    },
};

export default nextConfig;
