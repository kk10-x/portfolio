export const siteConfig = {
  name: "Khrithik S Anand",
  role: "Full-Stack Engineer",
  // Rotating phrases shown under the name in the hero
  rolePhrases: [
    "Full-Stack Engineer",
    "Backend & Distributed Systems",
    "Media Pipelines",
    "Payments Integrations",
  ],
  tagline:
    "Full-stack engineer — Python, TypeScript, React, and distributed systems.",
  bio: "Full-stack engineer with 3+ years across backend services, media pipelines, and the frontends that sit on top of them. Currently at Razorpay working on enterprise payment integrations; before that I built failover recovery and media processing systems at Dish Network Technologies. This site pulls its project list straight from my GitHub.",
  github: "kk10-x",
  email: "khrithik1502@gmail.com",
  linkedin: "https://www.linkedin.com/in/khrithik-s-anand/",
  skills: [
    "Python",
    "TypeScript",
    "React",
    "Django",
    "Node.js",
    "C++",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Docker",
    "FFmpeg",
    "Distributed Systems",
  ],
  experience: [
    {
      company: "Razorpay",
      role: "Technical Account Manager (Engineering)",
      period: "Jul 2025 — Present",
      location: "Bengaluru, IN",
      summary:
        "Enterprise payment integrations — resolving high-priority production incidents across backend, storage, and frontend systems; building REST/webhook integrations for high-volume transaction workloads; Python automation and CLI tooling for incident triage.",
    },
    {
      company: "Dish Network Technologies",
      role: "Software Engineer",
      period: "Jul 2022 — Jul 2025",
      location: "Bengaluru, IN",
      summary:
        "Built automated failover recovery for a Django configuration platform (recovery time from hours to <15 min), a high-throughput C++/FFmpeg media processing library, and migrated observability across 10+ microservices to Dynatrace.",
    },
    {
      company: "Dish Network Technologies",
      role: "Software Engineer Intern",
      period: "Mar 2022 — Jul 2022",
      location: "Bengaluru, IN",
      summary:
        "FFmpeg workflows for production video/audio pipelines and live HLS stream monitoring.",
    },
  ],
  education: {
    school: "BMS College of Engineering",
    degree: "B.E. in Computer Science",
    period: "2018 — 2022",
  },
  // GitHub repo names to exclude from the live feed (forks, configs, this portfolio itself, etc.)
  excludedRepos: ["portfolio", "kk10-x", "kk10-x.github.io", "temp", "ElevenLabs"],
  // Hide anything not pushed since this date (filters out old college lab repos)
  minPushedAt: "2025-01-01",
  // Repo names to always show first, in this order, regardless of recency/stars.
  // Leave empty to just sort by most recently updated.
  featuredRepos: [] as string[],
};
