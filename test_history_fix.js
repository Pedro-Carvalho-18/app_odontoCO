const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

async function testQuery() {
    try {
        const id = '2103'; // Sample ID
        const query = `SELECT 
        I.NROINTPAC as id,
        'intervention' as type,
        I.DATCAD as date,
        COALESCE(TRIM(T.NOME), TRIM(I.OBSERV), 'Procedimento não especificado') as procedure,
        CASE 
          WHEN I.STATUS = '1' THEN 'Em Aberto'
          WHEN I.STATUS = '2' THEN 'Concluído'
          WHEN I.STATUS = '3' THEN 'Cancelado'
          ELSE 'Em Aberto'
        END as status,
        COALESCE(TRIM(P.NOME), 'Profissional não identificado') as professional,
        I.ID_PRESTADOR as professionalId,
        I.NROINT as procedureId,
        CAST(IFNULL(I.VALOR_PACIENTE, 0) AS FLOAT) as value,
        TRIM(COALESCE(I.S_DENTES, '')) as tooth,
        TRIM(COALESCE(D.BITMAP, '')) as dentalStatus,
        F.NRODEN as internalToothId,
        F.FACE1, F.FACE2, F.FACE3, F.FACE4, F.FACE5,
        I.NROINTPAC as nroIntPac,
        I.NROTRA as nroTra,
        I.OBSERV as notes,
        COALESCE(TRIM(C.NOME), 'Particular') as convenio,
        TR.STATTRA as treatmentStatus,
        (SELECT COUNT(DISTINCT CC.NROPAR) FROM CCPACIENTE CC WHERE CC.NROTRA = I.NROTRA AND CAST(CC.NROPAR AS INTEGER) > 0) as paidInstallments,
        (SELECT MAX(CAST(CC.NROPAR AS INTEGER)) FROM CCPACIENTE CC WHERE CC.NROTRA = I.NROTRA) as totalInstallments,
        (SELECT GROUP_CONCAT(DISTINCT TP.NOME) FROM CCPACIENTE CC JOIN __TIPO_PAGTO TP ON CC.TIPO_PAGTO = TP.CODIGO WHERE CC.NROTRA = I.NROTRA) as paymentMethod,
        (
          SELECT GROUP_CONCAT(TRIM(H2.DESCRICAO), ' | ') 
          FROM HISTORICO H2 
          WHERE 
            (H2.NROINTPAC = I.NROINTPAC OR (H2.NROPAC = I.NROPAC AND DATE(H2.DATA) = DATE(I.DATCAD)))
            AND H2.DESCRICAO LIKE '%Receitado%'
        ) as prescriptions
      FROM INTERVENCAO I
      LEFT JOIN TRATAMENTO TR ON I.NROTRA = TR.NROTRA
      LEFT JOIN TAB_GEN_ITEM T ON I.NROINT = T.ID_PRC_GEN
      LEFT JOIN PRESTADOR P ON I.ID_PRESTADOR = P.ID_PRESTADOR
      LEFT JOIN CONVENIO C ON TR.ID_CONVENIO = C.NROCONV
      LEFT JOIN DENTE D ON I.NROPAC = D.NROPAC AND I.NROINTPAC = D.NROINTPAC
      LEFT JOIN FACE F ON I.NROPAC = F.NROPAC AND I.NROINTPAC = F.NROINTPAC
      WHERE I.NROPAC = ?
      ORDER BY I.DATCAD DESC`;

        db.all(query, [id], (err, rows) => {
            if (err) {
                console.error("Query Error:", err);
            } else {
                console.log("Success! Found", rows.length, "interventions.");
                if (rows.length > 0) console.log("Sample:", JSON.stringify(rows[0], null, 2));
            }
            db.close();
        });
    } catch (error) {
        console.error("Unexpected Error:", error);
    }
}

testQuery();
