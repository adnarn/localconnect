# LocalConnect

A Nigerian local services marketplace connecting customers with skilled workers and local businesses.

## Quick Start

```bash
npm install
npm run dev
```

That's it. Open [http://localhost:5000](http://localhost:5000) in your browser.

**No database installation required.** The app uses an embedded SQLite database (`localconnect.db`) that is created automatically on first run, along with sample data.

## Demo Accounts

All demo accounts use the password: `password123`

| Role | Email |
|------|-------|
| Customer | sarah@example.com |
| Customer | michael@example.com |
| Business Owner | mamatiti@example.com |
| Skilled Worker | james@plumbing.com |
| Admin | *(create via /admin/signup)* |

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: SQLite (embedded, zero setup)
- **ORM**: Drizzle ORM

## Project Structure

```
localconnect/
├── client/          # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       └── hooks/
├── server/          # Express backend
│   ├── index.ts     # Entry point
│   ├── routes.ts    # API routes
│   ├── auth.ts      # Authentication
│   ├── storage.ts   # Database layer (SQLite)
│   └── seed.ts      # Sample data
├── shared/          # Shared types & schema
│   └── schema.ts
└── localconnect.db  # SQLite database (auto-created on first run)
```

## Features

- Browse local service listings and businesses
- Register as a customer, skilled worker, or business owner
- Create and manage service/business listings
- Leave reviews and ratings
- Upload profile and listing images
- Admin dashboard to manage users, listings, and reviews
