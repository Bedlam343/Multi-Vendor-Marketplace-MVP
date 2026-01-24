"use server";

import { v4 as uuidv4 } from "uuid";
import { authenticatedAction } from "@/lib/safe-action";
import { storage, BUCKET_NAME, LISTING_IMAGES_DIR } from "@/lib/storage";
import { GCS_FILE_TYPES, GCS_MAX_SIZE, GCS_DOMAIN } from "@/utils/constants";

type GetSignedURLResponse = {
    success: boolean;
    signedUrl?: string;
    fileUrl?: string;
    message?: string;
};

export const getGCPUploadSignedUrl = async (
    fileType: string,
    fileSize: number,
): Promise<GetSignedURLResponse> => {
    return authenticatedAction(
        { fileType, fileSize },
        async (data, session) => {
            const { fileType, fileSize } = data;

            if (!GCS_FILE_TYPES.includes(fileType)) {
                return {
                    success: false,
                    message:
                        "Invalid file type. Only JPG, PNG, and WebP are allowed.",
                };
            }

            if (fileSize > GCS_MAX_SIZE) {
                return {
                    success: false,
                    message: "File size must be less than 5MB.",
                };
            }

            const extension = fileType.split("/")[1];
            const username_id = `${session.user.name}_${session.user.id}`;
            const filename = `${LISTING_IMAGES_DIR}/${
                username_id
            }/${uuidv4()}.${extension}`;

            try {
                const result = await storage
                    .bucket(BUCKET_NAME)
                    .file(filename)
                    .getSignedUrl({
                        version: "v4",
                        action: "write",
                        expires: Date.now() + 5 * 60 * 1000, // 5 minutes
                        contentType: fileType,
                    });

                const fileUrl = `https://${GCS_DOMAIN}/${BUCKET_NAME}/${filename}`;

                return { success: true, signedUrl: result[0], fileUrl };
            } catch (error) {
                console.error("Error generating signed URL:", error);
                return {
                    success: false,
                    message: "Failed to generate upload signed URL.",
                };
            }
        },
    );
};
