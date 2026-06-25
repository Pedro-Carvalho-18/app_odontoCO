import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    // 1. Obter todos os NROTRA do paciente
    const interventions = await db.all(
      "SELECT DISTINCT NROTRA FROM INTERVENCAO WHERE NROPAC = ? AND NROTRA IS NOT NULL",
      [id]
    );
    const nroTras = interventions.map((item) => item.NROTRA);

    // 2. Deletar comissões em CCCIRURGIAO relacionadas a contas de CCPACIENTE
    await db.run(
      "DELETE FROM CCCIRURGIAO WHERE NROCCPAC IN (SELECT REGISTRO FROM CCPACIENTE WHERE NROPAC = ?)",
      [id]
    );

    // 3. Se houver NROTRAs, deletar registros relacionados a eles
    if (nroTras.length > 0) {
      const placeholders = nroTras.map(() => "?").join(",");
      await db.run(
        `DELETE FROM TRATAMENTO_COMISSAO WHERE NROTRA IN (${placeholders})`,
        nroTras
      );
      await db.run(
        `DELETE FROM PARCELA WHERE NROTRA IN (${placeholders})`,
        nroTras
      );
      await db.run(
        `DELETE FROM TRATAMENTO WHERE NROTRA IN (${placeholders})`,
        nroTras
      );
    }

    // 4. Deletar contas de CCPACIENTE
    await db.run("DELETE FROM CCPACIENTE WHERE NROPAC = ?", [id]);

    // 5. Deletar dentes e faces
    await db.run("DELETE FROM DENTE WHERE NROPAC = ?", [id]);
    await db.run("DELETE FROM FACE WHERE NROPAC = ?", [id]);

    // 6. Deletar intervenções
    await db.run("DELETE FROM INTERVENCAO WHERE NROPAC = ?", [id]);

    // 7. Deletar histórico do paciente
    await db.run("DELETE FROM HISTORICO WHERE NROPAC = ?", [id]);

    // 8. Deletar arquivos anexados
    await db.run("DELETE FROM ARQUIVO_PACIENTE WHERE NROPAC = ?", [id]);

    // 9. Deletar anamnese (respostas e itens)
    await db.run(
      "DELETE FROM ANAMNESE_RSP_ITEM WHERE ID_RSP IN (SELECT ID_RSP FROM ANAMNESE_RSP WHERE ID_PESSOA = ?)",
      [id]
    );
    await db.run("DELETE FROM ANAMNESE_RSP WHERE ID_PESSOA = ?", [id]);

    // 10. Finalmente, deletar o paciente da tabela PESSOAL
    await db.run("DELETE FROM PESSOAL WHERE NROPAC = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Delete Patient):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
