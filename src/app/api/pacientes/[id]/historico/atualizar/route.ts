import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const body = await request.json();
    const { id, type, procedure, professionalId, value, status, notes, nroTra, paidInstallments, paidValue } = body;

    const db = await getDb();

    if (type === 'intervention') {
      const totalInst = Number(body.totalInstallments || body.installments || 1);
      let finalPaidInst = paidInstallments !== undefined ? Number(paidInstallments) : undefined;
      let finalStatus = status;

      if (paidValue !== undefined) {
        finalPaidInst = Math.min(totalInst, Math.max(0, Math.round((Number(paidValue) / (Number(value) || 1)) * totalInst)));
      }

      // Synchronization logic:
      // 1. If status is Concluído, ensure all installments are marked as paid
      if (finalStatus === 'Concluído' && (finalPaidInst === undefined || finalPaidInst < totalInst)) {
        finalPaidInst = totalInst;
      }
      
      // 2. If all installments are paid, ensure status is Concluído
      if (finalPaidInst !== undefined && finalPaidInst >= totalInst) {
        finalStatus = 'Concluído';
        finalPaidInst = totalInst; // Cap it
      }

      const statusValue = finalStatus === 'Concluído' ? '2' : finalStatus === 'Cancelado' ? '3' : '1';

      // Ler estado atual para saber se parcelas foram adicionadas
      const current = await db.get(`SELECT ORCAMENTO, NROTRA FROM INTERVENCAO WHERE NROINTPAC = ? AND NROPAC = ?`, [id, patientId]);
      const oldPaidInst = parseInt(current?.ORCAMENTO || '0') || 0;
      const interTraId = current?.NROTRA || nroTra || '1';

      await db.run(
        `UPDATE INTERVENCAO 
         SET ID_PRESTADOR = ?, 
             VALOR_PACIENTE = ?, 
             STATUS = ?,
             ORCAMENTO = ?
         WHERE NROPAC = ? AND NROINTPAC = ?`,
        [professionalId, value, statusValue, finalPaidInst !== undefined ? String(finalPaidInst) : null, patientId, id]
      );


      // Sync/update debt records in CCPACIENTE to match the new value
      if (interTraId && value !== undefined) {
        const valPerInst = (Number(value) || 0) / totalInst;
        const existingCharges = await db.all(
          `SELECT REGISTRO FROM CCPACIENTE WHERE NROPAC = ? AND NROTRA = ? AND NROLAN IN ('4', '5')`,
          [patientId, interTraId.toString()]
        );

        if (existingCharges.length > 0) {
          await db.run(
            `UPDATE CCPACIENTE 
             SET VALOR = ? 
             WHERE NROPAC = ? AND NROTRA = ? AND NROLAN IN ('4', '5')`,
            [valPerInst.toFixed(2), patientId, interTraId.toString()]
          );
        } else if (Number(value) > 0 && !procedure?.includes("Alteração Odontograma")) {
          const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + '.000';
          const today = new Date().toISOString().split('T')[0] + " 00:00:00.000";
          let procName = "Procedimento";
          if (procedure) {
            procName = procedure.split("|")[0].replace("PROCEDIMENTO:", "").trim();
          }
          for (let i = 1; i <= totalInst; i++) {
            const lastCcRow = await db.get("SELECT MAX(CAST(REGISTRO AS INTEGER)) as id FROM CCPACIENTE");
            const nextCcId = (Number(lastCcRow?.id) || 0) + 1;
            await db.run(
              `INSERT INTO CCPACIENTE (
                REGISTRO, NROPAC, DATA, HISTORICO, NROLAN, NROIND, VALOR, 
                USER_STAMP_INS, TIME_STAMP_INS, DATA_LANCAMENTO, NROTRA, NROPAR
              ) VALUES (?, ?, ?, ?, '4', '255', ?, 'SISTEMA', ?, ?, ?, ?)`,
              [
                nextCcId.toString(),
                patientId,
                today,
                `${procName} (Parc ${i}/${totalInst})`,
                valPerInst.toFixed(2),
                now,
                today,
                interTraId.toString(),
                i.toString()
              ]
            );
          }
        }
      }

      // Gerar registro financeiro na conta do paciente (CCPACIENTE)
      if (Number(value) > 0 && !procedure?.includes("Alteração Odontograma")) {
        const valPerInst = (Number(value) || 0) / totalInst;
        
        let procName = 'Procedimento';
        if (procedure) {
          procName = procedure.split('|')[0].replace('PROCEDIMENTO:', '').trim();
        } else {
          const row = await db.get("SELECT OBSERV FROM INTERVENCAO WHERE NROINTPAC = ?", [id]);
          if (row?.OBSERV) {
            procName = row.OBSERV.split('|')[0].replace('PROCEDIMENTO:', '').trim();
          }
        }

        if (paidValue !== undefined) {
          // 1. Caso o valor pago seja enviado diretamente
          console.log(`[FINANCE] Updating paid value for patient ${patientId} to R$ ${paidValue}`);
          
          // Deletar pagamentos existentes de tipo '6' para esse tratamento
          await db.run(
            `DELETE FROM CCPACIENTE WHERE NROPAC = ? AND NROTRA = ? AND NROLAN = '6'`,
            [patientId, interTraId.toString()]
          );
          
          if (Number(paidValue) > 0) {
            const lastIdRow = await db.get("SELECT MAX(CAST(REGISTRO AS INTEGER)) as id FROM CCPACIENTE");
            const nextId = (Number(lastIdRow?.id) || 0) + 1;
            const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + '.000';
            const today = new Date().toISOString().split('T')[0] + " 00:00:00.000";
            
            await db.run(
              `INSERT INTO CCPACIENTE (
                REGISTRO, NROPAC, DATA, HISTORICO, NROLAN, NROIND, VALOR, 
                TIPO_PAGTO, USER_STAMP_INS, TIME_STAMP_INS, DATA_LANCAMENTO, NROTRA, NROPAR
              ) VALUES (?, ?, ?, ?, '6', '255', ?, '1', '1', ?, ?, ?, ?)`,
              [
                nextId.toString(),
                patientId,
                today,
                `Pg ${procName} (Valor Pago)`,
                Number(paidValue).toFixed(2),
                now,
                today,
                interTraId.toString(),
                '1'
              ]
            );
          }
        } else if (finalPaidInst !== undefined && finalPaidInst !== oldPaidInst) {
          // 2. Caso as parcelas pagas sejam atualizadas
          console.log(`[FINANCE] Syncing installments for patient ${patientId}: from ${oldPaidInst} to ${finalPaidInst}`);
          
          if (finalPaidInst > oldPaidInst) {
            // Adicionar novas parcelas
            const diff = finalPaidInst - oldPaidInst;
            for (let i = 1; i <= diff; i++) {
              const currentInstallmentNumber = oldPaidInst + i;
              const lastIdRow = await db.get("SELECT MAX(CAST(REGISTRO AS INTEGER)) as id FROM CCPACIENTE");
              const nextId = (Number(lastIdRow?.id) || 0) + 1;
              const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + '.000';
              const today = new Date().toISOString().split('T')[0] + " 00:00:00.000";
              
              await db.run(
                `INSERT INTO CCPACIENTE (
                  REGISTRO, NROPAC, DATA, HISTORICO, NROLAN, NROIND, VALOR, 
                  TIPO_PAGTO, USER_STAMP_INS, TIME_STAMP_INS, DATA_LANCAMENTO, NROTRA, NROPAR
                ) VALUES (?, ?, ?, ?, '6', '255', ?, '1', '1', ?, ?, ?, ?)`,
                [
                  nextId.toString(),
                  patientId,
                  today,
                  `Pg ${procName} (Parc ${currentInstallmentNumber}/${totalInst})`,
                  valPerInst.toFixed(2),
                  now,
                  today,
                  interTraId.toString(),
                  currentInstallmentNumber.toString()
                ]
              );
            }
          } else {
            // Remover parcelas extras
            await db.run(
              `DELETE FROM CCPACIENTE WHERE NROPAC = ? AND NROTRA = ? AND NROLAN = '6' AND CAST(NROPAR AS INTEGER) > ?`,
              [patientId, interTraId.toString(), finalPaidInst]
            );
          }
        }
      }

      // No nosso sistema, o controle de parcelas pagas e status do orçamento 
      // para o financeiro pode estar vindo do STATTRA no TRATAMENTO ou campos extras.
      // Vamos garantir que se houver um nroTra, atualizamos o status do tratamento.
      if (nroTra) {
        await db.run(
          `UPDATE TRATAMENTO SET STATTRA = ? WHERE NROTRA = ?`,
          [statusValue, nroTra]
        );
      }
    }
 else if (type === 'history') {
      await db.run(
        `UPDATE HISTORICO 
         SET DESCRICAO = ?, 
             ID_PRESTADOR = ? 
         WHERE NROPAC = ? AND REGISTRO = ?`,
        [procedure, professionalId, patientId, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Update Procedure):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
