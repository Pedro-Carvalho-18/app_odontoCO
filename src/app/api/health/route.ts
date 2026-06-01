import { getDb } from "@/lib/db/sqlite";
import { runMigrations } from "@/lib/db/migrations";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Executa as migrações logo que o sistema inicia (ou quando esta rota é chamada)
    await runMigrations();
    
    const db = await getDb();
    
    // Pega informações básicas para mostrar no suporte
    const dbVersion = await db.get("SELECT versao FROM _SISTEMA_MIGRACOES ORDER BY id DESC LIMIT 1");
    
    // Pega a data do último backup
    const lastBackup = await db.get("SELECT timestamp FROM _SISTEMA_LOGS WHERE mensagem LIKE '%Backup%' ORDER BY id DESC LIMIT 1");

    return NextResponse.json({
      status: "online",
      version: "1.0.1",
      dbVersion: dbVersion?.versao || "1.0.0",
      lastBackup: lastBackup?.timestamp || null,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Health Check Error:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
