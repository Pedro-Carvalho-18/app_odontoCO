import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Validar se é um arquivo .sqlite
    if (!file.name.endsWith(".sqlite")) {
      return NextResponse.json({ error: "O arquivo deve ter a extensão .sqlite" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), "database", "app_odonto.sqlite");
    const dbDir = path.dirname(dbPath);
    const backupPath = path.join(dbDir, `app_odonto_old_${Date.now()}.sqlite`);

    // Fazer um backup do atual antes de sobrescrever, por segurança
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
    }

    // Sobrescrever o banco de dados
    fs.writeFileSync(dbPath, buffer);

    return NextResponse.json({ success: true, message: "Banco de dados importado com sucesso!" });
  } catch (error: any) {
    console.error("Import Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
