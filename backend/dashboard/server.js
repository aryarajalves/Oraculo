// dashboard/server.js — Fonte Oculta Content Dashboard MVP
import express from "express";
import cookieSession from "cookie-session";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";
import { initDb } from "./db.js";

// Import modules
import { 
  IS_PROD, 
  PUBLIC_DIR, 
  sseClients, 
  requireAuth 
} from "./state.js";

import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import carouselsRouter from "./routes/carousels.js";
import servicesRouter from "./routes/services.js";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load .env from project root ──────────────────────────────────────────────
(function loadEnv() {
  try {
    let envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      envPath = path.join(__dirname, '..', '..', '.env');
    }
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (k && !process.env[k]) process.env[k] = v;
    }
  } catch {}
})();

const app = express();
const PORT = process.env.PORT || 3131;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Necessário para cookies funcionarem atrás do proxy do Render/Heroku
app.set('trust proxy', 1);

// ── Sessão (cookie-session) ──────────────────────────────────────────────────
app.use(cookieSession({
  name:   'fo_sess',
  keys:   [process.env.SESSION_SECRET || 'fonte-oculta-secret-change-in-prod'],
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 dias
}));

// Apply global authentication check
app.use(requireAuth);

// ── Register Routers ─────────────────────────────────────────────────────────
app.use(authRouter);
app.use(usersRouter);
app.use(carouselsRouter);
app.use(servicesRouter);

app.use(express.static(PUBLIC_DIR));

// ── Global SSE ─────────────────────────────────────────────────────────────────
app.get("/api/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  sseClients.add(sendEvent);
  req.on("close", () => sseClients.delete(sendEvent));
});

app.post("/api/events/broadcast", (req, res) => {
  sseClients.forEach(send => send(req.body));
  res.json({ ok: true });
});

// ── Cron Job: Publicador Automático ──────────────────────────────────────────
setInterval(async () => {
  try {
    const PUB_SCRIPT = path.join(__dirname, "..", "publisher.py");
    const { stdout } = await execFileAsync("python", ["-X", "utf8", PUB_SCRIPT]);
    if (stdout && stdout.includes("Post:")) {
      console.log("\n[CRON] Publicador executou:\n" + stdout);
    }
  } catch (e) {
    if (e.stdout && e.stdout.includes("Post:")) {
       console.log("\n[CRON] Publicador executou (mas retornou erro):\n" + e.stdout);
    }
  }
}, 60000); // Roda a cada 60 segundos

// ── Start ────────────────────────────────────────────────────────────────────
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\nFonte Oculta Dashboard rodando em: http://localhost:${PORT}\n`);
  });
}).catch(err => {
  console.error("❌ Falha crítica ao inicializar banco de dados:", err);
  process.exit(1);
});
