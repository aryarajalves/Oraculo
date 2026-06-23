# Log de Alterações no Banco de Dados (DATABASE_SCHEMA_LOG.md)

Este documento registra a evolução do esquema de banco de dados do projeto, garantindo a rastreabilidade e a reprodutibilidade das alterações em produção.

---

## [2026-06-23] Migração de JSON para PostgreSQL

### Motivação
Substituição da persistência local baseada em arquivos JSON (`carousels.json` e `reels_history.json`) pelo banco de dados PostgreSQL com `pgvector` oficial para melhorar a confiabilidade, integridade relacional e escalabilidade dos dados.

### Tabelas Criadas
1. **`carousels`**
   - Estrutura para armazenar metadados dos carrosséis gerados.
   - Colunas:
     - `id` VARCHAR(100) PRIMARY KEY
     - `title` TEXT NOT NULL
     - `theme` VARCHAR(255)
     - `praca` VARCHAR(100)
     - `format` VARCHAR(50)
     - `preset` VARCHAR(100)
     - `status` VARCHAR(100)
     - `created_at` VARCHAR(50)
     - `slides_dir` TEXT
     - `slide_prefix` VARCHAR(100)
     - `total_slides` INTEGER
     - `caption` TEXT
     - `notes` TEXT
     - `slides` JSONB (para manter a flexibilidade de nomes das imagens)

2. **`reels_history`**
   - Estrutura para histórico de análises de Reels.
   - Colunas:
     - `id` SERIAL PRIMARY KEY
     - `gancho_original` TEXT
     - `padrao_psicologico` TEXT
     - `roteiro_fonte_oculta` TEXT
     - `transcricao_original` TEXT
     - `url` TEXT
     - `timestamp` VARCHAR(100)

### Scripts de Migração
- **Script de Execução e Carga Inicial:** `backend/dashboard/scripts/migrate.js`
  - *Função:* Faz backup dos JSONs legados na pasta `backup/json_db_backup`, valida/cria as tabelas PostgreSQL e realiza o insert dos dados sem duplicidades.

### Instruções para Deploy
1. Atualizar as dependências locais:
   ```bash
   npm install --prefix backend
   ```
2. Executar o script de migração:
   ```bash
   docker exec oraculo_backend node backend/dashboard/scripts/migrate.js
   ```
