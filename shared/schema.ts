import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const listings = sqliteTable("listings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  price: text("price"),
  image: text("image"),
  location: text("location"),
  type: text("type").notNull().default("service"),
  websiteUrl: text("website_url"),
  active: integer("active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => {
  return {
    userIdIdx: index("idx_listings_user_id").on(table.userId),
    titleIdx: index("idx_listings_title").on(table.title),
    categoryIdx: index("idx_listings_category").on(table.category),
  };
});

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  listingId: text("listing_id").notNull(),
  reviewerId: text("reviewer_id").notNull(),
  providerId: text("provider_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => {
  return {
    listingIdIdx: index("idx_reviews_listing_id").on(table.listingId),
    reviewerIdIdx: index("idx_reviews_reviewer_id").on(table.reviewerId),
    providerIdIdx: index("idx_reviews_provider_id").on(table.providerId),
  };
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => {
  return {
    senderIdIdx: index("idx_messages_sender_id").on(table.senderId),
    receiverIdIdx: index("idx_messages_receiver_id").on(table.receiverId),
    createdAtIdx: index("idx_messages_created_at").on(table.createdAt),
  };
});

export const galleryImages = sqliteTable("gallery_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertGalleryImageSchema = createInsertSchema(galleryImages).omit({ id: true, createdAt: true });
export type GalleryImage = typeof galleryImages.$inferSelect;
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;

export const listingImages = sqliteTable("listing_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  listingId: text("listing_id").notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertListingSchema = createInsertSchema(listings).omit({ id: true, createdAt: true });
export const insertListingImageSchema = createInsertSchema(listingImages).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

export const profileSetupSchema = z.object({
  role: z.enum(["customer", "business_owner", "skilled_worker"]),
  location: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export type Listing = typeof listings.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;
export type ListingImage = typeof listingImages.$inferSelect;
export type InsertListingImage = z.infer<typeof insertListingImageSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
