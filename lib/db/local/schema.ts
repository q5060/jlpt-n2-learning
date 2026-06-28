import Dexie, { type EntityTable } from "dexie";
import type { CardType, SkillTag, UserSettings } from "@/lib/types";

export interface SRSCardRecord {
  id: string;
  contentId: string;
  cardType: CardType;
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number;
  learningSteps: number;
  lastReview?: number;
  reviewMode: string;
}

export interface ReviewLogRecord {
  id: string;
  cardId: string;
  rating: number;
  reviewedAt: number;
  skill: SkillTag;
}

export interface ProgressRecord {
  id: string;
  contentType: "grammar" | "reading" | "listening" | "vocab" | "kanji";
  contentId: string;
  completed: boolean;
  score?: number;
  completedAt?: number;
}

export interface WeaknessRecord {
  skill: SkillTag;
  score: number;
  totalAttempts: number;
  correctAttempts: number;
  updatedAt: number;
}

export interface WeaknessItemRecord {
  contentId: string;
  skill: SkillTag;
  wrongCount: number;
  lastWrongAt: number;
}

export interface WrongAnswerQueueRecord {
  id: string;
  contentId: string;
  contentType: "grammar" | "reading" | "listening" | "vocab" | "kanji" | "exam";
  skill: SkillTag;
  dueAt: number;
  source: "exam" | "drill";
  attempts: number;
  prompt?: string;
  exerciseId?: string;
}

export interface ExamResultRecord {
  id: string;
  date: string;
  languageScore: number;
  readingScore: number;
  listeningScore: number;
  totalScore: number;
  passed: boolean;
  passProbability: number;
  answers: string;
}

export interface ImportRecord {
  id: string;
  name: string;
  type: "anki" | "csv" | "reading" | "audio";
  itemCount: number;
  importedAt: number;
}

export interface SyncMetaRecord {
  key: string;
  value: string;
  updatedAt: number;
}

export interface CustomVocabRecord {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  example?: string;
  tags: string[];
  source: string;
}

export interface ContentShardRecord {
  id: string;
  type: string;
  file: string;
  data: string;
  fetchedAt: number;
}

const defaultSettings: UserSettings = {
  dailyGoalMinutes: 75,
  newCardsPerDay: 20,
  reviewCardsPerDay: 100,
  startDate: new Date().toISOString().split("T")[0],
  placementCompleted: false,
  audioPackDownloaded: false,
};

class N2Database extends Dexie {
  srsCards!: EntityTable<SRSCardRecord, "id">;
  reviewLogs!: EntityTable<ReviewLogRecord, "id">;
  progress!: EntityTable<ProgressRecord, "id">;
  weakness!: EntityTable<WeaknessRecord, "skill">;
  weaknessItems!: EntityTable<WeaknessItemRecord, "contentId">;
  wrongAnswerQueue!: EntityTable<WrongAnswerQueueRecord, "id">;
  examResults!: EntityTable<ExamResultRecord, "id">;
  imports!: EntityTable<ImportRecord, "id">;
  syncMeta!: EntityTable<SyncMetaRecord, "key">;
  customVocab!: EntityTable<CustomVocabRecord, "id">;
  settings!: EntityTable<{ id: string; data: UserSettings }, "id">;
  studySessions!: EntityTable<
    { id: string; date: string; minutes: number; cardsReviewed: number },
    "id"
  >;
  contentShards!: EntityTable<ContentShardRecord, "id">;

  constructor() {
    super("n2-study-db");
    this.version(1).stores({
      srsCards: "id, contentId, cardType, due, state",
      reviewLogs: "id, cardId, reviewedAt, skill",
      progress: "id, contentType, contentId, completed",
      weakness: "skill, updatedAt",
      examResults: "id, date",
      imports: "id, importedAt",
      syncMeta: "key, updatedAt",
      customVocab: "id, word, source",
      settings: "id",
      studySessions: "id, date",
    });
    this.version(2).stores({
      srsCards: "id, contentId, cardType, due, state",
      reviewLogs: "id, cardId, reviewedAt, skill",
      progress: "id, contentType, contentId, completed",
      weakness: "skill, updatedAt",
      weaknessItems: "contentId, skill, lastWrongAt",
      wrongAnswerQueue: "id, contentId, skill, dueAt, source",
      examResults: "id, date",
      imports: "id, importedAt",
      syncMeta: "key, updatedAt",
      customVocab: "id, word, source",
      settings: "id",
      studySessions: "id, date",
    });
    this.version(3).stores({
      srsCards: "id, contentId, cardType, due, state",
      reviewLogs: "id, cardId, reviewedAt, skill",
      progress: "id, contentType, contentId, completed",
      weakness: "skill, updatedAt",
      weaknessItems: "contentId, skill, lastWrongAt",
      wrongAnswerQueue: "id, contentId, skill, dueAt, source",
      examResults: "id, date",
      imports: "id, importedAt",
      syncMeta: "key, updatedAt",
      customVocab: "id, word, source",
      settings: "id",
      studySessions: "id, date",
      contentShards: "id, type, file, fetchedAt",
    });
    this.version(4).stores({
      srsCards: "id, contentId, cardType, due, state",
      reviewLogs: "id, cardId, reviewedAt, skill",
      progress: "id, contentType, contentId, completed",
      weakness: "skill, updatedAt",
      weaknessItems: "contentId, skill, wrongCount, lastWrongAt",
      wrongAnswerQueue: "id, contentId, skill, dueAt, source",
      examResults: "id, date",
      imports: "id, importedAt",
      syncMeta: "key, updatedAt",
      customVocab: "id, word, source",
      settings: "id",
      studySessions: "id, date",
      contentShards: "id, type, file, fetchedAt",
    });
  }
}

export const db = new N2Database();

export async function getSettings(): Promise<UserSettings> {
  const record = await db.settings.get("main");
  return record?.data ?? defaultSettings;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await db.settings.put({ id: "main", data: settings });
}

export async function initializeWeakness(): Promise<void> {
  const skills: SkillTag[] = [
    "vocab",
    "kanji",
    "grammar",
    "reading",
    "listening",
  ];
  for (const skill of skills) {
    const existing = await db.weakness.get(skill);
    if (!existing) {
      await db.weakness.put({
        skill,
        score: 0.5,
        totalAttempts: 0,
        correctAttempts: 0,
        updatedAt: Date.now(),
      });
    }
  }
}

export async function logReview(
  cardId: string,
  rating: number,
  skill: SkillTag
): Promise<void> {
  await db.reviewLogs.put({
    id: `log-${Date.now()}-${cardId}`,
    cardId,
    rating,
    reviewedAt: Date.now(),
    skill,
  });
}
