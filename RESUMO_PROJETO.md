# 🦷 OdontoOC Enterprise - Resumo do Projeto

Este documento resume as implementações e a estrutura atual do sistema de gestão odontológica desenvolvido. O foco principal foi a transformação de um protótipo estático em uma aplicação **data-driven**, totalmente integrada a um banco de dados SQLite real.

---

## 🚀 Funcionalidades Implementadas

### 1. Gestão de Pacientes (Real-Time)
- **Integração com Tabela `PESSOAL`:** O sistema agora lista e busca todos os 2.136 pacientes reais do banco.
- **Busca Avançada:** Pesquisa instantânea por Nome, CPF ou E-mail.
- **Prontuário Digital:** Ficha detalhada do paciente com endereços, documentos e histórico clínico real.
- **Correção de Nomes:** Ajuste inteligente para evitar duplicidade de sobrenomes vindos do banco original.

### 2. Odontograma & Linha do Tempo
- **Histórico Clínico Fiel:** Consolidação de dados das tabelas `HISTORICO` (anotações) e `INTERVENCAO` (procedimentos técnicos).
- **Tradução de Catálogo:** IDs internos são convertidos automaticamente em nomes de procedimentos reais (ex: "Exodontia", "Profilaxia").
- **Vinculação de Dentistas:** Exibição do nome real do profissional que realizou cada atendimento (Tabela `PRESTADOR`).
- **Mapeamento por Dente:** Identificação precisa do dente tratado em cada registro da linha do tempo.

### 3. Lançamento de Procedimentos (Automático)
- **Catálogo Dinâmico:** Menu de serviços organizado por especialidades reais do banco.
- **Sugestão de Preços:** O sistema consulta a tabela `TAB_PRC_ITEM` e sugere o valor do tratamento automaticamente ao selecionar o serviço.
- **Formas de Pagamento:** Integração com a tabela oficial de pagamentos (incluindo inserção permanente do **Pix**).

### 4. Gestão Financeira
- **Formatação de Moeda:** Padronização rigorosa para o formato brasileiro (`R$ 0,00`) com 2 casas decimais em todo o sistema.
- **Parsing de Dados:** Lógica avançada para tratar valores numéricos armazenados com 4 casas decimais no SQLite original.

---

## 📂 Organização do Projeto

O projeto foi reestruturado para seguir padrões profissionais de desenvolvimento:

- **`/database`**: Pasta centralizada para dados.
  - `app_odonto.sqlite`: O banco de dados ativo que alimenta o sistema.
  - `/source_files`: Armazena os arquivos originais (.mdf, .sql, .bak) para segurança e futuras migrações.
- **`/src/app/api`**: Camada de backend em Next.js que faz a ponte segura entre o frontend e o SQLite.
- **`/public/icones`**: Centralização de ativos visuais (como o ícone do Pix).

---

## 🛠️ Tecnologias Utilizadas
- **Frontend:** Next.js 16 (Turbopack), React 19, Tailwind CSS.
- **Backend:** Next.js Route Handlers (API).
- **Banco de Dados:** SQLite 3.
- **Icons:** Lucide React & Ícones customizados.

---

## 📌 Status do Sistema
- **Servidor:** Online (`npm run dev`)
- **Base de Dados:** Conectada e Sincronizada.
- **Próximos Passos Sugeridos:** Finalização do módulo de Agenda dinâmica e Dashboard de faturamento mensal.

---
*Documento gerado em 13 de maio de 2026.*
