# LocalHub - Local Services Marketplace

## Overview
A marketplace platform connecting customers with skilled workers and business owners in Nigeria. Users can discover local services, search by category/location, view provider profiles, leave reviews, and contact providers via phone/WhatsApp. All locations and pricing use Nigerian context (Naira currency, Nigerian cities).

## Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Node.js + Express
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Email/password authentication with bcrypt + express-session
- **Routing**: wouter
- **State**: TanStack React Query

## Authentication
- Simple email/password signup and login (no external auth providers)
- Session-based auth using express-session + connect-pg-simple
- Signup: `POST /api/auth/signup` (email, password, firstName, lastName, location)
- Login: `POST /api/auth/login` (email, password)
- Logout: `POST /api/auth/logout`
- Current user: `GET /api/auth/user`
- Auth middleware: `setupAuth()`, `isAuthenticated` from `server/auth.ts`
- User identity from `req.session.userId`
- Profile setup endpoint: `PATCH /api/auth/profile` (set role, location, phone, bio)
- Client-side hook: `useAuth()` from `@/hooks/use-auth.ts` (returns `user`, `isLoading`, `isAuthenticated`, `logout`)
- Client pages: `/login` (sign in), `/signup` (sign up) at `client/src/pages/auth.tsx`
- Old auth context at `@/lib/auth.tsx` re-exports from the new hook for backward compatibility

## User Schema
Users table fields: `id`, `email`, `password`, `firstName`, `lastName`, `profileImageUrl`, `role`, `phone`, `location`, `bio`, `createdAt`, `updatedAt`
- Password is hashed with bcrypt before storage
- Password is never returned in API responses
- Display name pattern: `[user.firstName, user.lastName].filter(Boolean).join(' ')`

## User Roles
- **Customer**: Browse/search services, leave reviews, contact providers via phone/WhatsApp
- **Business Owner**: Create business posts/offers, manage listings, receive reviews, contactable via phone/WhatsApp
- **Skilled Worker**: Create service listings, manage profile, receive reviews, contactable via phone/WhatsApp
- **Admin**: View all users/listings/reviews, remove inappropriate content

## Card Design
- **Service/Skilled Worker cards**: Image at top if uploaded, otherwise avatar circle (colored initial letter) with "Available" badge, category badge, description, Nigerian location, star rating, "Contact available"
- **Business cards**: Image at top with "Open" badge, title, location, star rating, price, optional website URL

## Onboarding
- After first signup, a profile setup modal appears if user has no role set
- Step 1: Choose role (Customer, Skilled Worker, Business Owner)
- Step 2: For providers, optionally add location, phone, bio (can skip)
- Component: `client/src/components/profile-setup-modal.tsx`

## Key Routes
- `/` - Home/Discovery page with search, category dropdown, location filter
- `/login` - Sign in page
- `/signup` - Sign up page
- `/dashboard` - Customer: search/discovery page (no stat cards). Provider: management dashboard with stats.
- `/listing/:id` - Listing detail with reviews
- `/profile/:id` - User profile (with Call/WhatsApp contact buttons for providers)
- `/admin` - Admin panel (requires admin role, redirects to /admin/login if not admin)
- `/admin/login` - Admin sign in page
- `/admin/signup` - Admin account creation page

## API Routes
- `POST /api/auth/signup` - Create account (email, password, firstName, lastName, location)
- `POST /api/auth/login` - Sign in (email, password)
- `POST /api/auth/admin/signup` - Create admin account (email, password, firstName, lastName)
- `POST /api/auth/admin/login` - Admin sign in (email, password) - rejects non-admin users
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/user` - Current authenticated user
- `PATCH /api/auth/profile` - Update user profile (role, location, phone, bio)
- `GET /api/users/:id` - Get user by ID
- `GET /api/listings` - All listings (enriched with provider, ratings)
- `GET /api/listings/mine` - My listings
- `GET /api/listings/user/:userId` - Listings by user
- `GET /api/listings/:id` - Single listing detail
- `POST /api/listings` - Create listing
- `DELETE /api/listings/:id` - Delete listing
- `POST /api/upload` - Upload image
- `GET /api/reviews/listing/:id` - Reviews for listing
- `GET /api/reviews/mine` - Reviews for current provider
- `GET /api/reviews/provider/:providerId` - Reviews for provider
- `POST /api/reviews` - Create review
- `DELETE /api/reviews/:id` - Delete review (admin only)
- `GET /api/gallery/:userId` - Gallery images for user
- `POST /api/gallery` - Upload gallery image (imageUrl, caption)
- `DELETE /api/gallery/:id` - Delete gallery image
- `GET /api/listings/:id/images` - Get images for a listing
- `POST /api/listings/:id/images` - Add image to listing (imageUrl, caption, sortOrder)
- `DELETE /api/listing-images/:id` - Delete listing image
- `GET /api/admin/users|listings|reviews` - Admin data

## Multi-Image Posts
- Business owners can upload multiple images per listing/post
- First uploaded image becomes the cover photo
- Listing detail page shows image carousel with prev/next, dots, thumbnail strip
- listing_images table: id, listingId, imageUrl, caption, sortOrder, createdAt
- Profile page shows "Business Gallery" / "Posts" for business owners, "Work Gallery" / "Services" for skilled workers

## Project Structure
- `client/src/pages/` - Page components
- `client/src/pages/auth.tsx` - Login and Signup pages
- `client/src/components/` - Shared components
- `client/src/hooks/use-auth.ts` - Auth hook (primary)
- `client/src/lib/auth.tsx` - Auth re-export (backward compatibility)
- `server/auth.ts` - Session-based authentication (signup, login, logout)
- `server/routes.ts` - API routes
- `server/storage.ts` - Database storage layer
- `server/seed.ts` - Seed data (Nigerian locations, Naira pricing)
- `shared/schema.ts` - Drizzle schema + types (re-exports users from shared/models/auth.ts)
- `shared/models/auth.ts` - User & session table definitions + auth validation schemas
