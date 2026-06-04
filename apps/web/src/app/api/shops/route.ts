import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";

// GET /api/shops?city_id=...&lat=...&lng=...&radius_km=...&category_id=...
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cityId     = searchParams.get("city_id");
  const lat        = parseFloat(searchParams.get("lat") ?? "0");
  const lng        = parseFloat(searchParams.get("lng") ?? "0");
  const radiusKm   = parseFloat(searchParams.get("radius_km") ?? "3");
  const categoryId = searchParams.get("category_id");

  if (!cityId) {
    return NextResponse.json({ error: "city_id requerido" }, { status: 400 });
  }

  try {
    const supabase = getAdminClient();
    const radiusM  = radiusKm * 1000;

    // Usar la función geoespacial creada en la migración
    const { data, error } = await supabase.rpc("get_shops_near", {
      p_lat:      lat,
      p_lng:      lng,
      p_city_id:  cityId,
      p_radius_m: radiusM,
    });

    if (error) {
      // Fallback: query sin geoespacial si la función no existe aún
      let query = supabase
        .from("shops")
        .select("id, name, slug, logo_url, category_id, address, opening_hours, phone, location_point")
        .eq("city_id", cityId)
        .eq("active", true)
        .eq("status", "verified");

      if (categoryId) query = query.eq("category_id", categoryId);

      const { data: fallback, error: e2 } = await query.limit(100);
      if (e2) throw e2;

      return NextResponse.json({ shops: fallback ?? [] });
    }

    return NextResponse.json({ shops: data ?? [] });
  } catch (err: any) {
    console.error("[GET /api/shops]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
