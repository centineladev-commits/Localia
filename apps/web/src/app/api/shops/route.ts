import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { shops, shopCategories } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

// GET /api/shops?city_id=...&lat=...&lng=...&radius_km=...&category_id=...
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cityId    = searchParams.get("city_id");
  const lat       = parseFloat(searchParams.get("lat") ?? "0");
  const lng       = parseFloat(searchParams.get("lng") ?? "0");
  const radiusKm  = parseFloat(searchParams.get("radius_km") ?? "3");
  const categoryId = searchParams.get("category_id");

  if (!cityId) {
    return NextResponse.json({ error: "city_id requerido" }, { status: 400 });
  }

  try {
    const db = getDb();
    const radiusMeters = radiusKm * 1000;

    // Query geoespacial: comercios de la ciudad dentro del radio
    const results = await db.execute(sql`
      SELECT
        s.id, s.name, s.slug, s.logo_url, s.category_id, s.address,
        s.opening_hours, s.phone,
        ST_X(s.location_point::geometry) AS lng,
        ST_Y(s.location_point::geometry) AS lat,
        ST_Distance(s.location_point, ST_MakePoint(${lng}, ${lat})::geography) AS distance_meters,
        sc.color AS category_color
      FROM shops s
      LEFT JOIN shop_categories sc ON sc.id = s.category_id
      WHERE
        s.city_id = ${cityId}::uuid
        AND s.active = true
        AND s.status = 'verified'
        ${lat && lng ? sql`AND ST_DWithin(s.location_point, ST_MakePoint(${lng}, ${lat})::geography, ${radiusMeters})` : sql``}
        ${categoryId ? sql`AND s.category_id = ${categoryId}::uuid` : sql``}
      ORDER BY distance_meters ASC NULLS LAST
      LIMIT 100
    `);

    return NextResponse.json({ shops: results.rows });
  } catch (err) {
    console.error("[GET /api/shops]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
