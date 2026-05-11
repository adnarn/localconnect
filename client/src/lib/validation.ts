import { z } from "zod";

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

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  role: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

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
