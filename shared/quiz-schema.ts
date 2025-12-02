import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // "person", "capital", "landmark", "idiom", "proverb"
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  imageUrl: text("image_url"), // 이미지가 있는 경우
  difficulty: integer("difficulty").notNull().default(1), // 1-3
});

export const gameSession = pgTable("game_session", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  currentQuestion: integer("current_question").notNull().default(0),
  score: integer("score").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  wrongAnswers: integer("wrong_answers").notNull().default(0),
  isCompleted: integer("is_completed").notNull().default(0),
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSession).omit({
  id: true,
});

export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;

export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSession.$inferSelect;