import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const db = await getDb();

    if (table === "medicamentos") {
      const data = await db.all(`
        SELECT 
          REGISTRO as id, 
          NOME as name,
          QTDADULTO as quantityAdult,
          POSADULTO as posologyAdult,
          QTDCRIANCA as quantityChild,
          POSCRIANCA as posologyChild,
          USO as usage
        FROM DEF_ITEM 
        ORDER BY NOME
      `);
      return NextResponse.json(data);
    }

    if (table === "procedimentos") {
      const data = await db.all(`
        SELECT 
          T.ID_PRC_GEN as id, 
          T.NOME as name, 
          T.ID_ESPECIALIDADE as specialtyId,
          E.NOME as specialty,
          CAST(IFNULL(P.VALOR_PACIENTE, 0) AS FLOAT) as price
        FROM TAB_GEN_ITEM T
        LEFT JOIN __ESPECIALIDADE E ON T.ID_ESPECIALIDADE = E.REGISTRO
        LEFT JOIN (
          SELECT ID_PRC_GEN, MAX(VALOR_PACIENTE) as VALOR_PACIENTE 
          FROM TAB_PRC_ITEM 
          WHERE INATIVO = '0' OR INATIVO IS NULL 
          GROUP BY ID_PRC_GEN
        ) P ON T.ID_PRC_GEN = P.ID_PRC_GEN
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

    if (table === "medicamentos") {
      const lastIdRow = await db.get("SELECT MAX(CAST(REGISTRO AS INTEGER)) as id FROM DEF_ITEM");
      const nextId = (Number(lastIdRow?.id) || 0) + 1;

      await db.run(
        "INSERT INTO DEF_ITEM (REGISTRO, NOME, QTDADULTO, POSADULTO, QTDCRIANCA, POSCRIANCA, USO) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [nextId.toString(), data.name, data.quantityAdult || "", data.posologyAdult || "", data.quantityChild || "", data.posologyChild || "", data.usage || ""]
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

      // Também inserir preço na TAB_PRC_ITEM
      await db.run(
        "INSERT INTO TAB_PRC_ITEM (ID_PRC_GEN, VALOR_PACIENTE, INATIVO) VALUES (?, ?, '0')",
        [nextId.toString(), data.price || 0]
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { table, id, data } = body;
    const db = await getDb();

    if (table === "medicamentos") {
      await db.run(
        "UPDATE DEF_ITEM SET NOME = ?, QTDADULTO = ?, POSADULTO = ?, QTDCRIANCA = ?, POSCRIANCA = ?, USO = ? WHERE REGISTRO = ?",
        [data.name, data.quantityAdult || "", data.posologyAdult || "", data.quantityChild || "", data.posologyChild || "", data.usage || "", id]
      );
      return NextResponse.json({ success: true });
    }

    if (table === "procedimentos") {
      await db.run(
        "UPDATE TAB_GEN_ITEM SET NOME = ?, ID_ESPECIALIDADE = ? WHERE ID_PRC_GEN = ?",
        [data.name, data.specialtyId, id]
      );

      // Atualizar ou inserir preço
      const priceExists = await db.get("SELECT 1 FROM TAB_PRC_ITEM WHERE ID_PRC_GEN = ?", [id]);
      if (priceExists) {
        await db.run(
          "UPDATE TAB_PRC_ITEM SET VALOR_PACIENTE = ? WHERE ID_PRC_GEN = ?",
          [data.price || 0, id]
        );
      } else {
        await db.run(
          "INSERT INTO TAB_PRC_ITEM (ID_PRC_GEN, VALOR_PACIENTE, INATIVO) VALUES (?, ?, '0')",
          [id, data.price || 0]
        );
      }

      return NextResponse.json({ success: true });
    }

    if (table === "dentistas") {
      await db.run(
        "UPDATE PRESTADOR SET NOME = ?, CRO_PF = ? WHERE ID_PRESTADOR = ?",
        [data.name, data.cro, id]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Tabela não suportada" }, { status: 400 });
  } catch (error: any) {
    console.error("API Error (DB Manager PUT):", error);
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
      // Marcar como inativo em vez de deletar para manter integridade do histórico
      await db.run("UPDATE TAB_GEN_ITEM SET INATIVO = '1' WHERE ID_PRC_GEN = ?", [id]);
      await db.run("UPDATE TAB_PRC_ITEM SET INATIVO = '1' WHERE ID_PRC_GEN = ?", [id]);
      return NextResponse.json({ success: true });
    }

    if (table === "dentistas") {
      await db.run("UPDATE PRESTADOR SET INATIVO = 'S' WHERE ID_PRESTADOR = ?", [id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Tabela não suportada" }, { status: 400 });
  } catch (error: any) {
    console.error("API Error (DB Manager DELETE):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
