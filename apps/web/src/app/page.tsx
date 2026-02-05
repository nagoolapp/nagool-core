import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="text-4xl font-bold mb-4">NAGOOL</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-xl">
        AI assistant built for real businesses.  
        One script. Your own AI.
      </p>

      <Link
        href="/signup"
        className="px-6 py-3 bg-black text-white rounded-lg text-lg"
      >
        Start Free Trial
      </Link>
    </main>
  );
}
