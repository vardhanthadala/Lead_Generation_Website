import { pgTable, varchar, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const pipelineStageEnum = pgEnum("pipeline_stage", ["audited", "contacted", "demo_built", "closed_won", "closed_lost"]);

export const leads = pgTable("leads", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 255 }),
  website: varchar("website", { length: 255 }),
  email: varchar("email", { length: 255 }),
  whatsapp: varchar("whatsapp", { length: 255 }),
  rating: varchar("rating", { length: 50 }),
  reviewsCount: varchar("reviews_count", { length: 50 }),
  auditData: jsonb("audit_data"),
  pipelineStage: pipelineStageEnum("pipeline_stage").default("audited").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
