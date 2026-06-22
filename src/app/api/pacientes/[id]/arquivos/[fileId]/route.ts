import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";
import { unlink, readFile } from "fs/promises";
import fs from "fs";
import path from "path";

// Helper to resolve the real physical file path
function getPhysicalFilePath(dbPath: string): string {
  if (process.env.UPLOAD_DIR) {
    const suffix = dbPath.replace(/^\/uploads\/?/, "");
    return path.join(process.env.UPLOAD_DIR, suffix);
  } else {
    return path.join(process.cwd(), "public", dbPath);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string, fileId: string }> }
) {
  try {
    const { id: nropac, fileId } = await params;

    // Se for um documento virtual (atestado, receita, etc. com ID começando com DOC_)
    if (fileId.startsWith("DOC_")) {
      const docId = fileId.replace("DOC_", "");
      const db = await getDb();
      const doc = await db.get(
        `SELECT NOME, TIPO, TEXTO, TIME_STAMP_INS FROM LOG_DOCUMENTO WHERE ID_DOCUMENTO = ? AND NROPAC = ?`,
        [docId, nropac]
      );
      if (!doc) {
        return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
      }
      // Retorna as informações como JSON
      return NextResponse.json(doc);
    }

    const db = await getDb();
    const arquivo = await db.get(
      `SELECT PATH, NOME FROM ARQUIVO_PACIENTE WHERE ID = ? AND NROPAC = ?`,
      [fileId, nropac]
    );

    if (!arquivo) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
    }

    const filePath = getPhysicalFilePath(arquivo.PATH);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Arquivo físico não encontrado no servidor" }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    
    // Determinar o Content-Type com base na extensão
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".txt") contentType = "text/plain";
    else if (ext === ".doc") contentType = "application/msword";
    else if (ext === ".docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(arquivo.NOME)}"`,
      },
    });
  } catch (error: any) {
    console.error("API Error (File GET):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
      const fullPath = getPhysicalFilePath(arquivo.PATH);
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
