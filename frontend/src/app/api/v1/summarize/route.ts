import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate the request body
        if (!body.text || typeof body.text !== "string") {
            return NextResponse.json(
                { detail: "Missing or invalid 'text' field" },
                { status: 400 }
            );
        }

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

        try {
            // Forward request to backend
            const response = await fetch(`${BACKEND_URL}/api/v1/summarize`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: body.text,
                    max_length: body.max_length || 150,
                    min_length: body.min_length || 50,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeout);

            const data = await response.json();

            if (!response.ok) {
                console.error("Backend error response:", { status: response.status, data });
                return NextResponse.json(data, { status: response.status });
            }

            return NextResponse.json(data, { status: 200 });
        } finally {
            clearTimeout(timeout);
        }
    } catch (error) {
        console.error("Summarize API error:", error);

        // Return more detailed error information
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        return NextResponse.json(
            {
                detail: `Failed to summarize text. Backend error: ${errorMessage}`,
                error: errorMessage
            },
            { status: 502 }
        );
    }
}
