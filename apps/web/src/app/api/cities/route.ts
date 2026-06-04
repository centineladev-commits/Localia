import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";

// GET /api/cities — ciudades activas
export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("cities")
      .select("id, name, slug, zoom_level")
      .eq("active", true)
      .order("name");

    if (error) throw error;
    return NextResponse.json({ cities: data ?? [] });
  } catch (err: any) {
    console.error("[GET /api/cities]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
