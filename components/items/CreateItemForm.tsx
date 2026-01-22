"use client";

import { useState, useRef, useActionState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
    Loader2,
    UploadCloud,
    X,
    DollarSign,
    Tag,
    FileText,
    ImageIcon,
    Sparkles,
    CheckCircle,
    LayoutDashboard,
    ArrowRight,
} from "lucide-react";
import imageCompression, {
    Options as ImageCompressionOptions,
} from "browser-image-compression";

import { createItemAction } from "@/services/item-actions";
import { getGCPUploadSignedUrl } from "@/services/upload-actions";
import { MAX_ITEM_IMAGES } from "@/utils/constants";
import { itemConditionEnum } from "@/utils/enums";

const CONDITIONS = itemConditionEnum.enumValues;

const COMPRESSION_OPTIONS: ImageCompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/webp",
};

// Helper for UX delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// SINGLE SOURCE OF TRUTH FOR UI STATE
type FormStatus =
    | "idle"
    | "optimizing"
    | "uploading"
    | "finalizing"
    | "success";

export default function CreateItemForm() {
    const router = useRouter();
    const pathname = usePathname();

    // 1. One state to rule them all
    const [formStatus, setFormStatus] = useState<FormStatus>("idle");

    const [state, formAction] = useActionState(createItemAction, {
        message: "",
        errors: {},
        success: false,
    } as any);

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- EFFECT: Watch Server Action Result ---
    // This is the ONLY place that turns off the 'finalizing' state
    useEffect(() => {
        if (state.success) {
            setFormStatus("success");
            window.history.replaceState(null, "", `${pathname}?status=success`);
        } else if (state.message && formStatus === "finalizing") {
            // If we were finalizing but got an error/message back, reset.
            setFormStatus("idle");
            alert(state.message); // Simple alert fallback, or show UI error
        }
    }, [state, formStatus, pathname]);

    // --- SUBMISSION LOGIC ---
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            // STATE 1: OPTIMIZING
            setFormStatus("optimizing");
            await delay(800); // Artificial delay for UX

            // Perform Compression
            const compressedFiles = await Promise.all(
                selectedFiles.map(async (file) => {
                    if (file.size / 1024 / 1024 < 1) return file;
                    try {
                        return await imageCompression(
                            file,
                            COMPRESSION_OPTIONS,
                        );
                    } catch (err) {
                        console.error("Compression skipped", err);
                        return file;
                    }
                }),
            );

            // STATE 2: UPLOADING
            setFormStatus("uploading");
            await delay(800); // Artificial delay for UX

            // Perform Uploads
            const uploadPromises = compressedFiles.map(async (file) => {
                const { success, signedUrl, fileUrl } =
                    await getGCPUploadSignedUrl(file.type, file.size);
                if (!success || !signedUrl)
                    throw new Error("Failed to sign URL");

                const res = await fetch(signedUrl, {
                    method: "PUT",
                    body: file,
                    headers: { "Content-Type": file.type },
                });
                if (!res.ok) throw new Error("Upload to cloud failed");

                return fileUrl as string;
            });

            const uploadedUrls = await Promise.all(uploadPromises);

            // Clean FormData
            formData.delete("images");
            formData.delete("images_raw");
            uploadedUrls.forEach((url) => formData.append("images", url));

            // STATE 3: FINALIZING
            // We set this manually. We do NOT wait for isActionPending.
            // This ensures the overlay stays up until the useEffect above sees a result.
            setFormStatus("finalizing");
            await delay(500); // Tiny pause before server action ensures UI updates

            formAction(formData);
        } catch (error) {
            console.error(error);
            setFormStatus("idle");
            alert("Something went wrong. Please try again.");
        }
    };

    // --- HELPERS ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const totalFiles = selectedFiles.length + newFiles.length;
            if (totalFiles > MAX_ITEM_IMAGES)
                return alert(`Max ${MAX_ITEM_IMAGES} images.`);

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
        URL.revokeObjectURL(newPreviews[index]);
        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);
        setSelectedFiles(newFiles);
        setPreviews(newPreviews);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- RENDER: SUCCESS VIEW ---
    if (formStatus === "success") {
        return (
            <div className="bg-card border border-border rounded-xl p-12 shadow-sm text-center animate-in fade-in zoom-in duration-500 flex flex-col items-center mt-8">
                <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-500/5">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-3">
                    Item Listed!
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
                    Your item is now live on the marketplace.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
                    <Link
                        href="/dashboard"
                        className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-border bg-background hover:bg-muted font-medium transition-colors"
                    >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link
                        href={`/items/${state.newItemId}`}
                        className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all shadow-lg shadow-primary/20 group"
                    >
                        View Listing{" "}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        );
    }

    // --- RENDER: MAIN FORM ---
    const isLoading = formStatus !== "idle";

    return (
        <>
            {/* GLOBAL OVERLAY */}
            {isLoading && (
                <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center text-primary animate-pulse">
                                {formStatus === "optimizing" && (
                                    <Sparkles className="w-8 h-8" />
                                )}
                                {formStatus === "uploading" && (
                                    <UploadCloud className="w-8 h-8" />
                                )}
                                {formStatus === "finalizing" && (
                                    <Loader2 className="w-8 h-8" />
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">
                                Just a moment
                            </h3>
                            <p className="text-muted-foreground mt-2 font-medium">
                                {formStatus === "optimizing" &&
                                    "Optimizing images..."}
                                {formStatus === "uploading" &&
                                    "Uploading photos..."}
                                {formStatus === "finalizing" &&
                                    "Finalizing listing..."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER (Only visible when NOT success) */}
            <div className="mb-8 space-y-2 animate-in fade-in slide-in-from-left-4 duration-500">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    What are you selling?
                </h1>
                <p className="text-muted-foreground">
                    Provide details about your item to help buyers find it.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                {/* Images */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
                        <ImageIcon className="w-5 h-5 text-primary" /> Photos
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
                        {previews.length < MAX_ITEM_IMAGES && (
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
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    {state?.errors?.images && (
                        <p className="text-sm text-destructive mt-2">
                            {state.errors.images[0]}
                        </p>
                    )}
                </div>

                {/* Inputs */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Tag className="w-4 h-4 text-muted-foreground" />{" "}
                            Title
                        </label>
                        <input
                            name="title"
                            required
                            minLength={5}
                            className="w-full p-3 bg-background border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                            placeholder="e.g. Vintage Camera"
                        />
                        {state?.errors?.title && (
                            <p className="text-sm text-destructive">
                                {state.errors.title[0]}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />{" "}
                                Price (USD)
                            </label>
                            <input
                                name="price"
                                type="number"
                                step="0.01"
                                required
                                className="w-full p-3 bg-background border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                                placeholder="0.00"
                            />
                            {state?.errors?.price && (
                                <p className="text-sm text-destructive">
                                    {state.errors.price[0]}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-muted-foreground" />{" "}
                                Condition
                            </label>
                            <select
                                name="condition"
                                required
                                defaultValue=""
                                className="w-full p-3 bg-background border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
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

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />{" "}
                            Description
                        </label>
                        <textarea
                            name="description"
                            required
                            minLength={10}
                            rows={5}
                            className="w-full p-3 bg-background border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="Describe your item..."
                        />
                        {state?.errors?.description && (
                            <p className="text-sm text-destructive">
                                {state.errors.description[0]}
                            </p>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Post Item
                    </button>
                </div>
            </form>
        </>
    );
}
