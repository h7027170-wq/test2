// Seed content for the browser-only prototype. Member-written text is in the language the member chose,
// which is why stories here mix Arabic, French and English.
import type { Community, Mood, ReactionKind, Room, StoryKind, Tint, AvatarShape, Role } from "@/types/domain";

/** PLACEHOLDER list until the owner sends the final one. Names and descriptions live in messages/*.json. */
export const communities: Community[] = [
  { id: "depression", tint: "lilac", sensitivity: "sensitive" },
  { id: "anxiety", tint: "sky", sensitivity: "standard" },
  { id: "panic", tint: "sky", sensitivity: "standard" },
  { id: "schizophrenia", tint: "sand", sensitivity: "high" },
  { id: "bipolar", tint: "lilac", sensitivity: "sensitive" },
  { id: "ocd", tint: "sage", sensitivity: "standard" },
  { id: "trauma", tint: "sand", sensitivity: "high" },
  { id: "eating", tint: "sage", sensitivity: "high" },
  { id: "adhd", tint: "sand", sensitivity: "standard" },
  { id: "grief", tint: "sage", sensitivity: "sensitive" },
];

/** Demo password for every seeded account. Prototype test value only. */
export const DEMO_PASSWORD = "breathe-slowly-2026";

interface SeedMember {
  id: string;
  nickname: string;
  shape: AvatarShape;
  tint: Tint;
  role: Role;
  communities: string[];
}

export const members: SeedMember[] = [
  { id: "m-demo", nickname: "demo-member", shape: "leaf", tint: "sage", role: "member", communities: ["anxiety", "depression"] },
  { id: "m-mod", nickname: "demo-moderator", shape: "hill", tint: "sand", role: "moderator", communities: [] },
  { id: "m-ther", nickname: "dr-salma", shape: "sun", tint: "sky", role: "therapist", communities: ["anxiety", "depression", "trauma"] },
  { id: "m-1", nickname: "quiet-river", shape: "wave", tint: "sky", role: "member", communities: ["depression"] },
  { id: "m-2", nickname: "nour-al-layl", shape: "moon", tint: "lilac", role: "member", communities: ["anxiety", "panic"] },
  { id: "m-3", nickname: "petit-olivier", shape: "leaf", tint: "sage", role: "member", communities: ["grief", "depression"] },
  { id: "m-4", nickname: "sahra-bird", shape: "star", tint: "sand", role: "member", communities: ["adhd", "ocd"] },
  { id: "m-5", nickname: "tamazight-wind", shape: "cloud", tint: "sky", role: "member", communities: ["bipolar", "trauma"] },
];

interface SeedStory {
  id: string;
  communityId: string;
  authorId: string;
  kind: StoryKind;
  mood: Mood;
  title: string;
  body: string;
  veil?: string;
  hoursAgo: number;
  reactions: Partial<Record<ReactionKind, number>>;
  held?: boolean;
}

export const stories: SeedStory[] = [
  {
    id: "s-1",
    communityId: "depression",
    authorId: "m-1",
    kind: "win",
    mood: "steady",
    title: "The first morning I didn't dread",
    body: "It was small. I made tea and sat by the window and nothing in my chest was shouting.\n\nI know it may not last. I wanted to write it down here anyway, because some of you told me these mornings would come, and I didn't believe you.",
    hoursAgo: 2,
    reactions: { relate: 14, strength: 9, thanks: 4 },
  },
  {
    id: "s-2",
    communityId: "anxiety",
    authorId: "m-2",
    kind: "story",
    mood: "low",
    title: "قبل كل امتحان يرجع نفس الإحساس",
    body: "كل مرة نقرب للامتحان، قلبي يبدا يدق بالزربة وما نقدرش نرقد. جربت نتنفس ببطء كيما قريت هنا، شوية عاونني.\n\nواش كاين لي يعيش نفس الحاجة؟ كيفاش تتعاملو معاها؟",
    hoursAgo: 5,
    reactions: { relate: 22, strength: 6, helped: 2 },
  },
  {
    id: "s-3",
    communityId: "grief",
    authorId: "m-3",
    kind: "story",
    mood: "heavy",
    title: "Un an sans lui",
    body: "Demain ça fera un an. Les gens autour de moi ont repris leur vie, et c'est normal. Moi j'ai encore son numéro dans mon téléphone, je n'arrive pas à l'effacer.\n\nJe ne cherche pas de conseil, juste à le dire quelque part.",
    veil: "Loss of a parent",
    hoursAgo: 9,
    reactions: { relate: 31, strength: 18, thanks: 3 },
  },
  {
    id: "s-4",
    communityId: "adhd",
    authorId: "m-4",
    kind: "checkin",
    mood: "okay",
    title: "Check-in: three tasks, one done",
    body: "Wrote three things on a sticky note this morning. Did one. Old me would call that failure. Today I'm calling it a check-in.",
    hoursAgo: 20,
    reactions: { relate: 12, helped: 5 },
  },
  {
    id: "s-5",
    communityId: "panic",
    authorId: "m-2",
    kind: "win",
    mood: "light",
    title: "ركبت الترامواي وحدي",
    body: "من عام ما ركبتش الترامواي وحدي بسبب نوبات الهلع. اليوم ركبت، ثلاث محطات برك، بصح ركبت.",
    hoursAgo: 30,
    reactions: { strength: 27, relate: 8, thanks: 2 },
  },
  {
    id: "s-6",
    communityId: "trauma",
    authorId: "m-5",
    kind: "story",
    mood: "heavy",
    title: "Les bruits forts",
    body: "Une porte qui claque et je suis ailleurs pendant plusieurs minutes. Mon psy m'apprend à nommer cinq choses que je vois. Ça aide un peu, pas toujours.",
    veil: "Mentions of violence",
    hoursAgo: 48,
    reactions: { relate: 17, strength: 11 },
  },
  {
    id: "s-7",
    communityId: "ocd",
    authorId: "m-4",
    kind: "story",
    mood: "low",
    title: "Checking the door, again",
    body: "Seven times last night. I counted. Writing it here instead of checking an eighth time.",
    hoursAgo: 60,
    reactions: { relate: 19, strength: 7 },
  },
  {
    id: "s-8",
    communityId: "bipolar",
    authorId: "m-5",
    kind: "checkin",
    mood: "steady",
    title: "Two weeks stable",
    body: "Sleep is regular, I take my treatment, I eat at the same hours. Boring is good. Boring is very good.",
    hoursAgo: 80,
    reactions: { strength: 15, relate: 4, helped: 3 },
  },
  {
    id: "s-9",
    communityId: "anxiety",
    authorId: "m-1",
    kind: "story",
    mood: "low",
    title: "Someone to talk to?",
    body: "If anyone from Oran wants to talk, my number is 0555 12 34 56, call me in the evening.",
    hoursAgo: 1,
    reactions: {},
    held: true,
  },
  {
    id: "s-10",
    communityId: "schizophrenia",
    authorId: "m-5",
    kind: "story",
    mood: "okay",
    title: "Explaining it to my brother",
    body: "I finally explained to my brother what the voices are like. He listened. He didn't laugh. I didn't expect that.",
    hoursAgo: 3,
    reactions: {},
    held: true,
  },
];

export const replies = [
  { id: "r-1", storyId: "s-1", parentId: null, authorId: "m-3", body: "Je suis tellement content pour toi. Garde ce matin quelque part, il compte.", hoursAgo: 1 },
  { id: "r-2", storyId: "s-1", parentId: "r-1", authorId: "m-1", body: "Merci. I'll keep it.", hoursAgo: 1 },
  { id: "r-3", storyId: "s-1", parentId: null, authorId: "m-ther", body: "Noticing a good morning without judging it is a real skill. Thank you for sharing it here.", hoursAgo: 1 },
  { id: "r-4", storyId: "s-2", parentId: null, authorId: "m-4", body: "نفس الحاجة عندي. نكتب واش راني نحس في ورقة قبل ما ندخل، يخفف عليا.", hoursAgo: 4 },
  { id: "r-5", storyId: "s-3", parentId: null, authorId: "m-2", body: "Je t'entends. Pas besoin de l'effacer.", hoursAgo: 7 },
];

export const rooms: Room[] = [
  { id: "evening-circle", communityId: "anxiety", tint: "sky", live: true, members: null },
  { id: "night-owls", communityId: "depression", tint: "lilac", live: true, members: null },
  { id: "small-wins", communityId: "adhd", tint: "sand", live: false, members: null },
  { id: "remembering", communityId: "grief", tint: "sage", live: false, members: null },
];

export const roomMessages: Record<string, { nickname: string; shape: AvatarShape; tint: Tint; body: string; minutesAgo: number }[]> = {
  "evening-circle": [
    { nickname: "nour-al-layl", shape: "moon", tint: "lilac", body: "مساء الخير، كيفاش راكم الليلة؟", minutesAgo: 14 },
    { nickname: "quiet-river", shape: "wave", tint: "sky", body: "A bit restless. Glad this room is open.", minutesAgo: 12 },
    { nickname: "petit-olivier", shape: "leaf", tint: "sage", body: "Pareil. On fait la minute de respiration ensemble ?", minutesAgo: 9 },
  ],
  "night-owls": [{ nickname: "sahra-bird", shape: "star", tint: "sand", body: "Can't sleep again. Anyone else here?", minutesAgo: 30 }],
  "small-wins": [],
  remembering: [{ nickname: "petit-olivier", shape: "leaf", tint: "sage", body: "Je pense à ma mère ce soir.", minutesAgo: 240 }],
};

/** Writing prompts, keyed so the copy can be translated. */
export const promptKeys = ["today", "smallWin", "helped", "wish", "body"] as const;
