import { pgTable, text, timestamp, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";

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
