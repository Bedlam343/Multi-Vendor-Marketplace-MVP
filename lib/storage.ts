"server-only";

import { Storage } from "@google-cloud/storage";

export const storage = new Storage({ keyFilename: "gs-service-account.json" });

export const BUCKET_NAME = process.env.GCP_BUCKET_NAME!;
export const LISTING_IMAGES_DIR = process.env.GCP_LISTING_IMAGES_DIR!;

if (!BUCKET_NAME) {
    throw new Error("GCP_BUCKET_NAME is missing from environment variables");
}

if (!LISTING_IMAGES_DIR) {
    throw new Error(
        "GCP_LISTING_IMAGES_DIR is missing from environment variables",
    );
}
