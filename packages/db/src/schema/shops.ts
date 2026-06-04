import {
  pgTable, uuid, text, boolean, timestamp, jsonb, customType, pgEnum,
} from "drizzle-orm/pg-core";
import { cities } from "./cities";
import { users }  from "./users";

const geographyPoint = customType<{ data: string }>({
  dataType: () => "geography(Point, 4326)",
});

export const shopStatusEnum = pgEnum("shop_status", [
  "pending",
  "verified",
  "suspended",
]);

export const shopCategories = pgTable("shop_categories", {
  id:    uuid("id").primaryKey().defaultRandom(),
  name:  text("name").notNull(),
  slug:  text("slug").unique().notNull(),
  icon:  text("icon"),
  color: text("color"),
});

export const shops = pgTable("shops", {
  id:             uuid("id").primaryKey().defaultRandom(),
  ownerUserId:    uuid("owner_user_id").notNull().references(() => users.id),
  name:           text("name").notNull(),
  slug:           text("slug").unique().notNull(),
  description:    text("description"),
  categoryId:     uuid("category_id").references(() => shopCategories.id),
  logoUrl:        text("logo_url"),
  coverUrl:       text("cover_url"),
  cityId:         uuid("city_id").notNull().references(() => cities.id),
  address:        text("address"),
  locationPoint:  geographyPoint("location_point").notNull(),
  phone:          text("phone"),
  website:        text("website"),
  openingHours:   jsonb("opening_hours"),
  stripeAccountId: text("stripe_account_id"),
  status:         shopStatusEnum("status").default("pending"),
  active:         boolean("active").default(false),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Shop         = typeof shops.$inferSelect;
export type NewShop      = typeof shops.$inferInsert;
export type ShopCategory = typeof shopCategories.$inferSelect;
