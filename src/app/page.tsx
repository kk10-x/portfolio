import { Hero } from "@/components/Hero";
import { Skills } from "@/components/Skills";
import { Experience } from "@/components/Experience";
import { Projects } from "@/components/Projects";
import { Footer } from "@/components/Footer";
import { ParticleField } from "@/components/ParticleField";

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden bg-white dark:bg-black">
      <div
        className="blob blob-a -top-32 -left-32 h-96 w-96 bg-gradient-to-br from-indigo-400 to-fuchsia-400 dark:from-indigo-600 dark:to-fuchsia-600"
        aria-hidden
      />
      <div
        className="blob blob-b top-64 -right-40 h-[28rem] w-[28rem] bg-gradient-to-br from-cyan-400 to-indigo-400 dark:from-cyan-600 dark:to-indigo-600"
        aria-hidden
      />
      <div
        className="blob blob-a top-[70%] -left-20 h-80 w-80 bg-gradient-to-br from-fuchsia-400 to-cyan-400 dark:from-fuchsia-600 dark:to-cyan-600"
        aria-hidden
      />
      <ParticleField />

      <div className="relative z-10">
        <Hero />
        <Experience />
        <Skills />
        <Projects />
        <Footer />
      </div>
    </main>
  );
}
