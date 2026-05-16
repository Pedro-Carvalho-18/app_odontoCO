import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const db = await getDb();

    if (table === "medicamentos") {
      const data = await db.all("SELECT REGISTRO as id, NOME as name FROM DEF_ITEM ORDER BY NOME");
      return NextResponse.json(data);
    }

    if (table === "procedimentos") {
      const data = await db.all(`
        SELECT 
          T.ID_PRC_GEN as id, 
          T.NOME as name, 
          E.NOME as specialty 
        FROM TAB_GEN_ITEM T
        LEFT JOIN __ESPECIALIDADE E ON T.ID_ESPECIALIDADE = E.REGISTRO
        WHERE T.INATIVO = '0' OR T.INATIVO IS NULL
        ORDER BY T.NOME
      `);
      return NextResponse.json(data);
    }

    if (table === "dentistas") {
      const data = await db.all("SELECT ID_PRESTADOR as id, NOME as name, CRO_PF as cro FROM PRESTADOR ORDER BY NOME");
      return NextResponse.json(data);
    }

    if (table === "especialidades") {
      const data = await db.all("SELECT REGISTRO as id, NOME as name FROM __ESPECIALIDADE ORDER BY NOME");
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Tabela não suportada" }, { status: 400 });
  } catch (error: any) {
    console.error("API Error (DB Manager GET):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table, data } = body;
    const db = await getDb();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (table === "medicamentos") {
      const lastIdRow = await db.get("SELECT MAX(CAST(REGISTRO AS INTEGER)) as id FROM DEF_ITEM");
      const nextId = (Number(lastIdRow?.id) || 0) + 1;

      await db.run(
        "INSERT INTO DEF_ITEM (REGISTRO, NOME) VALUES (?, ?)",
        [nextId.toString(), data.name]
      );
      return NextResponse.json({ success: true, id: nextId });
    }

    if (table === "procedimentos") {
      const lastIdRow = await db.get("SELECT MAX(CAST(ID_PRC_GEN AS INTEGER)) as id FROM TAB_GEN_ITEM");
      const nextId = (Number(lastIdRow?.id) || 0) + 1;

      await db.run(
        "INSERT INTO TAB_GEN_ITEM (ID_PRC_GEN, NOME, ID_ESPECIALIDADE, INATIVO) VALUES (?, ?, ?, '0')",
        [nextId.toString(), data.name, data.specialtyId || "1"]
      );
      return NextResponse.json({ success: true, id: nextId });
    }

    if (table === "dentistas") {
      const lastIdRow = await db.get("SELECT MAX(CAST(ID_PRESTADOR AS INTEGER)) as id FROM PRESTADOR");
      const nextId = (Number(lastIdRow?.id) || 0) + 1;

      await db.run(
        "INSERT INTO PRESTADOR (ID_PRESTADOR, NOME, CRO_PF, INATIVO) VALUES (?, ?, ?, '0')",
        [nextId.toString(), data.name, data.cro || ""]
      );
      return NextResponse.json({ success: true, id: nextId });
    }

    return NextResponse.json({ error: "Tabela não suportada" }, { status: 400 });
  } catch (error: any) {
    console.error("API Error (DB Manager POST):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const id = searchParams.get("id");
    
    if (!table || !id) {
      return NextResponse.json({ error: "Parâmetros ausentes" }, { status: 400 });
    }

    const db = await getDb();

    if (table === "medicamentos") {
      await db.run("DELETE FROM DEF_ITEM WHERE REGISTRO = ?", [id]);
      return NextResponse.json({ success: true });
    }

    if (table === "procedimentos") {
      await db.run("DELETE FROM TAB_GEN_ITEM WHERE ID_PRC_GEN = ?", [id]);
      return NextResponse.json({ success: true });
    }

    if (table === "dentistas") {
      await db.run("DELETE FROM PRESTADOR WHERE ID_PRESTADOR = ?", [id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Tabela não suportada" }, { status: 400 });
  } catch (error: any) {
    console.error("API Error (DB Manager DELETE):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
