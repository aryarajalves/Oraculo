import pg from 'pg';
const { Pool } = pg;

// Configuração do pool de conexões do PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'oracle_manager',
});

// Helper para executar queries
export const query = (text, params) => pool.query(text, params);

// Inicialização automática das tabelas (Schema definition)
export async function initDb() {
  console.log('🔄 Inicializando banco de dados PostgreSQL...');

  const createCarouselsTable = `
    CREATE TABLE IF NOT EXISTS carousels (
      id VARCHAR(100) PRIMARY KEY,
      title TEXT NOT NULL,
      theme VARCHAR(255),
      praca VARCHAR(100),
      format VARCHAR(50),
      preset VARCHAR(100),
      status VARCHAR(100),
      created_at VARCHAR(50),
      slides_dir TEXT,
      slide_prefix VARCHAR(100),
      total_slides INTEGER,
      caption TEXT,
      notes TEXT,
      slides JSONB
    );
  `;

  const createReelsHistoryTable = `
    CREATE TABLE IF NOT EXISTS reels_history (
      id SERIAL PRIMARY KEY,
      gancho_original TEXT,
      padrao_psicologico TEXT,
      roteiro_fonte_oculta TEXT,
      transcricao_original TEXT,
      url TEXT,
      timestamp VARCHAR(100)
    );
  `;

  try {
    await query(createCarouselsTable);
    await query(createReelsHistoryTable);
    console.log('✅ Tabelas carousels e reels_history validadas/criadas com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao inicializar tabelas do banco de dados:', err);
    throw err;
  }
}

export default pool;
