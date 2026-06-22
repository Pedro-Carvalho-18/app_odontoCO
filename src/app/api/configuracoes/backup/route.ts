import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), "database", "app_odonto.sqlite");
    
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: "Banco de dados não encontrado" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(dbPath);
    
    // Registrar o backup no banco de dados para histórico
    try {
      const db = await getDb();
      await db.run(
        "INSERT INTO _SISTEMA_LOGS (nivel, mensagem, contexto, timestamp) VALUES (?, ?, ?, ?)",
        ["INFO", "Backup do banco de dados realizado pelo usuário", "SISTEMA", new Date().toISOString()]
      );
    } catch (logError) {
      console.error("Erro ao registrar log de backup:", logError);
      // Não trava o download se o log falhar
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": `attachment; filename="backup_odonto_${new Date().toISOString().split('T')[0]}.sqlite"`,
      },
    });
  } catch (error: any) {
    console.error("Backup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
