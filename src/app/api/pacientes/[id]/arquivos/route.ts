import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    const arquivos = await db.all(
      `SELECT * FROM ARQUIVO_PACIENTE WHERE NROPAC = ? ORDER BY DATA_UPLOAD DESC`,
      [id]
    );

    return NextResponse.json(arquivos);
  } catch (error: any) {
    console.error("API Error (Files GET):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: nropac } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const nroIntPac = formData.get("nroIntPac") || null;
    const nroTra = formData.get("nroTra") || null;
    const tipo = formData.get("tipo") || "outros";
    const observacao = formData.get("observacao") || "";

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "pacientes", nropac);
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadDir, fileName);
    const relativePath = `/uploads/pacientes/${nropac}/${fileName}`;

    await writeFile(filePath, buffer);

    const db = await getDb();
    const result = await db.run(
      `INSERT INTO ARQUIVO_PACIENTE (NROPAC, NROINTPAC, NROTRA, NOME, TIPO, PATH, DATA_UPLOAD, OBSERVACAO)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nropac, nroIntPac, nroTra, file.name, tipo, relativePath, new Date().toISOString(), observacao]
    );

    return NextResponse.json({ 
      id: result.lastID,
      nome: file.name,
      path: relativePath
    });
  } catch (error: any) {
    console.error("API Error (Files POST):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
