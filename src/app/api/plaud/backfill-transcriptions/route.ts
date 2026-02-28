import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { AppError, createErrorResponse, ErrorCode } from "@/lib/errors";
import { backfillPlaudTranscriptions } from "@/lib/sync/sync-recordings";

export async function POST(request: Request) {
    try {
        let userId: string | null = null;

        // Allow internal calls with X-Internal-Secret + X-User-Email
        const internalSecret = request.headers.get("x-internal-secret");
        const userEmail = request.headers.get("x-user-email");
        if (
            internalSecret &&
            internalSecret === process.env.BETTER_AUTH_SECRET &&
            userEmail
        ) {
            const [user] = await db
                .select({ id: users.id })
                .from(users)
                .where(eq(users.email, userEmail))
                .limit(1);
            if (user) userId = user.id;
        }

        // Fall back to session auth
        if (!userId) {
            const session = await auth.api.getSession({
                headers: request.headers,
            });
            userId = session?.user?.id ?? null;
        }

        if (!userId) {
            const error = new AppError(
                ErrorCode.UNAUTHORIZED,
                "You must be logged in",
                401,
            );
            const response = createErrorResponse(error);
            return NextResponse.json(response.body, {
                status: response.status,
            });
        }

        const result = await backfillPlaudTranscriptions(userId);

        return NextResponse.json({
            success: true,
            filled: result.filled,
            errors: result.errors,
        });
    } catch (error) {
        console.error("Error backfilling transcriptions:", error);
        const response = createErrorResponse(error, ErrorCode.PLAUD_API_ERROR);
        return NextResponse.json(response.body, { status: response.status });
    }
}
