"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

/**
 * Expected API response shape
 */
type SignupResponse =
  | { ok: true; token: string; tenantId: string; widgetKey: string }
  | { ok?: false; error?: string; message?: unknown };

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const form = new FormData(e.currentTarget);

      const payload = {
        businessName: String(form.get("businessName") ?? "").trim(),
        industry: String(form.get("industry") ?? "").trim(),
        city: String(form.get("city") ?? "").trim(),
        mobile: String(form.get("mobile") ?? "").trim(),
        password: String(form.get("password") ?? ""),
      };

      // basic client-side validation
      if (!payload.businessName || !payload.mobile || !payload.password) {
        setError("Business name, mobile, and password are required.");
        return;
      }

      // IMPORTANT:
      // Same-origin call -> https://nagool.com/api/...
      // This hits Next Route Handler which proxies to https://api.nagool.com
      const res = await fetch(`/api/v1/public/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      let data: SignupResponse;
      try {
        data = text ? (JSON.parse(text) as SignupResponse) : {};
      } catch {
        setError(`Server returned non-JSON (HTTP ${res.status}).`);
        return;
      }

      if (!res.ok || !("ok" in data) || data.ok !== true) {
        const raw = (data as any)?.error ?? (data as any)?.message;
        const msg =
          typeof raw === "string"
            ? raw
            : raw
            ? JSON.stringify(raw)
            : `Signup failed (HTTP ${res.status})`;

        setError(msg);
        return;
      }

      // persist session data
      localStorage.setItem("token", data.token);
      localStorage.setItem("tenantId", data.tenantId);
      localStorage.setItem("widgetKey", data.widgetKey);

      router.push("/welcome");
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? `Network error: ${err.message}`
          : "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <form
        onSubmit={submit}
        className="w-full max-w-md border p-6 rounded-lg space-y-4 bg-white"
      >
        <h2 className="text-2xl font-bold">Create your workspace</h2>

        <input
          name="businessName"
          placeholder="Business name"
          required
          className="w-full border p-2 rounded"
        />

        <input
          name="industry"
          placeholder="Industry"
          className="w-full border p-2 rounded"
        />

        <input
          name="city"
          placeholder="City"
          className="w-full border p-2 rounded"
        />

        <input
          name="mobile"
          type="tel"
          placeholder="Mobile"
          required
          className="w-full border p-2 rounded"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full border p-2 rounded"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded disabled:opacity-60"
        >
          {loading ? "Creating..." : "Start Free Trial"}
        </button>
      </form>
    </main>
  );
}
