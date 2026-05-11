import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  profileImageUrl: text("profile_image_url"),
  role: text("role"),
  phone: text("phone"),
  location: text("location"),
  bio: text("bio"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const NIGERIAN_LOCATIONS = [
  "Ikeja, Lagos",
  "Lekki, Lagos",
  "Victoria Island, Lagos",
  "Surulere, Lagos",
  "Yaba, Lagos",
  "Wuse 2, Abuja",
  "Garki, Abuja",
  "Maitama, Abuja",
  "Port Harcourt, Rivers",
  "Ibadan, Oyo",
  "Kano, Kano",
  "Enugu, Enugu",
  "Benin City, Edo",
  "Kaduna, Kaduna",
  "Owerri, Imo",
] as const;

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  location: z.string().min(1, "Location is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const adminSignupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type AdminSignupData = z.infer<typeof adminSignupSchema>;
