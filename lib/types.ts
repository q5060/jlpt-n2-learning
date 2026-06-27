export type SkillTag = "vocab" | "kanji" | "grammar" | "reading" | "listening";

export type CardType = "vocab" | "kanji";

export type ReviewMode = "recognition" | "recall" | "cloze" | "listening";

export type GrammarExerciseType =
  | "fill_blank"
  | "reorder"
  | "correction"
  | "meaning";

export interface VocabEntry {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  example: string;
  exampleReading?: string;
  tags: string[];
  jlptLevel: "N2" | "N3";
  audioUrl?: string;
}

export interface KanjiEntry {
  id: string;
  character: string;
  onyomi: string[];
  kunyomi: string[];
  meaning: string;
  examples: { word: string; reading: string; meaning: string }[];
  strokes?: number;
  jlptLevel: "N2";
}

export interface GrammarPoint {
  id: string;
  title: string;
  pattern: string;
  connection: string;
  meaning: string;
  nuance: string;
  examples: { japanese: string; reading?: string; note?: string }[];
  similarGrammar: string[];
  week: number;
  exercises: GrammarExercise[];
}

export interface GrammarExercise {
  id: string;
  type: GrammarExerciseType;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
}

export interface ReadingPassage {
  id: string;
  title: string;
  level: "N3" | "N2";
  content: string;
  timeLimitMinutes: number;
  questions: ReadingQuestion[];
}

export interface ReadingQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  trapType?: string;
}

export interface ListeningItem {
  id: string;
  title: string;
  type: "task" | "point" | "overview" | "instant";
  audioUrl: string;
  transcript: string;
  questions: ListeningQuestion[];
  tags: string[];
}

export interface ListeningQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PlacementQuestion {
  id: string;
  skill: SkillTag;
  level: "N3" | "N2";
  prompt: string;
  options: string[];
  correctIndex: number;
  contentId?: string;
}

export interface ExamQuestion {
  id: string;
  section: "language" | "reading" | "listening";
  skill: SkillTag;
  prompt: string;
  options: string[];
  correctIndex: number;
  passageId?: string;
  audioUrl?: string;
  explanation: string;
}

export interface DailyTask {
  id: string;
  type: "srs" | "grammar" | "reading" | "listening" | "weakness" | "exam";
  title: string;
  description: string;
  href: string;
  priority: number;
  estimatedMinutes: number;
}

export interface WeaknessScore {
  skill: SkillTag;
  score: number;
  totalAttempts: number;
  correctAttempts: number;
}

export interface UserSettings {
  dailyGoalMinutes: number;
  newCardsPerDay: number;
  reviewCardsPerDay: number;
  startDate: string;
  placementCompleted: boolean;
  placementScores?: Record<SkillTag, number>;
  audioPackDownloaded: boolean;
}

export interface WrongAnswerItem {
  id: string;
  contentId: string;
  contentType: "grammar" | "reading" | "listening" | "vocab" | "kanji" | "exam";
  skill: SkillTag;
  dueAt: number;
  source: "exam" | "drill";
  attempts: number;
  prompt?: string;
}

export interface WeaknessItemRecord {
  contentId: string;
  skill: SkillTag;
  wrongCount: number;
  lastWrongAt: number;
}

export interface StudySession {
  id: string;
  date: string;
  minutes: number;
  cardsReviewed: number;
}

export interface ExamResult {
  id: string;
  date: string;
  languageScore: number;
  readingScore: number;
  listeningScore: number;
  totalScore: number;
  passed: boolean;
  passProbability: number;
  sectionBreakdown: Record<SkillTag, number>;
}
