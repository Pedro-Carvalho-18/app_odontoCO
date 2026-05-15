import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string, fileId: string }> }
) {
  try {
    const { id: nropac, fileId } = await params;
    const body = await request.json();
    const { nroIntPac } = body;

    const db = await getDb();

    // 1. Verify file ownership
    const arquivo = await db.get(
      `SELECT ID FROM ARQUIVO_PACIENTE WHERE ID = ? AND NROPAC = ?`,
      [fileId, nropac]
    );

    if (!arquivo) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
    }

    // 2. Update DB - nroIntPac can be null for 'avulso'
    await db.run(
      `UPDATE ARQUIVO_PACIENTE SET NROINTPAC = ? WHERE ID = ?`,
      [nroIntPac === "" ? null : nroIntPac, fileId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (File PATCH):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
