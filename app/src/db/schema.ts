import { ROLES } from "@/constants/roles";
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
  role: text("role").notNull().default(ROLES.USER),
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
  price: integer("price").notNull().default(0),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

export type TranscriptionsPayload = typeof transcriptions.$inferInsert;
export type TranscriptionsType = typeof transcriptions.$inferSelect;
