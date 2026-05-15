import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const singleDate = searchParams.get("date");
    const db = await getDb();

    let agendaParams = [];
    let intervParams = [];
    let agendaWhere = "";
    let intervWhere = "";

    if (startDate && endDate) {
      agendaWhere = `DATE(A.DATA) BETWEEN DATE(?) AND DATE(?)`;
      intervWhere = `DATE(I.DATCAD) BETWEEN DATE(?) AND DATE(?)`;
      agendaParams = [startDate, endDate];
      intervParams = [startDate, endDate];
    } else {
      const date = singleDate || new Date().toISOString().split('T')[0];
      agendaWhere = `DATE(A.DATA) = DATE(?)`;
      intervWhere = `DATE(I.DATCAD) = DATE(?)`;
      agendaParams = [date];
      intervParams = [date];
    }

    // 1. Buscar agendamentos da tabela AGENDA
    const appointments = await db.all(
      `SELECT 
        A.ID_AGENDA_ITEM as id,
        A.DATA as date,
        A.HORAINICIO as startTime,
        A.HORAFIM as endTime,
        A.NROPAC as patientId,
        A.NOME as patientName,
        A.MOTIVO as type,
        A.STATUS as statusId,
        S.NOME as statusName,
        P.NOME as professionalName,
        A.ID_PRESTADOR as professionalId,
        A.OBSERV as notes,
        'appointment' as source
      FROM AGENDA A
      LEFT JOIN __STATUS_AGENDA S ON A.STATUS = S.CODIGO
      LEFT JOIN PRESTADOR P ON A.ID_PRESTADOR = P.ID_PRESTADOR
      WHERE ${agendaWhere}
      ORDER BY A.DATA ASC, A.HORAINICIO ASC`,
      agendaParams
    );

    // 2. Buscar lançamentos da tabela INTERVENCAO (Procedimentos)
    // Vamos tentar extrair o horário do campo OBSERV se existir
    const interventions = await db.all(
      `SELECT 
        I.NROINTPAC as id,
        I.DATCAD as date,
        CASE 
          WHEN I.OBSERV LIKE '%:%' THEN 
            TRIM(SUBSTR(I.OBSERV, INSTR(I.OBSERV, ':') - 2, 5))
          ELSE '08:00' 
        END as startTime,
        CASE 
          WHEN I.OBSERV LIKE '%:%' THEN 
            TRIM(SUBSTR(I.OBSERV, INSTR(I.OBSERV, ':') - 2, 5))
          ELSE '08:30' 
        END as endTime,
        I.NROPAC as patientId,
        PA.PRINOM as patientName,
        COALESCE(PRC.DESCRICAO, T.NOME, 'Procedimento') as type,
        CASE WHEN I.STATUS = '2' THEN '05' ELSE '07' END as statusId,
        CASE WHEN I.STATUS = '2' THEN 'Concluído' ELSE 'Agendado' END as statusName,
        P.NOME as professionalName,
        I.ID_PRESTADOR as professionalId,
        I.OBSERV as notes,
        'intervention' as source
      FROM INTERVENCAO I
      LEFT JOIN PESSOAL PA ON I.NROPAC = PA.NROPAC
      LEFT JOIN TAB_GEN_ITEM T ON I.NROINT = T.ID_PRC_GEN
      LEFT JOIN TAB_PRC_ITEM PRC ON I.NROINT = PRC.ID_PRC_TAB AND I.NROTAB = PRC.NROTAB
      LEFT JOIN PRESTADOR P ON I.ID_PRESTADOR = P.ID_PRESTADOR
      WHERE ${intervWhere}
      ORDER BY I.DATCAD ASC`,
      intervParams
    );

    // Filtrar intervenções para garantir que o startTime extraído é válido (formato HH:mm)
    const validInterventions = interventions.filter(interv => {
      return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(interv.startTime);
    });

    // Combinar e ordenar por data/hora
    const allItems = [...appointments, ...validInterventions].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    return NextResponse.json(allItems);
  } catch (error: any) {
    console.error("API Error (Agenda GET):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();

    // Melhorar geração de ID: buscar o maior valor numérico real
    const lastIdRow = await db.get("SELECT MAX(CAST(ID_AGENDA_ITEM AS INTEGER)) as id FROM AGENDA");
    const nextId = (Number(lastIdRow?.id) || 0) + 1;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    await db.run(
      `INSERT INTO AGENDA (
        ID_AGENDA_ITEM, DATA, HORAINICIO, HORAFIM, NROPAC, NOME, MOTIVO, STATUS, ID_PRESTADOR, OBSERV, USER_STAMP_INS, TIME_STAMP_INS, ID_UNIDADE, TIPO
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextId.toString(),
        body.date,
        body.startTime,
        body.endTime || body.startTime,
        body.patientId || null,
        body.patientName,
        body.type || "Consulta",
        body.statusId || "1",
        body.professionalId || "1",
        body.notes || "",
        "SISTEMA",
        now,
        "1", // Unidade padrão
        "1"  // Tipo padrão
      ]
    );

    return NextResponse.json({ success: true, id: nextId });
  } catch (error: any) {
    console.error("API Error (Agenda POST):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();

    await db.run(
      `UPDATE AGENDA SET 
        STATUS = ?,
        HORAINICIO = ?,
        HORAFIM = ?,
        OBSERV = ?
      WHERE ID_AGENDA_ITEM = ?`,
      [body.statusId, body.startTime, body.endTime, body.notes, body.id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Agenda PUT):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const db = await getDb();

    await db.run("DELETE FROM AGENDA WHERE ID_AGENDA_ITEM = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Agenda DELETE):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
