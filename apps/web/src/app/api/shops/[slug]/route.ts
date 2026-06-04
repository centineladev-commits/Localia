import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

// GET /api/shops/:slug  — comercio con sus productos
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const db = getDb();

    const shopResult = await db.execute(sql`
      SELECT
        s.*,
        sc.name  AS category_name,
        sc.color AS category_color,
        ST_X(s.location_point::geometry) AS lng,
        ST_Y(s.location_point::geometry) AS lat
      FROM shops s
      LEFT JOIN shop_categories sc ON sc.id = s.category_id
      WHERE s.slug = ${params.slug} AND s.active = true
      LIMIT 1
    `);

    if (shopResult.rows.length === 0) {
      return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
    }

    const shop = shopResult.rows[0];

    const productsResult = await db.execute(sql`
      SELECT p.*, pc.name AS category_name
      FROM products p
      LEFT JOIN product_categories pc ON pc.id = p.category_id
      WHERE p.shop_id = ${shop.id}::uuid AND p.active = true
      ORDER BY p.created_at DESC
    `);

    return NextResponse.json({ shop, products: productsResult.rows });
  } catch (err) {
    console.error("[GET /api/shops/:slug]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
