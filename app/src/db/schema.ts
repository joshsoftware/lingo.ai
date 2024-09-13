import { timestamp, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const transcriptions = pgTable("transcriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationId: text("registrationId")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  translation: text("translation").notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  documentUrl: text("documentUrl").notNull(),
  documentName: text("documentName").notNull(),
});

export const registrations = pgTable("registrations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userName: text("userName").notNull(),
  userEmail: text("userEmail").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

export type TranscriptionsPayload = typeof transcriptions.$inferInsert;
export type TranscriptionsType = typeof transcriptions.$inferSelect;
