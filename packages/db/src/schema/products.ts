import {
  pgTable, uuid, text, numeric, integer, boolean, timestamp, pgEnum,
} from "drizzle-orm/pg-core";
import { cities } from "./cities";
import { shops } from "./shops";

export const productConditionEnum = pgEnum("product_condition", ["new"]);

export const productCategories = pgTable("product_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  shopCategoryId: uuid("shop_category_id"),  // categoría padre del comercio
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  // Desnormalizado para queries rápidas sin JOIN — siempre igual que shop.cityId
  cityId: uuid("city_id").notNull().references(() => cities.id),
  categoryId: uuid("category_id").references(() => productCategories.id),

  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("EUR"),
  stock: integer("stock").default(0),
  sku: text("sku"),

  // REGLA DE NEGOCIO: solo 'new' está permitido. Enum + default garantizan esto.
  condition: productConditionEnum("condition").default("new").notNull(),

  images: text("images").array(),    // array de URLs
  tags: text("tags").array(),
  weightGrams: integer("weight_grams"),

  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductCategory = typeof productCategories.$inferSelect;
