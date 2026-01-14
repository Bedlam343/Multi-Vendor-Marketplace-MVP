// runs on every single request that matches the matcher
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export const proxy = async (request: NextRequest) => {
    // A "light" authentication check
    // Use "heavy" session validation in the page/server code as needed
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
};

export const config = {
    matcher: ["/dashboard/:path*"],
};
