import { timestamp, pgTable, text, uuid, boolean, integer } from "drizzle-orm/pg-core";

export const transcriptions = pgTable("transcriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userID: text("user_id")
  .notNull()
  .references(() => userTable.id),
  translation: text("translation").notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  documentUrl: text("documentUrl").notNull(),
  documentName: text("documentName").notNull(),
  isDefault: boolean("isDefault").notNull().default(false),
  audioDuration: integer("audioDuration")
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
  role: text("role"),
  createdAt: timestamp("createdAt",{mode:"date"}).defaultNow()
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
  createdAt: timestamp("createdAt",{mode:"date"}).defaultNow()
});

export type TranscriptionsPayload = typeof transcriptions.$inferInsert;
export type TranscriptionsType = typeof transcriptions.$inferSelect;