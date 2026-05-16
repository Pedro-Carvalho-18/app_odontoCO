import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), "database", "app_odonto.sqlite");
    
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: "Banco de dados não encontrado" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(dbPath);
    
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
