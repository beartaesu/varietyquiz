import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { z } from "zod";

export const celebrities = pgTable("celebrities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // 고유 제약조건 추가 (예명/활동명)
  realName: text("real_name"), // 본명 (선택사항)
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(), // "male_singer", "female_singer", "male_actor", "female_actress", "entertainer"
});

export const quizSessions = pgTable("quiz_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalQuestions: integer("total_questions").notNull().default(20),
  currentQuestion: integer("current_question").notNull().default(0),
  score: integer("score").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  wrongAnswers: integer("wrong_answers").notNull().default(0),
  isCompleted: integer("is_completed").notNull().default(0), // 0 = false, 1 = true
});

export const insertCelebritySchema = z.object({
  name: z.string().min(1),
  realName: z.string().nullable().optional(),
  imageUrl: z.string().min(1),
  category: z.string().min(1),
});

export const insertQuizSessionSchema = z.object({
  totalQuestions: z.number().int().optional(),
  currentQuestion: z.number().int().optional(),
  score: z.number().int().optional(),
  correctAnswers: z.number().int().optional(),
  wrongAnswers: z.number().int().optional(),
  isCompleted: z.number().int().optional(),
});

export type InsertCelebrity = { name: string; realName?: string | null; imageUrl: string; category: string };
export type Celebrity = typeof celebrities.$inferSelect;

export type InsertQuizSession = { totalQuestions?: number; currentQuestion?: number; score?: number; correctAnswers?: number; wrongAnswers?: number; isCompleted?: number };
export type QuizSession = typeof quizSessions.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type InsertUser = { username: string; password: string };
export type User = typeof users.$inferSelect;
