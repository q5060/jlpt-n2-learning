import { pgTable, text, timestamp, integer, real, boolean, jsonb, primaryKey } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const srsCardsRemote = pgTable("srs_cards", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  contentId: text("content_id").notNull(),
  cardType: text("card_type").notNull(),
  due: integer("due").notNull(),
  stability: real("stability").notNull(),
  difficulty: real("difficulty").notNull(),
  elapsedDays: integer("elapsed_days").notNull(),
  scheduledDays: integer("scheduled_days").notNull(),
  reps: integer("reps").notNull(),
  lapses: integer("lapses").notNull(),
  state: integer("state").notNull(),
  lastReview: integer("last_review"),
  reviewMode: text("review_mode").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const examResultsRemote = pgTable("exam_results", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(),
  languageScore: integer("language_score").notNull(),
  readingScore: integer("reading_score").notNull(),
  listeningScore: integer("listening_score").notNull(),
  totalScore: integer("total_score").notNull(),
  passed: boolean("passed").notNull(),
  passProbability: real("pass_probability").notNull(),
  answers: jsonb("answers"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSettingsRemote = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  settings: jsonb("settings").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wrongAnswerQueueRemote = pgTable("wrong_answer_queue_remote", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  contentId: text("content_id").notNull(),
  contentType: text("content_type").notNull(),
  skill: text("skill").notNull(),
  dueAt: integer("due_at").notNull(),
  source: text("source").notNull(),
  attempts: integer("attempts").notNull(),
  prompt: text("prompt"),
  exerciseId: text("exercise_id"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customVocabRemote = pgTable("custom_vocab_remote", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  word: text("word").notNull(),
  reading: text("reading").notNull(),
  meaning: text("meaning").notNull(),
  example: text("example"),
  tags: jsonb("tags"),
  source: text("source").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const weaknessItemsRemote = pgTable(
  "weakness_items_remote",
  {
    userId: text("user_id").notNull(),
    contentId: text("content_id").notNull(),
    skill: text("skill").notNull(),
    wrongCount: integer("wrong_count").notNull(),
    lastWrongAt: integer("last_wrong_at").notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.contentId] })]
);

export const weaknessScoresRemote = pgTable(
  "weakness_scores_remote",
  {
    userId: text("user_id").notNull(),
    skill: text("skill").notNull(),
    score: real("score").notNull(),
    totalAttempts: integer("total_attempts").notNull(),
    correctAttempts: integer("correct_attempts").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.skill] })]
);

export const studySessionsRemote = pgTable(
  "study_sessions_remote",
  {
    userId: text("user_id").notNull(),
    id: text("id").notNull(),
    date: text("date").notNull(),
    minutes: integer("minutes").notNull(),
    cardsReviewed: integer("cards_reviewed").notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })]
);
