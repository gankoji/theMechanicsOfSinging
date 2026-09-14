export const topics = [
  {
    id: "instrument",
    title: "The singing instrument",
    question: "How do intention, voice, and vowel work together?",
    description: "Connect vocal coordination with a shared auditory target, from APROARTE to vowel matching.",
  },
  {
    id: "tuning",
    title: "Tuning together",
    question: "What helps a chord lock and ring?",
    description: "Explore harmonic relationships, listen beyond a fixed-pitch reference, and put the ideas into practice.",
  },
  {
    id: "expression",
    title: "Musical expression",
    question: "What are we trying to communicate?",
    description: "Bring melody, lyric, harmony, and rhythm into deliberate musical choices.",
  },
] as const;

export type Topic = typeof topics[number]["id"];
export const topicTitle = (topic: Topic) => topics.find((item) => item.id === topic)!.title;

export interface Resource {
  id: string;
  title: string;
  format: string;
  credit: string;
  description: string;
  path: string;
  topics: Topic[];
  note?: string;
  downloads?: { label: string; path: string }[];
}

export const resources: Resource[] = [
  {
    id: "learning-the-instrument",
    title: "Learning the Instrument",
    format: "Interactive lesson",
    credit: "Northwest Sound teaching materials",
    description: "Explore the anatomy of the voice and practical exercises for vocal coordination in the original interactive guide.",
    path: "learning-the-instrument/index.html",
    topics: ["instrument"],
    note: "The lesson uses simplified teaching cues. Read the APROARTE essay alongside it for attribution and a fuller account of the interacting vocal system.",
  },
  {
    id: "barbershop-analyzer",
    title: "Barbershop Analyzer",
    format: "Interactive model",
    credit: "The Mechanics of Singing",
    description: "Compare waveforms, harmonic spectra, and equal-tempered versus just intervals by changing modeled pitches.",
    path: "barbershop-analyzer/index.html",
    topics: ["tuning"],
    note: "An illustrative model, not a microphone-based analyzer or a diagnostic tool. Fixed ratios are reference examples, not a prescription for every chord.",
  },
  {
    id: "mechanics-of-music",
    title: "Mechanics of Music",
    format: "Instructor’s guide",
    credit: "Northwest Sound teaching materials",
    description: "A practical rehearsal guide to subdivision, rhythmic exercises, tonal-center awareness, and interval listening.",
    path: "mechanics-of-music/index.html",
    topics: ["tuning", "expression"],
    note: "Some original tuning language is deliberately simplified. Pair it with the just-intonation essay, which explains why equal temperament is useful and tuning depends on context.",
  },
  {
    id: "thematic-elements",
    title: "Thematic Elements of Music",
    format: "Workshop & presentation",
    credit: "Presentation by Zach Groeblinghoff",
    description: "Make expressive choices through melody, lyric, harmony, and rhythm. Explore listening examples, prosody, and a vocal “paint palette.”",
    path: "thematic-elements/thematic-elements-presentation.html",
    topics: ["expression"],
    downloads: [
      { label: "But How Should I Sing It? · PDF", path: "thematic-elements/But How Should I Sing It.pdf" },
      { label: "Presentation summary · Markdown", path: "thematic-elements/But How Should I Sing It (Summary).md" },
      { label: "Rehearsal outline · Markdown", path: "thematic-elements/thematic-elements-outline.md" },
      { label: "Presentation text · TXT", path: "thematic-elements/But How Should I Sing It.txt" },
      { label: "Working notes · Org", path: "thematic-elements/thematic-elements.org" },
    ],
  },
];

// Only supplemental topics belong here; frontmatter remains authoritative.
export const essayConnections: Record<string, Topic[]> = {
  aproarte: ["expression"],
  "vowel-resonance": ["tuning"],
};

export function essayTopics(id: string, primary: Topic): Topic[] {
  return [...new Set([primary, ...(essayConnections[id] ?? [])])];
}
