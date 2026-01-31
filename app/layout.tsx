import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

import { auth } from "@/lib/auth";
import GlobalDemoWidget from "@/components/auth/GlobalDemoWidget";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Multi-Vendor Marketplace",
    description: "A marketplace MVP for buying and selling goods and services.",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth.api.getSession({ headers: await headers() });

    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
            >
                {children}

                {Boolean(session) ? null : <GlobalDemoWidget />}
            </body>
        </html>
    );
}
