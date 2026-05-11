import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage, stripPassword } from "./storage";
import { seedDatabase } from "./seed";
import { setupAuth, isAuthenticated, getUserIdFromRequest } from "./auth";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedExt = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (
      allowedExt.test(path.extname(file.originalname)) &&
      allowedMimeTypes.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPG, PNG, GIF, WebP) are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  setupAuth(app);

  const express = await import("express");
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  app.use(
    "/uploads",
    express.default.static(uploadsDir, {
      setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        const mime = mimeMap[ext];
        if (mime) res.setHeader("Content-Type", mime);
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    }),
  );

  app.post("/api/upload", (req: any, res: any) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    upload.single("image")(req, res, (err: any) => {
      if (err) return res.status(400).json({ message: err.message });
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl });
    });
  });

  await seedDatabase();

  app.patch("/api/auth/profile", async (req: any, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const {
        role,
        location,
        phone,
        bio,
        firstName,
        lastName,
        profileImageUrl,
        email,
      } = req.body;

      // Get current user to check existing role
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate role changes - CRITICAL SECURITY CHECK
      if (role !== undefined) {
        if (role === "admin") {
          console.warn(
            `SECURITY ALERT: User ${userId} attempted to escalate role to admin`,
          );
          return res.status(403).json({ message: "Cannot assign admin role" });
        }
        if (!["customer", "business_owner", "skilled_worker"].includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
        }
      }

      // Validate email format and uniqueness
      if (email !== undefined) {
        if (typeof email !== "string" || email.trim().length === 0) {
          return res.status(400).json({ message: "Email is required" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          return res.status(400).json({ message: "Invalid email format" });
        }

        // Check if email is already taken by another user
        const existingUser = await storage.getUserByEmail(email.trim());
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email is already taken" });
        }
      }

      // Validate other fields
      if (
        firstName &&
        (typeof firstName !== "string" || firstName.trim().length === 0)
      ) {
        return res.status(400).json({ message: "First name is required" });
      }
      if (
        lastName &&
        (typeof lastName !== "string" || lastName.trim().length === 0)
      ) {
        return res.status(400).json({ message: "Last name is required" });
      }
      if (phone && (typeof phone !== "string" || phone.trim().length === 0)) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      if (bio && typeof bio !== "string") {
        return res.status(400).json({ message: "Bio must be a string" });
      }
      if (
        location &&
        (typeof location !== "string" || location.trim().length === 0)
      ) {
        return res.status(400).json({ message: "Location is required" });
      }
      if (
        profileImageUrl &&
        (typeof profileImageUrl !== "string" ||
          profileImageUrl.trim().length === 0)
      ) {
        return res
          .status(400)
          .json({ message: "Profile image URL must be a valid string" });
      }

      const updateData: any = {};
      if (role !== undefined) updateData.role = role;
      if (email !== undefined) updateData.email = email.trim();
      if (location !== undefined) updateData.location = location.trim();
      if (phone !== undefined) updateData.phone = phone.trim();
      if (bio !== undefined) updateData.bio = bio.trim();
      if (firstName !== undefined) updateData.firstName = firstName.trim();
      if (lastName !== undefined) updateData.lastName = lastName.trim();
      if (profileImageUrl !== undefined)
        updateData.profileImageUrl = profileImageUrl.trim();

      const updated = await storage.updateUser(userId, updateData);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(
        `Profile updated for user ${userId}:`,
        Object.keys(updateData),
      );
      res.json(stripPassword(updated));
    } catch (err: any) {
      console.error("Profile update error:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(stripPassword(user));
  });

  app.get("/api/listings", async (req, res) => {
    try {
      const allListings = await storage.getListings();
      const enriched = await Promise.all(
        allListings.map(async (listing) => {
          const provider = await storage.getUser(listing.userId);
          const listingReviews = await storage.getReviewsByListing(listing.id);
          const images = await storage.getListingImages(listing.id);
          const avgRating = listingReviews.length
            ? listingReviews.reduce((s, r) => s + r.rating, 0) /
              listingReviews.length
            : 0;
          const imageCount =
            (listing.image ? 1 : 0) +
            images.filter((img: any) => img.imageUrl !== listing.image).length;
          return {
            ...listing,
            images,
            imageCount,
            provider: provider ? stripPassword(provider) : {},
            avgRating: Math.round(avgRating * 10) / 10,
            reviewCount: listingReviews.length,
          };
        }),
      );
      res.json(enriched);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/listings/mine", async (req: any, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const myListings = await storage.getListingsByUser(userId);
    res.json(myListings);
  });

  app.get("/api/listings/user/:userId", async (req, res) => {
    const userListings = await storage.getListingsByUser(req.params.userId);
    const enriched = await Promise.all(
      userListings.map(async (listing) => {
        const listingReviews = await storage.getReviewsByListing(listing.id);
        const avgRating = listingReviews.length
          ? listingReviews.reduce((s, r) => s + r.rating, 0) /
            listingReviews.length
          : 0;
        return { ...listing, avgRating, reviewCount: listingReviews.length };
      }),
    );
    res.json(enriched);
  });

  app.get("/api/listings/:id", async (req, res) => {
    const listing = await storage.getListing(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    const provider = await storage.getUser(listing.userId);
    const listingReviews = await storage.getReviewsByListing(listing.id);
    const images = await storage.getListingImages(listing.id);
    const avgRating = listingReviews.length
      ? listingReviews.reduce((s, r) => s + r.rating, 0) / listingReviews.length
      : 0;
    res.json({
      ...listing,
      images,
      provider: provider ? stripPassword(provider) : {},
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: listingReviews.length,
    });
  });

  app.post("/api/listings", async (req: any, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const {
        title,
        description,
        category,
        price,
        image,
        location,
        type,
        websiteUrl,
      } = req.body;
      if (!title || !description || !category) {
        return res
          .status(400)
          .json({ message: "Title, description, and category are required" });
      }
      const listing = await storage.createListing({
        userId,
        title,
        description,
        category,
        price: price || null,
        image: image || null,
        location: location || null,
        type: type || "service",
        websiteUrl: websiteUrl || null,
        active: true,
      });
      res.json(listing);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/listings/:id", async (req: any, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const listing = await storage.getListing(req.params.id);
      const user = await storage.getUser(userId);
      if (listing && (listing.userId === userId || user?.role === "admin")) {
        await storage.deleteListing(req.params.id);
        res.json({ ok: true });
      } else {
        res.status(403).json({ message: "Not authorized" });
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/reviews/listing/:listingId", async (req, res) => {
    const reviewsList = await storage.getReviewsByListing(req.params.listingId);
    const enriched = await Promise.all(
      reviewsList.map(async (r) => {
        const reviewer = await storage.getUser(r.reviewerId);
        return { ...r, reviewer: reviewer ? stripPassword(reviewer) : {} };
      }),
    );
    res.json(enriched);
  });

  app.get("/api/reviews/mine", async (req: any, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const reviewsList = await storage.getReviewsByProvider(userId);
    const enriched = await Promise.all(
      reviewsList.map(async (r) => {
        const reviewer = await storage.getUser(r.reviewerId);
        return { ...r, reviewer: reviewer ? stripPassword(reviewer) : {} };
      }),
    );
    res.json(enriched);
  });

  app.get("/api/reviews/provider/:providerId", async (req, res) => {
    const reviewsList = await storage.getReviewsByProvider(
      req.params.providerId,
    );
    const enriched = await Promise.all(
      reviewsList.map(async (r) => {
        const reviewer = await storage.getUser(r.reviewerId);
        return { ...r, reviewer: reviewer ? stripPassword(reviewer) : {} };
      }),
    );
    res.json(enriched);
  });

  app.post("/api/reviews", async (req: any, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const { listingId, providerId, rating, comment } = req.body;
      if (!listingId || !providerId || !rating || !comment) {
        return res
          .status(400)
          .json({ message: "All review fields are required" });
      }
      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ message: "Rating must be between 1 and 5" });
      }
      const review = await storage.createReview({
        listingId,
        reviewerId: userId,
        providerId,
        rating,
        comment,
      });
      res.json(review);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/reviews/:id", async (req: any, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (user?.role !== "admin")
      return res.status(403).json({ message: "Not authorized" });
    try {
      await storage.deleteReview(req.params.id);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/gallery/:userId", async (req, res) => {
    try {
      const images = await storage.getGalleryImagesByUser(req.params.userId);
      res.json(images);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/gallery", async (req: any, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const { imageUrl, caption } = req.body;
      if (!imageUrl || typeof imageUrl !== "string") {
        return res.status(400).json({ message: "Image URL is required" });
      }
      const image = await storage.createGalleryImage({
        userId,
        imageUrl,
        caption: typeof caption === "string" ? caption : null,
      });
      res.json(image);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/gallery/:id", async (req: any, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      await storage.deleteGalleryImage(req.params.id, userId);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/listings/:id/images", async (req, res) => {
    try {
      const images = await storage.getListingImages(req.params.id);
      res.json(images);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/listings/:id/images", async (req: any, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const listing = await storage.getListing(req.params.id);
      if (!listing || listing.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const existingImages = await storage.getListingImages(req.params.id);
      const totalImages = (listing.image ? 1 : 0) + existingImages.length;
      if (totalImages >= 6) {
        return res
          .status(400)
          .json({ message: "Maximum 6 images per listing" });
      }
      const { imageUrl, sortOrder } = req.body;
      if (!imageUrl || typeof imageUrl !== "string") {
        return res.status(400).json({ message: "Image URL is required" });
      }
      const image = await storage.createListingImage({
        listingId: req.params.id,
        imageUrl,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      });
      res.json(image);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/listing-images/:id", async (req: any, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      await storage.deleteListingImage(req.params.id);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/users", async (req: any, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const user = await storage.getUser(userId);
      if (user?.role !== "admin")
        return res.status(403).json({ message: "Not authorized" });
      const allUsers = await storage.getAllUsers();
      res.json(allUsers.map(stripPassword));
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  });

  app.get("/api/admin/listings", async (req: any, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const user = await storage.getUser(userId);
      if (user?.role !== "admin")
        return res.status(403).json({ message: "Not authorized" });
      const allListings = await storage.getListings();
      const enriched = await Promise.all(
        allListings.map(async (l) => {
          const provider = await storage.getUser(l.userId);
          return { ...l, provider: provider ? stripPassword(provider) : {} };
        }),
      );
      res.json(enriched);
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  });

  app.get("/api/admin/reviews", async (req: any, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const user = await storage.getUser(userId);
      if (user?.role !== "admin")
        return res.status(403).json({ message: "Not authorized" });
      const allReviews = await storage.getAllReviews();
      const enriched = await Promise.all(
        allReviews.map(async (r) => {
          const reviewer = await storage.getUser(r.reviewerId);
          return { ...r, reviewer: reviewer ? stripPassword(reviewer) : {} };
        }),
      );
      res.json(enriched);
    } catch (error: any) {
      return res.status(401).json({ message: "Invalid token" });
    }
  });

  return httpServer;
}
