import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, fileId: string }> }
) {
  try {
    const { id: nropac, fileId } = await params;
    const db = await getDb();

    // 1. Handle Virtual Documents (LOG_DOCUMENTO)
    if (fileId.startsWith("DOC_")) {
      const docId = fileId.replace("DOC_", "");
      await db.run(
        `DELETE FROM LOG_DOCUMENTO WHERE ID_DOCUMENTO = ? AND NROPAC = ?`,
        [docId, nropac]
      );
      await db.close();
      return NextResponse.json({ success: true });
    }

    // 2. Handle Physical Files (ARQUIVO_PACIENTE)
    const arquivo = await db.get(
      `SELECT PATH FROM ARQUIVO_PACIENTE WHERE ID = ? AND NROPAC = ?`,
      [fileId, nropac]
    );

    if (!arquivo) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
    }

    // 2. Delete from DB
    await db.run(`DELETE FROM ARQUIVO_PACIENTE WHERE ID = ?`, [fileId]);

    // 3. Delete physical file
    try {
      const fullPath = path.join(process.cwd(), "public", arquivo.PATH);
      await unlink(fullPath);
    } catch (fsError) {
      console.warn("Could not delete physical file, it might not exist:", fsError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (File DELETE):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
