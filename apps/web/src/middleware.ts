import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://localia-web.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  // Preflight (OPTIONS)
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (isAllowed) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
    }
    return response;
  }

  // Peticion normal — dejar pasar y anadir headers
  const response = NextResponse.next();
  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
