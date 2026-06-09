import { NextResponse } from "next/server";
import { z, ZodSchema } from "zod";

/**
 * Valida el body JSON de una request contra un esquema zod.
 * Devuelve { data } si es válido, o { error: NextResponse } con 400 si no.
 * Centraliza la validación server-side (nunca confiar en el cliente).
 *
 * Uso:
 *   const parsed = await validateBody(req, MySchema);
 *   if (parsed.error) return parsed.error;
 *   const { ...fields } = parsed.data;
 */
export async function validateBody<T extends ZodSchema>(
  req: Request,
  schema: T
): Promise<{ data: z.infer<T>; error?: never } | { data?: never; error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: NextResponse.json({ error: "JSON inválido" }, { status: 400 }) };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    const msg = first ? `${first.path.join(".")}: ${first.message}` : "Datos inválidos";
    return { error: NextResponse.json({ error: msg }, { status: 400 }) };
  }
  return { data: result.data };
}

export { z };
