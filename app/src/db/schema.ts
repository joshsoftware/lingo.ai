import { segment } from "@/types/transcriptions";
import {
  timestamp,
  pgTable,
  text,
  uuid,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const transcriptions = pgTable("transcriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userID: text("user_id")
    .notNull()
    .references(() => userTable.id),
  translation: text("translation").notNull(),
  summary: text("summary").notNull(),
  segments: jsonb("segments").notNull().$type<segment[]>().default([]),
  detectedLanguage: text("detected_language"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  documentUrl: text("documentUrl").notNull(),
  documentName: text("documentName").notNull(),
  isDefault: boolean("isDefault").notNull().default(false),
  audioDuration: integer("audioDuration"),
  userName: text("user_name"),
});

export const registrations = pgTable("registrations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userName: text("userName").notNull(),
  userEmail: text("userEmail").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  name: text("name"),
  contactNumber: text("contactNumber"),
  subscriptionId: text("subscriptionId")
    .notNull()
    .references(() => subscriptionTable.id),
  role: text("role"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

// New bot table with tokens and user reference
export const botTable = pgTable("bot", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  botName: text("botName"),
  botEmail: text("botEmail"),
  botHd: text("botHd"),
  botPicture: text("botPicture"),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

export const subscriptionTable = pgTable("subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(), // FREE, BASIC, ENTERPRISE
  recordingCount: integer("recordingCount").notNull(),
  fileSizeLimitMB: integer("fileSizeLimitMB").notNull(), // Store all sizes in MB
  durationDays: integer("durationDays").notNull(), // Validity in days
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

export type TranscriptionsPayload = typeof transcriptions.$inferInsert;
export type TranscriptionsType = typeof transcriptions.$inferSelect;



// Add this to your schema.ts file if it doesn't exist

export const crmLeadsTable = pgTable("crm_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: text("lead_id").notNull(),
  crmUrl: text("crm_url").notNull(),
  fileName: text("file_name").notNull(),
  documentUrl: text("document_url").notNull(), // Add this new field
  transcriptionId: uuid("transcription_id").references(() => transcriptions.id),
  extractedData: jsonb("extracted_data").notNull(),
  translation: text("translation").notNull(),
  userId: text("user_id").references(() => userTable.id),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow()
});

// Make sure to export the type as well
export type CrmLeadsPayload = typeof crmLeadsTable.$inferInsert;
export type CrmLeadsType = typeof crmLeadsTable.$inferSelect;