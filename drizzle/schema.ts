import { integer, pgEnum, pgTable, text, timestamp, varchar, json, boolean, serial } from "drizzle-orm/pg-core";

/**
 * Enums para PostgreSQL
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const availabilityEnum = pgEnum("availability", ["imediata", "15_dias", "30_dias"]);
export const preferredScheduleEnum = pgEnum("preferred_schedule", ["manha", "tarde", "noite", "integral", "flexivel"]);
export const statusEnum = pgEnum("status", ["pendente", "em_analise", "aprovado", "rejeitado"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de candidaturas para vagas de motorista
 */
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  
  // Dados pessoais
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  
  // Localização
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  
  // Tipos de veículos (armazenado como JSON array)
  vehicleTypes: json("vehicle_types").$type<string[]>().notNull(),
  
  // Experiência e disponibilidade
  experienceYears: integer("experience_years").notNull(),
  availability: availabilityEnum("availability").notNull(),
  
  // Novas perguntas
  hasPendingFines: boolean("has_pending_fines").notNull().default(false),
  acceptsLongTrips: boolean("accepts_long_trips").notNull().default(false),
  preferredSchedule: preferredScheduleEnum("preferred_schedule").notNull(),
  hasExperienceWithCargo: boolean("has_experience_with_cargo").notNull().default(false),
  hasExperienceWithPassengers: boolean("has_experience_with_passengers").notNull().default(false),
  
  // Observações
  notes: text("notes"),
  
  // Status da candidatura
  status: statusEnum("status").default("pendente").notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;
