import { NextRequest, NextResponse } from "next/server";

/**
 * Verify that the request includes a valid API_SECRET bearer token.
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { success: false, error: "Server misconfigured: API_SECRET not set" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}
