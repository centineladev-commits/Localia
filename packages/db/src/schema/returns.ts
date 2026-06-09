import {
  pgTable, uuid, text, numeric, integer, timestamp, pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { shops } from "./shops";
import { orders, orderItems } from "./orders";

// Estado de una solicitud de devolución.
export const returnStatusEnum = pgEnum("return_status", [
  "pending",    // solicitada por el comprador, pendiente de revisión
  "accepted",   // aceptada por el vendedor/admin, reembolso en curso
  "rejected",   // rechazada (con motivo en resolution_note)
  "completed",  // reembolso completado/confirmado
]);

export const returns = pgTable("returns", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  // NULL = pedido completo; con valor = línea concreta (devolución parcial)
  orderItemId: uuid("order_item_id").references(() => orderItems.id, { onDelete: "set null" }),
  buyerUserId: uuid("buyer_user_id").notNull().references(() => users.id),
  shopId: uuid("shop_id").notNull().references(() => shops.id),

  status: returnStatusEnum("status").notNull().default("pending"),
  reason: text("reason").notNull(),
  resolutionNote: text("resolution_note"),
  quantity: integer("quantity"),
  // Importe a reembolsar — SIEMPRE calculado en servidor, nunca del cliente
  refundAmount: numeric("refund_amount", { precision: 10, scale: 2 }),
  stripeRefundId: text("stripe_refund_id"),
  resolvedBy: uuid("resolved_by").references(() => users.id),

  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Return = typeof returns.$inferSelect;
export type NewReturn = typeof returns.$inferInsert;
