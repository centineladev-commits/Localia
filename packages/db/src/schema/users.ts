import { pgTable, uuid, text, timestamp, customType } from "drizzle-orm/pg-core";
import { cities } from "./cities";

const geographyPoint = customType<{ data: string }>({
  dataType() {
    return "geography(Point, 4326)";
  },
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  phone: text("phone"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  // Ciudad activa seleccionada por el usuario (sesgo geográfico)
  activeCityId: uuid("active_city_id").references(() => cities.id),
  // Última posición GPS (para detección automática de ciudad)
  locationPoint: geographyPoint("location_point"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
