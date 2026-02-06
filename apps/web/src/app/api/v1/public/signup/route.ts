import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL;

    if (!apiBase) {
      return NextResponse.json(
        { ok: false, error: "Missing API_BASE_URL env var on server." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const upstream = await fetch(`${apiBase}/v1/public/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": req.headers.get("user-agent") ?? "nagool-web",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await upstream.text();

    // Always return JSON to the client (even if upstream sends HTML)
    try {
      const data = text ? JSON.parse(text) : null;
      return NextResponse.json(data, { status: upstream.status });
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Upstream did not return JSON.",
          status: upstream.status,
          raw: text?.slice(0, 300),
        },
        { status: 502 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Proxy error" },
      { status: 500 }
    );
  }
}
