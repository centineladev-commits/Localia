import {
  pgTable, uuid, text, boolean, timestamp, jsonb, customType, pgEnum,
} from "drizzle-orm/pg-core";
import { cities } from "./cities";
import { users } from "./users";

const geographyPoint = customType<{ data: string }>({
  dataType() {
    return "geography(Point, 4326)";
  },
});

export const shopStatusEnum = pgEnum("shop_status", [
  "pending",    // recién registrado, pendiente de verificación
  "verified",   // verificado por el admin
  "suspended",  // suspendido
]);

export const shopCategories = pgTable("shop_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),      // "Alimentación", "Moda", "Electrónica"
  slug: text("slug").unique().notNull(),
  icon: text("icon"),                // nombre del icono (lucide-react)
  color: text("color"),              // hex color para el pin del mapa
});

export const shops = pgTable("shops", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),   // URL: /tienda/panaderia-garcia
  description: text("description"),
  categoryId: uuid("category_id").references(() => shopCategories.id),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),

  // Geolocalización — OBLIGATORIO para aparecer en el mapa
  cityId: uuid("city_id").notNull().references(() => cities.id),
  address: text("address"),
  locationPoint: geographyPoint("location_point").notNull(),

  phone: text("phone"),
  website: text("website"),
  // { "mon": "09:00-20:00", "tue": "09:00-20:00", "sun": null (cerrado) }
  openingHours: jsonb("opening_hours"),

  // Stripe Connect — se rellena tras el onboarding del comercio
  stripeAccountId: text("stripe_account_id"),

  status: shopStatusEnum("status").default("pending"),
  active: boolean("active").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type ShopCategory = typeof shopCategories.$inferSelect;
