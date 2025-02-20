import Link from "next/link";

export default function Hero() {
  return (
    <div className="w-full bg-white py-16">
      <div className="container mx-auto px-4 flex flex-col items-center gap-8">
        <h1 className="text-4xl lg:text-5xl font-bold text-center text-gray-900">
          Tempo Next Supabase Starter
        </h1>
        <p className="text-xl text-gray-600 text-center max-w-2xl">
          The ultimate starter template for building modern web applications with{" "}
          Supabase
          {" "}
          and{" "}
          Next.js
        </p>
        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
