import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const { text } = await request.json();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `receita_${timestamp}.txt`;
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', patientId);
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, text);
    
    // Adicionar registro no banco de dados
    const db = await getDb();
    await db.run(
        `INSERT INTO ARQUIVO_PACIENTE (NROPAC, NOME, PATH, TIPO, DATA_UPLOAD) VALUES (?, ?, ?, ?, ?)`,
        [patientId, fileName, `/uploads/${patientId}/${fileName}`, 'documento', new Date().toISOString()]
    );
    await db.close();
    
    return NextResponse.json({ success: true, fileName });
  } catch (error: any) {
    console.error("API Error (Save Prescription):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
