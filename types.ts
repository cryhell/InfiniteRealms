export interface PlayerStats {
  strength: number;
  agility: number;
  intelligence: number;
  charisma: number;
}

export interface CodexEntry {
  id: string;
  title: string;
  category: 'Lore' | 'Person' | 'Location' | 'History' | 'Item';
  content: string;
  turnUnlocked: number;
  isNew?: boolean;
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  affinity: number; // 0-100
  status: 'Stranger' | 'Acquaintance' | 'Friend' | 'Confidant' | 'Close Friend' | 'Crush' | 'Partner' | 'Rival' | 'Enemy' | 'Nemesis' | 'Complicated' | 'Ally' | 'Mentor' | 'Protege';
}

export interface WorldEvent {
  id: string;
  type: 'danger' | 'opportunity' | 'flavor';
  title: string;
  description: string;
}

export interface PlayerPersona {
  id?: string;
  name: string;
  gender: string;
  appearance: string;
  backstory: string;
  personality: string;
}

export interface AdventureNode {
  storySegment: string;
  choices: string[];
  inventory: string[];
  currentQuest: string;
  locationName: string;
  summary?: string;
  statsUpdate?: Partial<PlayerStats & { health: number }>;
  worldUpdates?: Record<string, string | boolean | number>;
  isCombat?: boolean;
  enemyName?: string;
  enemyHealth?: number;
  enemyMaxHealth?: number;
  enemyAbilities?: string[];
  xpAward?: number;
  newCodexEntries?: Omit<CodexEntry, 'turnUnlocked' | 'isNew'>[];
  relationshipUpdates?: {
    npcId: string;
    npcName: string;
    npcDescription?: string;
    affinityChange: number;
    newStatus?: string; // Explicitly set status override (e.g. "Rival")
  }[];
  events?: WorldEvent[];
}

export interface GameState {
  inventory: string[];
  quest: string;
  location: string;
  genre: string;
  health: number;
  maxHealth: number;
  turnCount: number;
  stats: PlayerStats;
  worldState: Record<string, string | boolean | number>;
  inCombat: boolean;
  enemyName: string | null;
  enemyHealth: number | null;
  enemyMaxHealth: number | null;
  enemyAbilities: string[] | null;
  // Progression
  xp: number;
  level: number;
  skillPoints: number;
  unlockedSkills: string[];
  // Lore
  codex: CodexEntry[];
  // Social
  relationships: NPC[];
  // Identity
  persona: PlayerPersona;
}

export type AIProvider = 'gemini' | 'openai';

export interface GameSettings {
  apiKey: string;
  model: string;
  baseUrl?: string;
  provider?: AIProvider;
}

export type GameEffect = 'attack' | 'hit' | 'defend' | 'heal' | 'levelUp' | 'heart' | 'event' | null;

export enum Genre {
  Fantasy = "High Fantasy",
  SciFi = "Cyberpunk Sci-Fi",
  PostApocalyptic = "Post-Apocalyptic",
  Wuxia = "Wuxia / Cultivation",
  SliceOfLife = "Slice of Life / Romance",
  Mystery = "Noir Mystery",
  Horror = "Cosmic Horror",
  Custom = "Custom"
}

export const GENRE_DESCRIPTIONS: Record<Genre, string> = {
  [Genre.Fantasy]: "Dragons, magic, and ancient ruins.",
  [Genre.SciFi]: "Neon lights, hackers, and mega-corporations.",
  [Genre.PostApocalyptic]: "Scavenging for survival in a ruined world.",
  [Genre.Wuxia]: "Martial arts, sects, and the path to immortality.",
  [Genre.SliceOfLife]: "School/Work drama, friendships, and romance.",
  [Genre.Mystery]: "Detectives, rain-slicked streets, and unsolved crimes.",
  [Genre.Horror]: "Ancient evils and sanity-breaking discoveries.",
  [Genre.Custom]: "Define your own universe."
};

// Skill System Definitions
export interface Skill {
  id: string;
  name: string;
  description: string;
  stat: keyof PlayerStats;
  minVal: number;
  cost: number;
}

export const SKILL_TREE: Skill[] = [
  // Strength
  { id: 'power_strike', name: 'Power Strike', description: 'Deal massive damage when attacking aggressively.', stat: 'strength', minVal: 3, cost: 1 },
  { id: 'iron_skin', name: 'Iron Skin', description: 'Significantly reduce incoming damage.', stat: 'strength', minVal: 5, cost: 1 },
  { id: 'titan_grip', name: 'Titan Grip', description: 'Wield heavy weapons with ease and intimidate foes.', stat: 'strength', minVal: 7, cost: 1 },
  
  // Agility
  { id: 'shadow_step', name: 'Shadow Step', description: 'Evade attacks and strike from the blind spot.', stat: 'agility', minVal: 3, cost: 1 },
  { id: 'precision', name: 'Precision', description: 'Attacks target weak points for critical effects.', stat: 'agility', minVal: 5, cost: 1 },
  { id: 'reflexes', name: 'Lightning Reflexes', description: 'Always act first and dodge area attacks.', stat: 'agility', minVal: 7, cost: 1 },
  
  // Intelligence
  { id: 'analyze', name: 'Tactical Analysis', description: 'Reveal enemy weaknesses and upcoming moves.', stat: 'intelligence', minVal: 3, cost: 1 },
  { id: 'arcane_mind', name: 'Arcane Mind', description: 'Understand ancient tech/magic and solve complex puzzles.', stat: 'intelligence', minVal: 5, cost: 1 },
  { id: 'mastermind', name: 'Mastermind', description: 'Manipulate the environment to your advantage.', stat: 'intelligence', minVal: 7, cost: 1 },
  
  // Charisma
  { id: 'silver_tongue', name: 'Silver Tongue', description: 'Talk your way out of almost any fight.', stat: 'charisma', minVal: 3, cost: 1 },
  { id: 'inspiration', name: 'Inspiring Presence', description: 'Allies (NPCs) fight harder and you recover morale/health faster.', stat: 'charisma', minVal: 5, cost: 1 },
  { id: 'dominate', name: 'Commanding Will', description: 'Force weaker enemies to surrender or flee.', stat: 'charisma', minVal: 7, cost: 1 },
];

// Global type extension for AI Studio environment
declare global {
  interface Window {
    // aistudio is already defined in the global scope
  }
}