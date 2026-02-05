"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/public/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobile: form.get("mobile"),
        password: form.get("password"),
        businessName: form.get("businessName"),
        industry: form.get("industry"),
        city: form.get("city"),
      }),
    });

    const data = await res.json();

    if (!res.ok || !data?.ok) {
      setError(data?.error || "Signup failed");
      setLoading(false);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("tenantId", data.tenantId);
    localStorage.setItem("widgetKey", data.widgetKey);

    router.push("/welcome");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-md border p-6 rounded-lg space-y-4 bg-white">
        <h2 className="text-2xl font-bold">Create your workspace</h2>

        <input name="businessName" placeholder="Business name" required className="w-full border p-2 rounded" />
        <input name="industry" placeholder="Industry" className="w-full border p-2 rounded" />
        <input name="city" placeholder="City" className="w-full border p-2 rounded" />
        <input name="mobile" placeholder="Mobile" required className="w-full border p-2 rounded" />
        <input name="password" type="password" placeholder="Password" required className="w-full border p-2 rounded" />

        {error && <p className="text-red-600">{error}</p>}

        <button disabled={loading} className="w-full bg-black text-white py-2 rounded">
          {loading ? "Creating..." : "Start Free Trial"}
        </button>
      </form>
    </main>
  );
}
