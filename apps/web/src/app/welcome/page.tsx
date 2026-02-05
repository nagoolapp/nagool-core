"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function WelcomePage() {
  const [tenantId, setTenantId] = useState("");
  const [widgetKey, setWidgetKey] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTenantId(localStorage.getItem("tenantId") || "");
    setWidgetKey(localStorage.getItem("widgetKey") || "");
  }, []);

  const embed = useMemo(() => {
    if (!widgetKey) return "";
    return `<script src="${process.env.NEXT_PUBLIC_WIDGET_JS}" data-nagool-api="${process.env.NEXT_PUBLIC_API_BASE}" data-nagool-key="${widgetKey}"></script>`;
  }, [widgetKey]);

  async function copy() {
    if (!embed) return;
    await navigator.clipboard.writeText(embed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Welcome to NAGOOL 🎉</h1>

      {!tenantId || !widgetKey ? (
        <div className="p-4 rounded border bg-white">
          <p className="text-red-600 font-semibold mb-2">No signup data found.</p>
          <p className="text-gray-600 mb-4">Go signup again to create a workspace.</p>
          <Link href="/signup" className="inline-block bg-black text-white px-5 py-2 rounded">
            Go to Signup →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 mb-6">
            <div className="bg-white border rounded p-4">
              <div className="text-gray-500 text-sm">Tenant ID</div>
              <div className="font-mono">{tenantId}</div>
            </div>

            <div className="bg-white border rounded p-4">
              <div className="text-gray-500 text-sm">Widget Key</div>
              <div className="font-mono">{widgetKey}</div>
            </div>
          </div>

          <div className="bg-white border rounded p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Embed Script</div>
              <button onClick={copy} className="px-3 py-1 rounded bg-black text-white text-sm">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">{embed}</pre>
          </div>

          <Link href="/app" className="inline-block bg-black text-white px-5 py-2 rounded">
            Go to Dashboard →
          </Link>
        </>
      )}
    </main>
  );
}
