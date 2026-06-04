import { pgTable, uuid, text, integer, boolean, timestamp, customType } from "drizzle-orm/pg-core";

// Tipo personalizado para columnas PostGIS GEOGRAPHY
const geography = customType<{ data: string }>({
  dataType() {
    return "geography";
  },
});

const geographyPoint = customType<{ data: string }>({
  dataType() {
    return "geography(Point, 4326)";
  },
});

const geographyPolygon = customType<{ data: string }>({
  dataType() {
    return "geography(Polygon, 4326)";
  },
});

export const cities = pgTable("cities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),             // "Madrid", "Barcelona"
  slug: text("slug").unique().notNull(),    // "madrid", "barcelona"
  boundary: geographyPolygon("boundary"),  // polígono límite municipal
  center: geographyPoint("center"),        // centro de la ciudad
  zoomLevel: integer("zoom_level").default(13),
  country: text("country").default("ES"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;
