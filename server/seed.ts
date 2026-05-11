import { db } from "./storage";
import { users, listings, reviews } from "@shared/schema";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  // In development, always ensure admin user exists
  if (process.env.NODE_ENV !== "production") {
    const adminExists = existingUsers.some(
      (user) => user.email === "admin@localconnect.com",
    );
    if (!adminExists) {
      console.log("Admin user missing in development, adding...");
      const hashedPassword = await bcrypt.hash("password123", 10);
      await db.insert(users).values({
        id: "seed-admin",
        firstName: "Admin",
        lastName: "User",
        email: "admin@localconnect.com",
        password: hashedPassword,
        role: "admin",
        location: "Lagos, Nigeria",
        phone: "+234 800 000 0000",
        bio: "System administrator for LocalConnect platform.",
      });
    }
  }

  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create admin user
  const [admin] = await db
    .insert(users)
    .values({
      id: "seed-admin",
      firstName: "Admin",
      lastName: "User",
      email: "admin@localconnect.com",
      password: hashedPassword,
      role: "admin",
      location: "Lagos, Nigeria",
      phone: "+234 800 000 0000",
      bio: "System administrator for LocalConnect platform.",
    })
    .returning();

  const [customer1] = await db
    .insert(users)
    .values({
      id: "seed-customer1",
      firstName: "Sarah",
      lastName: "Adeyemi",
      email: "sarah@example.com",
      password: hashedPassword,
      role: "customer",
      location: "Ikeja, Lagos",
      phone: "+234 801 555 0101",
      bio: "Looking for reliable local services in Lagos.",
    })
    .returning();

  const [customer2] = await db
    .insert(users)
    .values({
      id: "seed-customer2",
      firstName: "Michael",
      lastName: "Obi",
      email: "michael@example.com",
      password: hashedPassword,
      role: "customer",
      location: "Lekki, Lagos",
      phone: "+234 802 555 0102",
    })
    .returning();

  const [business1] = await db
    .insert(users)
    .values({
      id: "seed-business1",
      firstName: "Mama Titi's",
      lastName: "Kitchen",
      email: "mamatiti@example.com",
      password: hashedPassword,
      role: "business_owner",
      location: "Victoria Island, Lagos",
      phone: "+234 803 555 0201",
      bio: "Authentic Nigerian cuisine and catering services since 2016.",
    })
    .returning();

  const [business2] = await db
    .insert(users)
    .values({
      id: "seed-business2",
      firstName: "Brew & Chill",
      lastName: "Cafe",
      email: "info@brewchill.com",
      password: hashedPassword,
      role: "business_owner",
      location: "Wuse 2, Abuja",
      phone: "+234 804 555 0202",
      bio: "Premium coffee, smoothies, and workspace in the heart of Abuja.",
    })
    .returning();

  const [business3] = await db
    .insert(users)
    .values({
      id: "seed-business3",
      firstName: "AutoFix",
      lastName: "Motors",
      email: "service@autofixmotors.com",
      password: hashedPassword,
      role: "business_owner",
      location: "Surulere, Lagos",
      phone: "+234 805 555 0203",
      bio: "Trusted auto repair and maintenance workshop with certified mechanics.",
    })
    .returning();

  const [worker1] = await db
    .insert(users)
    .values({
      id: "seed-worker1",
      firstName: "James",
      lastName: "Okonkwo",
      email: "james@plumbing.com",
      password: hashedPassword,
      role: "skilled_worker",
      location: "Yaba, Lagos",
      phone: "+234 806 555 0301",
      bio: "Licensed plumber with 12 years of residential and commercial experience.",
    })
    .returning();

  const [worker2] = await db
    .insert(users)
    .values({
      id: "seed-worker2",
      firstName: "Amina",
      lastName: "Bello",
      email: "amina@cleaning.com",
      password: hashedPassword,
      role: "skilled_worker",
      location: "Garki, Abuja",
      phone: "+234 807 555 0302",
      bio: "Professional cleaning specialist offering deep cleaning, move-in/out, and regular maintenance.",
    })
    .returning();

  const [worker3] = await db
    .insert(users)
    .values({
      id: "seed-worker3",
      firstName: "David",
      lastName: "Eze",
      email: "david@electric.com",
      password: hashedPassword,
      role: "skilled_worker",
      location: "Port Harcourt, Rivers",
      phone: "+234 808 555 0303",
      bio: "Certified electrician specializing in residential wiring, panel upgrades, and generator installation.",
    })
    .returning();

  const [worker4] = await db
    .insert(users)
    .values({
      id: "seed-worker4",
      firstName: "Fatima",
      lastName: "Abubakar",
      email: "fatima@landscapes.com",
      password: hashedPassword,
      role: "skilled_worker",
      location: "Maitama, Abuja",
      phone: "+234 809 555 0304",
      bio: "Landscape designer and maintenance expert with a passion for tropical gardens.",
    })
    .returning();

  const [worker5] = await db
    .insert(users)
    .values({
      id: "seed-worker5",
      firstName: "Kevin",
      lastName: "Nnamdi",
      email: "kevin@painting.com",
      password: hashedPassword,
      role: "skilled_worker",
      location: "Ikeja, Lagos",
      phone: "+234 810 555 0305",
      bio: "Professional painter specializing in interior and exterior residential painting.",
    })
    .returning();

  const [listing1] = await db
    .insert(listings)
    .values({
      userId: worker1.id,
      title: "Professional Plumbing Service",
      description:
        "Expert plumbing services including leak repair, pipe installation, drain cleaning, and bathroom remodeling. Available for emergency calls. Free estimates for all jobs.",
      category: "Plumbing",
      price: "\u20A615,000/job",
      location: "Yaba, Lagos",
      type: "service",
    })
    .returning();

  const [listing2] = await db
    .insert(listings)
    .values({
      userId: worker2.id,
      title: "Premium House Cleaning",
      description:
        "Thorough house cleaning services including deep cleaning, regular maintenance, move-in/out cleaning, and post-construction cleanup. Eco-friendly products used.",
      category: "Cleaning",
      price: "\u20A68,000/session",
      location: "Garki, Abuja",
      type: "service",
    })
    .returning();

  const [listing3] = await db
    .insert(listings)
    .values({
      userId: worker3.id,
      title: "Certified Electrical Services",
      description:
        "Full electrical services including wiring, panel upgrades, outlet installation, generator hookup, and safety inspections. Licensed and insured.",
      category: "Electrical",
      price: "\u20A620,000/job",
      location: "Port Harcourt, Rivers",
      type: "service",
    })
    .returning();

  const [listing4] = await db
    .insert(listings)
    .values({
      userId: worker4.id,
      title: "Landscape Design & Maintenance",
      description:
        "Complete landscaping services from design to maintenance. Specializing in tropical gardens, lawn care, tree trimming, and seasonal planting.",
      category: "Landscaping",
      price: "\u20A612,000/session",
      location: "Maitama, Abuja",
      type: "service",
    })
    .returning();

  const [listing5] = await db
    .insert(listings)
    .values({
      userId: worker5.id,
      title: "Interior & Exterior Painting",
      description:
        "High-quality painting services for homes and small businesses. Colour consultation available. We use premium paints and ensure clean, professional results.",
      category: "Painting",
      price: "\u20A610,000/room",
      location: "Ikeja, Lagos",
      type: "service",
    })
    .returning();

  const [listing6] = await db
    .insert(listings)
    .values({
      userId: business1.id,
      title: "Mama Titi's Kitchen",
      description:
        "Authentic Nigerian dishes prepared fresh daily. From jollof rice to egusi soup, suya, and puff-puff. Catering available for parties, weddings, and corporate events.",
      category: "Food & Bakery",
      price: "\u20A62,000 - \u20A65,000",
      image: "/images/bakery-business.png",
      location: "Victoria Island, Lagos",
      type: "business",
    })
    .returning();

  const [listing7] = await db
    .insert(listings)
    .values({
      userId: business2.id,
      title: "Brew & Chill Cafe",
      description:
        "Premium coffee shop featuring locally sourced beans, fresh smoothies, and a cozy co-working space. Free WiFi and live music on weekends.",
      category: "Coffee & Cafe",
      price: "\u20A6500 - \u20A63,000",
      image: "/images/coffee-shop.png",
      location: "Wuse 2, Abuja",
      type: "business",
    })
    .returning();

  const [listing8] = await db
    .insert(listings)
    .values({
      userId: business3.id,
      title: "AutoFix Motors Workshop",
      description:
        "Full-service auto repair with certified mechanics. Oil changes, brake service, engine diagnostics, AC repair, and more. Transparent pricing and honest service.",
      category: "Auto Repair",
      price: "\u20A65,000 - \u20A650,000",
      image: "/images/auto-repair.png",
      location: "Surulere, Lagos",
      type: "business",
    })
    .returning();

  await db.insert(reviews).values([
    {
      listingId: listing1.id,
      reviewerId: customer1.id,
      providerId: worker1.id,
      rating: 5,
      comment:
        "James fixed our leaky faucet quickly and professionally. Very fair pricing and clean work. Highly recommended!",
    },
    {
      listingId: listing1.id,
      reviewerId: customer2.id,
      providerId: worker1.id,
      rating: 4,
      comment:
        "Good service, arrived on time and fixed the issue. Would use again.",
    },
    {
      listingId: listing2.id,
      reviewerId: customer1.id,
      providerId: worker2.id,
      rating: 5,
      comment:
        "Amina's team did an amazing deep clean of our home. Everything was spotless. The eco-friendly products were a nice touch.",
    },
    {
      listingId: listing3.id,
      reviewerId: customer2.id,
      providerId: worker3.id,
      rating: 5,
      comment:
        "David upgraded our electrical panel and installed new outlets. Very knowledgeable and professional.",
    },
    {
      listingId: listing4.id,
      reviewerId: customer1.id,
      providerId: worker4.id,
      rating: 4,
      comment:
        "Beautiful landscape design. Fatima has a great eye for tropical gardens. The plants look amazing.",
    },
    {
      listingId: listing5.id,
      reviewerId: customer2.id,
      providerId: worker5.id,
      rating: 5,
      comment:
        "Kevin painted our entire flat. The colour consultation was very helpful and the results are stunning.",
    },
    {
      listingId: listing6.id,
      reviewerId: customer1.id,
      providerId: business1.id,
      rating: 5,
      comment:
        "Best jollof rice on the Island! The small chops are incredible too. Perfect for our office party catering.",
    },
    {
      listingId: listing6.id,
      reviewerId: customer2.id,
      providerId: business1.id,
      rating: 4,
      comment:
        "Great food with generous portions. Prices are reasonable for the quality.",
    },
    {
      listingId: listing7.id,
      reviewerId: customer1.id,
      providerId: business2.id,
      rating: 5,
      comment:
        "Perfect coffee spot for working remotely. Great atmosphere, excellent coffee, and friendly staff.",
    },
    {
      listingId: listing8.id,
      reviewerId: customer1.id,
      providerId: business3.id,
      rating: 4,
      comment:
        "Honest and reliable auto workshop. They diagnosed the issue quickly and didn't try to upsell unnecessary services.",
    },
  ]);

  console.log("Database seeded successfully!");
}
