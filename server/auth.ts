import type { Express, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage, db, stripPassword } from "./storage";
import {
  signupSchema,
  loginSchema,
  adminSignupSchema,
} from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";

const secretKey = process.env.JWT_SECRET || "localconnect-dev-secret-key-2024";

export function setupAuth(app: Express) {
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: parsed.error.errors[0].message });
      }

      const { email, password, firstName, lastName, phone, location } =
        parsed.data;

      // SECURITY: Users cannot register as admin - role is not in signup schema
      // This is handled by not including role in the signup schema

      const existingResult = db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .all();
      const existing = existingResult.length > 0 ? existingResult[0] : null;
      if (existing) {
        return res
          .status(400)
          .json({ message: "An account with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        location,
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, secretKey, {
        expiresIn: "7d",
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        token,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: parsed.error.errors[0].message });
      }

      const { email, password } = parsed.data;

      const userResult = db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .all();
      const user = userResult.length > 0 ? userResult[0] : null;
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, secretKey, {
        expiresIn: "7d",
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        token,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    // For JWT tokens, logout is handled client-side by removing the token
    // Server just acknowledges the logout request
    res.json({ ok: true });
  });

  app.post("/api/auth/admin/signup", async (req, res) => {
    try {
      const parsed = adminSignupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: parsed.error.errors[0].message });
      }

      const { email, password, firstName, lastName } = parsed.data;

      const existingResult = db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .all();
      const existing = existingResult.length > 0 ? existingResult[0] : null;
      if (existing) {
        return res
          .status(400)
          .json({ message: "An account with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "admin",
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, secretKey, {
        expiresIn: "7d",
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        token,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/admin/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: parsed.error.errors[0].message });
      }

      const { email, password } = parsed.data;

      const userResult = db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .all();
      const user = userResult.length > 0 ? userResult[0] : null;
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.role !== "admin") {
        return res.status(403).json({
          message:
            "This account is not an admin. Please use the regular login page.",
        });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, secretKey, {
        expiresIn: "7d",
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        token,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    try {
      const decoded = jwt.verify(token, secretKey) as { userId: string };
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  try {
    const decoded = jwt.verify(token, secretKey) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export function getUserIdFromRequest(req: any): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, secretKey) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}
