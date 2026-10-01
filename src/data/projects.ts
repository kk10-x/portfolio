export type CategoryId = "reliability" | "voice" | "edge" | "tools";

export interface Category {
  id: CategoryId;
  label: string;
  /** Particle tint for this category (hex). */
  color: number;
}

export const categories: Category[] = [
  { id: "reliability", label: "Payments, reliability and systems", color: 0x5b8cff },
  { id: "voice", label: "Voice and media", color: 0x3fd0b0 },
  { id: "edge", label: "Edge computing", color: 0xffb547 },
  { id: "tools", label: "Tools and self-hosting", color: 0xff8fa3 },
];

/** How a project's particles are arranged. Each shape says something about what the project does. */
export type ShapeId =
  | "vortex"
  | "lanes"
  | "ledger"
  | "clusters"
  | "queue"
  | "graph"
  | "waveform"
  | "brackets"
  | "timeline"
  | "voices"
  | "chart"
  | "funnel"
  | "dome"
  | "tree"
  | "archive"
  | "track";

/** 0 still, 1 flow along x, 2 wave, 3 swirl. */
export type Motion = 0 | 1 | 2 | 3;

export interface Project {
  /** GitHub repo name (kebab-case). */
  repo: string;
  title: string;
  category: CategoryId;
  /** One line, plain language, taken from the repo's own description. */
  blurb: string;
  /** Short list shown on the card. */
  tags: string[];
  shape: ShapeId;
  motion: Motion;
  /** Live demo, if the repo has one. */
  live?: string;
  /** Why the particles look the way they do. Shown on the card as a caption. */
  caption: string;
}

const gh = (repo: string) => `https://github.com/kk10-x/${repo}`;
export const repoUrl = gh;

/**
 * Tour order: newest and strongest first. Hidden on purpose (not listed): this portfolio, forks,
 * private repos, college lab work and scratch repos.
 */
export const curated: Project[] = [
  {
    repo: "vortex",
    title: "Vortex",
    category: "reliability",
    blurb: "See a load balancer, consistent hashing and a rate limiter work on real traffic. Kill a worker process and watch the retries reroute.",
    tags: ["Three.js", "TypeScript", "WebSocket", "Consistent hashing"],
    shape: "vortex",
    motion: 3,
    live: "https://bella.taile86535.ts.net:10000/vortex/",
    caption: "A swirl: every request is pulled toward one gateway.",
  },
  {
    repo: "payments-flow",
    title: "Payments Flow",
    category: "reliability",
    blurb: "A mock payment gateway that never double-charges, even when a provider times out. Health-scored routing, circuit breakers and idempotent retries.",
    tags: ["TypeScript", "Idempotency", "Circuit breaker", "Payments"],
    shape: "lanes",
    motion: 1,
    live: "https://bella.taile86535.ts.net:10000/payments-flow/",
    caption: "Three lanes of payments through one gate.",
  },
  {
    repo: "inference-ledger",
    title: "Inference Ledger",
    category: "reliability",
    blurb: "An OpenAI-compatible LLM gateway that tracks token usage in two independent ledgers, reconciles them over Kafka and explains every mismatch.",
    tags: ["Python", "Kafka", "Exactly-once", "Reconciliation"],
    shape: "ledger",
    motion: 0,
    live: "https://kk10-x.github.io/inference-ledger/",
    caption: "Two ledgers side by side, and the lines that must match.",
  },
  {
    repo: "celery-triage",
    title: "Celery Triage",
    category: "reliability",
    blurb: "Groups failed Celery tasks by root cause instead of by time, so you can replay a whole cluster of failures in one go.",
    tags: ["Django", "React", "Celery", "Observability"],
    shape: "clusters",
    motion: 0,
    live: "https://bella.taile86535.ts.net:10000/celery-triage/",
    caption: "Scattered failures, gathered into a few root causes.",
  },
  {
    repo: "dlq-pilot",
    title: "DLQ Pilot",
    category: "reliability",
    blurb: "Sorts RabbitMQ dead-letter queues by why messages failed, then replays them in controlled, rate-limited batches.",
    tags: ["Python", "FastAPI", "RabbitMQ", "React"],
    shape: "queue",
    motion: 1,
    live: "https://bella.taile86535.ts.net:8443",
    caption: "A queue feeding a box, released in controlled batches.",
  },
  {
    repo: "benefitsgraph",
    title: "BenefitsGraph",
    category: "reliability",
    blurb: "An API that decides health-benefits eligibility and adjudicates claims, with versioned policy rules and idempotent claim handling.",
    tags: ["Node.js", "TypeScript", "PostgreSQL", "Redis"],
    shape: "graph",
    motion: 0,
    live: "https://bella.taile86535.ts.net",
    caption: "A graph of members, rules and claims.",
  },
  {
    repo: "polyscribe",
    title: "PolyScribe",
    category: "voice",
    blurb: "Live bilingual captions in under a second. It switches language mid-sentence and picks out names and entities as people speak.",
    tags: ["Python", "WebSockets", "asyncio", "ElevenLabs"],
    shape: "waveform",
    motion: 2,
    live: "https://kk10-x.github.io/polyscribe/",
    caption: "A live waveform, as the audio arrives.",
  },
  {
    repo: "dub-qc",
    title: "Dub QC",
    category: "voice",
    blurb: "Quality checks for AI-dubbed video: flags dubbed lines that run across SCTE-35 ad breaks, using a C++ transport-stream parser.",
    tags: ["C++", "FastAPI", "MPEG-TS", "SCTE-35"],
    shape: "timeline",
    motion: 1,
    live: "https://bella.taile86535.ts.net:10000/dub-qc/",
    caption: "A timeline, with the ad breaks as the tall ticks.",
  },
  {
    repo: "tagsmith",
    title: "Tagsmith",
    category: "voice",
    blurb: "A linter and A/B testing studio for ElevenLabs v3 audio tags. Think ESLint for voice scripts.",
    tags: ["Python", "FastAPI", "React", "ElevenLabs"],
    shape: "brackets",
    motion: 0,
    live: "https://bella.taile86535.ts.net:10000/tagsmith/",
    caption: "Angle brackets, because the tags are the product.",
  },
  {
    repo: "narrated",
    title: "Narrated",
    category: "voice",
    blurb: "Paste an article URL and get a two-host, podcast-style narration, written by Claude and voiced by ElevenLabs.",
    tags: ["Python", "Claude", "ElevenLabs", "React"],
    shape: "voices",
    motion: 2,
    caption: "Two voices, taking turns.",
  },
  {
    repo: "elevenlabs-agent-qa-dashboard",
    title: "Agent QA Dashboard",
    category: "voice",
    blurb: "Catches tone, latency and tool-calling regressions in ElevenLabs voice agents, and charts them over time.",
    tags: ["TypeScript", "FastAPI", "React", "Voice agents"],
    shape: "chart",
    motion: 0,
    live: "https://bella.taile86535.ts.net:10000/eleven-qa",
    caption: "A metric over time, with a regression in it.",
  },
  {
    repo: "meeting-digest",
    title: "Meeting Digest",
    category: "voice",
    blurb: "Upload a meeting recording. Get a transcript from local Whisper and a Claude summary with action items.",
    tags: ["Whisper", "Claude", "FastAPI", "Next.js"],
    shape: "funnel",
    motion: 1,
    caption: "An hour of talk narrowed to a handful of actions.",
  },
  {
    repo: "edge-sentinel",
    title: "Edge Sentinel",
    category: "edge",
    blurb: "Rate limiting and bot scoring that run at the edge, with state kept in Akamai EdgeKV and a live local dashboard.",
    tags: ["JavaScript", "Akamai EdgeWorkers", "EdgeKV", "WebSocket"],
    shape: "dome",
    motion: 3,
    caption: "A dome over the origin.",
  },
  {
    repo: "edge-personalization-router",
    title: "Edge Personalization Router",
    category: "edge",
    blurb: "An Akamai EdgeWorker that routes each request by region, device and A/B bucket before it reaches your origin.",
    tags: ["JavaScript", "Akamai EdgeWorkers", "EdgeKV", "A/B routing"],
    shape: "tree",
    motion: 0,
    caption: "One request branching to the right place.",
  },
  {
    repo: "discord-exporter",
    title: "Discord Exporter",
    category: "tools",
    blurb: "Export your own Discord message history. No bot required.",
    tags: ["Python", "CLI"],
    shape: "archive",
    motion: 1,
    caption: "A stream collected into an archive.",
  },
  {
    repo: "assetto-corsa-server",
    title: "Assetto Corsa Server",
    category: "tools",
    blurb: "Run an Assetto Corsa server and control it from Discord: start, stop and reconfigure races, with no port forwarding.",
    tags: ["Docker", "Discord bot", "Self-hosted", "Shell"],
    shape: "track",
    motion: 0, // swirl would shear the loop (points at different radii twist by different amounts)
    caption: "A circuit, because it runs races.",
  },
];

export const categoryById = (id: CategoryId) => categories.find((c) => c.id === id)!;

/** How many projects the scroll tour stops at. The rest are in the overview and the all-projects index. */
export const TOUR_SIZE = 8;

/** How each shape moves by default. Hand-written entries choose their own; generated ones use this. */
export const SHAPE_MOTION: Record<ShapeId, Motion> = {
  vortex: 3,
  lanes: 1,
  ledger: 0,
  clusters: 0,
  queue: 1,
  graph: 0,
  waveform: 2,
  brackets: 0,
  timeline: 1,
  voices: 2,
  chart: 0,
  funnel: 1,
  dome: 3,
  tree: 0,
  archive: 1,
  track: 0,
};

/**
 * The projects the site shows. They start as the hand-written `curated` list. When the page loads, live.ts asks
 * GitHub for the current repos and replaces the contents of these two arrays in place, so every module that
 * imports them sees the live list. The site's modules are only loaded after that (see boot.ts).
 * The scroll tour is the first TOUR_SIZE entries.
 */
export const projects: Project[] = [...curated];
export const tour: Project[] = projects.slice(0, TOUR_SIZE);

export function setProjects(next: Project[]) {
  projects.splice(0, projects.length, ...next);
  tour.splice(0, tour.length, ...next.slice(0, TOUR_SIZE));
}
