import { eq, and, or, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import * as schema from "@shared/schema";
import {
  users, listings, reviews, messages, galleryImages, listingImages,
  type User, type UpsertUser,
  type Listing, type InsertListing,
  type ListingImage, type InsertListingImage,
  type Review, type InsertReview,
  type Message, type InsertMessage,
  type GalleryImage, type InsertGalleryImage,
} from "@shared/schema";

const dbPath = path.join(process.cwd(), "localconnect.db");
const sqlite = new Database(dbPath);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    profile_image_url TEXT,
    role TEXT,
    phone TEXT,
    location TEXT,
    bio TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    price TEXT,
    image TEXT,
    location TEXT,
    type TEXT NOT NULL DEFAULT 'service',
    website_url TEXT,
    active INTEGER DEFAULT 1,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS gallery_images (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS listing_images (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at INTEGER
  );
`);

export const db = drizzle(sqlite, { schema });

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  createListing(listing: InsertListing): Promise<Listing>;
  getListing(id: string): Promise<Listing | undefined>;
  getListings(): Promise<Listing[]>;
  getListingsByUser(userId: string): Promise<Listing[]>;
  deleteListing(id: string): Promise<void>;

  createReview(review: InsertReview): Promise<Review>;
  getReviewsByListing(listingId: string): Promise<Review[]>;
  getReviewsByProvider(providerId: string): Promise<Review[]>;
  deleteReview(id: string): Promise<void>;
  getAllReviews(): Promise<Review[]>;

  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(userId1: string, userId2: string): Promise<Message[]>;
  getConversations(userId: string): Promise<string[]>;
  deleteMessage(id: string, senderId: string): Promise<void>;

  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  getGalleryImagesByUser(userId: string): Promise<GalleryImage[]>;
  deleteGalleryImage(id: string, userId: string): Promise<void>;

  createListingImage(image: InsertListingImage): Promise<ListingImage>;
  getListingImages(listingId: string): Promise<ListingImage[]>;
  deleteListingImage(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = db.select().from(users).where(eq(users.id, id)).all();
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).all();
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    const result = db.insert(users).values(insertUser).returning().all();
    return result[0];
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined> {
    const result = db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
      .all();
    return result.length > 0 ? result[0] : undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).all();
  }

  async createListing(listing: InsertListing): Promise<Listing> {
    const result = db.insert(listings).values(listing).returning().all();
    return result[0];
  }

  async getListing(id: string): Promise<Listing | undefined> {
    const result = db.select().from(listings).where(eq(listings.id, id)).all();
    return result.length > 0 ? result[0] : undefined;
  }

  async getListings(): Promise<Listing[]> {
    return db.select().from(listings).where(eq(listings.active, true)).orderBy(desc(listings.createdAt)).all();
  }

  async getListingsByUser(userId: string): Promise<Listing[]> {
    return db.select().from(listings).where(eq(listings.userId, userId)).orderBy(desc(listings.createdAt)).all();
  }

  async deleteListing(id: string): Promise<void> {
    db.delete(listings).where(eq(listings.id, id)).run();
  }

  async createReview(review: InsertReview): Promise<Review> {
    const result = db.insert(reviews).values(review).returning().all();
    return result[0];
  }

  async getReviewsByListing(listingId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.listingId, listingId)).orderBy(desc(reviews.createdAt)).all();
  }

  async getReviewsByProvider(providerId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.providerId, providerId)).orderBy(desc(reviews.createdAt)).all();
  }

  async deleteReview(id: string): Promise<void> {
    db.delete(reviews).where(eq(reviews.id, id)).run();
  }

  async getAllReviews(): Promise<Review[]> {
    return db.select().from(reviews).orderBy(desc(reviews.createdAt)).all();
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = db.insert(messages).values(message).returning().all();
    return result[0];
  }

  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(messages.createdAt)
      .all();
  }

  async getConversations(userId: string): Promise<string[]> {
    const sent = db
      .selectDistinct({ id: messages.receiverId })
      .from(messages)
      .where(eq(messages.senderId, userId))
      .all();
    const received = db
      .selectDistinct({ id: messages.senderId })
      .from(messages)
      .where(eq(messages.receiverId, userId))
      .all();

    const ids = new Set<string>();
    sent.forEach((r) => ids.add(r.id));
    received.forEach((r) => ids.add(r.id));
    return Array.from(ids);
  }

  async deleteMessage(id: string, senderId: string): Promise<void> {
    db.delete(messages).where(and(eq(messages.id, id), eq(messages.senderId, senderId))).run();
  }

  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    const result = db.insert(galleryImages).values(image).returning().all();
    return result[0];
  }

  async getGalleryImagesByUser(userId: string): Promise<GalleryImage[]> {
    return db.select().from(galleryImages).where(eq(galleryImages.userId, userId)).orderBy(desc(galleryImages.createdAt)).all();
  }

  async deleteGalleryImage(id: string, userId: string): Promise<void> {
    db.delete(galleryImages).where(and(eq(galleryImages.id, id), eq(galleryImages.userId, userId))).run();
  }

  async createListingImage(image: InsertListingImage): Promise<ListingImage> {
    const result = db.insert(listingImages).values(image).returning().all();
    return result[0];
  }

  async getListingImages(listingId: string): Promise<ListingImage[]> {
    return db.select().from(listingImages).where(eq(listingImages.listingId, listingId)).orderBy(listingImages.sortOrder).all();
  }

  async deleteListingImage(id: string): Promise<void> {
    db.delete(listingImages).where(eq(listingImages.id, id)).run();
  }
}

export const storage = new DatabaseStorage();

export function stripPassword<T extends { password?: string | null }>(user: T): Omit<T, "password"> {
  const { password: _, ...rest } = user;
  return rest;
}
