import {
  pgTable, uuid, text, numeric, integer, timestamp, jsonb, pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { shops } from "./shops";
import { products } from "./products";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",     // creado, pendiente de pago
  "paid",        // pago confirmado por Stripe webhook
  "processing",  // el comercio está preparando el pedido
  "ready",       // listo para recoger / en camino
  "delivered",   // entregado
  "cancelled",   // cancelado
]);

export const deliveryTypeEnum = pgEnum("delivery_type", [
  "pickup",          // recogida en tienda
  "local_delivery",  // entrega local por el comercio
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerUserId: uuid("buyer_user_id").notNull().references(() => users.id),
  shopId: uuid("shop_id").notNull().references(() => shops.id),

  status: orderStatusEnum("status").default("pending"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }),
  // Comisión de la plataforma (ej. 8% del subtotal)
  platformFee: numeric("platform_fee", { precision: 10, scale: 2 }),
  total: numeric("total", { precision: 10, scale: 2 }),

  deliveryType: deliveryTypeEnum("delivery_type").default("pickup"),
  // Dirección solo aplica si delivery_type = 'local_delivery'
  deliveryAddress: jsonb("delivery_address"),

  // ID del PaymentIntent de Stripe
  stripePaymentId: text("stripe_payment_id"),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  // Precio en el momento de la compra (snapshot, no referencia mutable)
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  buyerId: uuid("buyer_id").notNull().references(() => users.id),
  shopId: uuid("shop_id").notNull().references(() => shops.id),
  rating: integer("rating").notNull(),   // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type Review = typeof reviews.$inferSelect;
