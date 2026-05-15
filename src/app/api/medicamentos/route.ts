import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDb();
    const medications = await db.all("SELECT REGISTRO as code, NOME as name FROM DEF_ITEM");
    await db.close();
    return NextResponse.json(medications);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
