import {
  pgTable, uuid, text, integer, boolean, timestamp, customType,
} from "drizzle-orm/pg-core";

// Tipo PostGIS — Drizzle no tiene soporte nativo, usamos customType
const geographyPoint = customType<{ data: string }>({
  dataType: () => "geography(Point, 4326)",
});

const geographyPolygon = customType<{ data: string }>({
  dataType: () => "geography(Polygon, 4326)",
});

export const cities = pgTable("cities", {
  id:         uuid("id").primaryKey().defaultRandom(),
  name:       text("name").notNull(),
  slug:       text("slug").unique().notNull(),
  boundary:   geographyPolygon("boundary"),
  center:     geographyPoint("center"),
  zoomLevel:  integer("zoom_level").default(13),
  country:    text("country").default("ES"),
  active:     boolean("active").default(true),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type City    = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;
