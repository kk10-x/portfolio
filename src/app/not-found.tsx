import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-white dark:bg-black px-6 py-32 text-center">
      <div
        className="blob blob-a -top-20 -right-20 h-80 w-80 bg-gradient-to-br from-indigo-400 to-fuchsia-400 dark:from-indigo-600 dark:to-fuchsia-600"
        aria-hidden
      />
      <div
        className="blob blob-b -bottom-24 -left-24 h-96 w-96 bg-gradient-to-br from-cyan-400 to-indigo-400 dark:from-cyan-600 dark:to-indigo-600"
        aria-hidden
      />

      <div className="relative z-10">
        <p className="gradient-text text-7xl sm:text-9xl font-bold tracking-tight">
          404
        </p>
        <p className="mt-6 text-neutral-600 dark:text-neutral-400">
          This page drifted off with the particles.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block px-5 py-2 rounded-full text-sm text-white bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-500 shadow-md shadow-fuchsia-500/20 hover:shadow-lg hover:shadow-fuchsia-500/30 hover:-translate-y-0.5 transition-all"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
