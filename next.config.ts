import type { NextConfig } from "next";
import { GCS_DOMAIN } from "@/utils/constants";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            allowedOrigins: [
                "localhost:3000",
                "bug-free-parakeet-g669x4p49pqh9p7q-3000.app.github.dev",
                "https://bug-free-parakeet-g669x4p49pqh9p7q-3000.app.github.dev",
            ],
        },
    },
    async redirects() {
        return [
            {
                source: "/",
                destination: "/search",
                permanent: true, // cache the redirect (Status 308)
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: GCS_DOMAIN,
            },
            {
                protocol: "https",
                hostname: "api.dicebear.com",
            },
        ],
    },
};

export default nextConfig;
