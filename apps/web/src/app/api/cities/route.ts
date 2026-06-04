import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

// GET /api/cities — lista de ciudades activas con centro del mapa
export async function GET() {
  try {
    const db = getDb();
    const result = await db.execute(sql`
      SELECT
        id, name, slug, zoom_level,
        ST_X(center::geometry) AS lng,
        ST_Y(center::geometry) AS lat
      FROM cities
      WHERE active = true
      ORDER BY name ASC
    `);
    return NextResponse.json({ cities: result.rows });
  } catch (err) {
    console.error("[GET /api/cities]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
