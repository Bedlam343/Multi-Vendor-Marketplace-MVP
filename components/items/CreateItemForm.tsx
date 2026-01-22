"use client";

import { useState, useRef, useActionState } from "react";
import Image from "next/image";
import {
    Loader2,
    UploadCloud,
    X,
    DollarSign,
    Tag,
    FileText,
    ImageIcon,
    Sparkles,
} from "lucide-react";

import { createItemAction } from "@/services/item-actions";
import { getGCPUploadSignedUrl } from "@/services/upload-actions";

// Constants
const MAX_IMAGES = 5;
const CONDITIONS = ["new", "like-new", "good", "fair", "poor"];

export default function CreateItemForm() {
    // REACT 19: usage of useActionState
    // Returns: [currentState, dispatchFunction, isPending]
    const [state, formAction, isActionPending] = useActionState(
        createItemAction,
        {
            message: "",
            errors: {},
        },
    );

    // Local State
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Handlers ---

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const totalFiles = selectedFiles.length + newFiles.length;

            if (totalFiles > MAX_IMAGES) {
                alert(`You can only upload up to ${MAX_IMAGES} images.`);
                return;
            }

            // Create previews
            const newPreviews = newFiles.map((file) =>
                URL.createObjectURL(file),
            );

            setSelectedFiles((prev) => [...prev, ...newFiles]);
            setPreviews((prev) => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        const newFiles = [...selectedFiles];
        const newPreviews = [...previews];

        // Revoke URL to prevent memory leaks
        URL.revokeObjectURL(newPreviews[index]);

        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);

        setSelectedFiles(newFiles);
        setPreviews(newPreviews);

        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- The Core Logic: Intercept Submit to Upload Images First ---
    const handleSubmit = async (formData: FormData) => {
        setUploading(true);

        try {
            const uploadedUrls: string[] = [];

            // 1. Upload Images to GCS (Parallel)
            const uploadPromises = selectedFiles.map(async (file) => {
                // A. Get Signed URL
                const { success, signedUrl, fileUrl, message } =
                    await getGCPUploadSignedUrl(file.type, file.size);

                if (!success || !signedUrl || !fileUrl) {
                    throw new Error(message || "Failed to get upload URL");
                }

                // B. Upload to GCS
                const uploadRes = await fetch(signedUrl, {
                    method: "PUT",
                    body: file,
                    headers: { "Content-Type": file.type },
                });

                if (!uploadRes.ok)
                    throw new Error("Failed to upload image to storage");

                return fileUrl;
            });

            const results = await Promise.all(uploadPromises);
            uploadedUrls.push(...results);

            // 2. Append URLs to FormData
            formData.delete("images");
            uploadedUrls.forEach((url) => formData.append("images", url));

            // 3. Call the Server Action
            // useActionState handles the pending state automatically when this is called
            formAction(formData);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload images. Please try again.");
        } finally {
            // We stop the "uploading" spinner, but if formAction started,
            // isActionPending will take over for the button state
            setUploading(false);
        }
    };

    return (
        <form
            action={handleSubmit}
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
            {/* Image Upload Section */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    Photos
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {previews.map((src, idx) => (
                        <div
                            key={idx}
                            className="relative aspect-square rounded-lg overflow-hidden border border-border group"
                        >
                            <Image
                                src={src}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {previews.length < MAX_IMAGES && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-secondary/50 transition-colors flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-primary"
                        >
                            <UploadCloud className="w-8 h-8 mb-2" />
                            <span className="text-xs font-medium">
                                Add Photo
                            </span>
                        </div>
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    name="images_raw"
                />
                <p className="text-xs text-muted-foreground mt-3">
                    Upload up to {MAX_IMAGES} photos. First photo will be the
                    cover.
                </p>
                {state?.errors?.images && (
                    <p className="text-sm text-destructive mt-2">
                        {state.errors.images[0]}
                    </p>
                )}
            </div>

            {/* Details Section */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                {/* Title */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" /> Title
                    </label>
                    <input
                        name="title"
                        required
                        minLength={5}
                        placeholder="e.g. Vintage Leather Jacket"
                        className="w-full p-3 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                    {state?.errors?.title && (
                        <p className="text-sm text-destructive">
                            {state.errors.title[0]}
                        </p>
                    )}
                </div>

                {/* Price & Condition Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />{" "}
                            Price (USD)
                        </label>
                        <input
                            name="price"
                            type="number"
                            step="0.01"
                            required
                            placeholder="0.00"
                            className="w-full p-3 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                        {state?.errors?.price && (
                            <p className="text-sm text-destructive">
                                {state.errors.price[0]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-muted-foreground" />{" "}
                            Condition
                        </label>
                        <select
                            name="condition"
                            required
                            defaultValue=""
                            className="w-full p-3 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                        >
                            <option value="" disabled>
                                Select condition
                            </option>
                            {CONDITIONS.map((c) => (
                                <option key={c} value={c}>
                                    {c.charAt(0).toUpperCase() + c.slice(1)}
                                </option>
                            ))}
                        </select>
                        {state?.errors?.condition && (
                            <p className="text-sm text-destructive">
                                {state.errors.condition[0]}
                            </p>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />{" "}
                        Description
                    </label>
                    <textarea
                        name="description"
                        required
                        minLength={10}
                        rows={5}
                        placeholder="Describe your item... (brand, size, flaws, etc.)"
                        className="w-full p-3 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                    />
                    {state?.errors?.description && (
                        <p className="text-sm text-destructive">
                            {state.errors.description[0]}
                        </p>
                    )}
                </div>
            </div>

            {/* Global Error */}
            {!state?.success && state?.message && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm font-medium">
                    {state.message}
                </div>
            )}

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-4 pt-4">
                <button
                    type="submit"
                    disabled={uploading || isActionPending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />{" "}
                            Uploading Images...
                        </>
                    ) : isActionPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />{" "}
                            Creating Listing...
                        </>
                    ) : (
                        "Post Item"
                    )}
                </button>
            </div>
        </form>
    );
}
