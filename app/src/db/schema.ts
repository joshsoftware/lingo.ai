import { timestamp, pgTable, text, uuid, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
export const statusEnum = pgEnum('status', ['pending', 'completed']);
import { segment } from "@/types/transcriptions";
import { timestamp, pgTable, text, uuid, boolean, integer, jsonb } from "drizzle-orm/pg-core";

export const transcriptions = pgTable("transcriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userID: text("user_id")
    .notNull()
    .references(() => userTable.id),
  translation: text("translation").notNull(),
  summary: text("summary").notNull(),
  segments: jsonb("segments").notNull().$type<segment[]>().default([]),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  documentUrl: text("documentUrl").notNull(),
  documentName: text("documentName").notNull(),
  isDefault: boolean("isDefault").notNull().default(false),
  audioDuration: integer("audioDuration"),
  userName: text("user_name")
});

export const registrations = pgTable("registrations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userName: text("userName").notNull(),
  userEmail: text("userEmail").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  name: text("name"),
  contactNumber: text("contactNumber"),
  role: text("role"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date"
  }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const interviewAnalysis = pgTable("interview_analysis", {
  id: uuid("id").primaryKey().defaultRandom(),
  userID: text("user_id")
  .notNull()
  .references(() => userTable.id),
  candidateName: text("candidate_name").notNull(),
  interviewerName: text("interviewer_name").notNull().$default(()=> ""),
  interviewRecordingLink: text("interview_recording_link"),
  interviewTranscriptLink: text("interview_transcript_link"),
  jobDescriptionDocumentLink: text("job_description_document_link").notNull(),
  transcript: text("transcript"),
  questions_answers: text("questions_answers"),
  parsedJobDescription: text("parsed_job_description"),
  analysisResult: text("analysis_result"),
  conversation: text("conversation").$defaultFn(() => ""),
  status: statusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const analysisFeedback = pgTable("analysis_feedback", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userID: text("user_id").notNull(),
  analysisId: uuid("analysis_id")
  .notNull()
  .references(() => interviewAnalysis.id),
  isFoundUseful: boolean("is_found_useful").notNull(),
  comment: text("feedback_message"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export type TranscriptionsPayload = typeof transcriptions.$inferInsert;
export type TranscriptionsType = typeof transcriptions.$inferSelect;

export type interviewAnalysisPayload = typeof interviewAnalysis.$inferInsert;
export type interviewAnalysisType = typeof interviewAnalysis.$inferSelect;

export type feedbackPayload = typeof analysisFeedback.$inferInsert;
export type feedbackType = typeof analysisFeedback.$inferSelect;