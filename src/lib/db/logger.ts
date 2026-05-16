import { getDb } from "./sqlite";

export async function logSystem(nivel: 'INFO' | 'ERRO' | 'ALERTA', mensagem: string, contexto?: any) {
  try {
    const db = await getDb();
    const contextoStr = contexto ? JSON.stringify(contexto) : null;
    
    await db.run(
      "INSERT INTO _SISTEMA_LOGS (nivel, mensagem, contexto) VALUES (?, ?, ?)",
      [nivel, mensagem, contextoStr]
    );
  } catch (err) {
    // Fallback para o console se o banco falhar
    console.error("Logger Error:", err);
    console.log(`[${nivel}] ${mensagem}`);
  }
}
