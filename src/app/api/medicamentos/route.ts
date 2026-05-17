import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const medications = await db.all(`
      SELECT 
        REGISTRO as code, 
        NOME as name, 
        POSADULTO as posologyAdult, 
        QTDADULTO as quantityAdult, 
        POSCRIANCA as posologyChild, 
        QTDCRIANCA as quantityChild,
        USO as usage
      FROM DEF_ITEM
    `);
    await db.close();
    return NextResponse.json(medications);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
