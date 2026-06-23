// dashboard/server.js — Fonte Oculta Content Dashboard MVP
import express from "express";
import cookieSession from "cookie-session";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { query, initDb } from "./db.js";

const execFileAsync = promisify(execFile);

// ── Load .env from project root (sem dependência de dotenv) ──────────────────
(function loadEnv() {
  try {
    let envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
    if (!fs.existsSync(envPath)) {
      envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env');
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const IS_PROD = process.env.NODE_ENV === "production";

// ── B2 Storage (produção) ─────────────────────────────────────────────────────
let b2 = null;
if (IS_PROD) {
  b2 = await import("./b2.js");
  console.log("[B2] Modo produção ativado — usando Backblaze B2");
}

// ── Load client.json (narrative config) ──────────────────────────────────────
function loadClientConfig() {
  try {
    const p = path.join(__dirname, '..', 'client.json');
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}
const CLIENT = loadClientConfig();
const PORT = process.env.PORT || 3131;

const DATA_FILE      = path.join(__dirname, "data", "carousels.json");
const PUBLIC_DIR     = path.join(__dirname, "..", "..", "frontend");
const COMPOSE_SCRIPT = path.join(__dirname, "..", "core", "util", "compose-slide.py");
const REGEN_SCRIPT   = path.join(__dirname, "..", "regen-slide.py");
const REELS_HISTORY_FILE = path.join(__dirname, "data", "reels_history.json");
const ZIP_SCRIPT     = path.join(__dirname, "..", "zip-carousels.py");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Necessário para cookies funcionarem atrás do proxy do Render/Heroku
app.set('trust proxy', 1);

// ── Sessão (cookie-session — persiste entre restarts do Render) ───────────────
app.use(cookieSession({
  name:   'fo_sess',
  keys:   [process.env.SESSION_SECRET || 'fonte-oculta-secret-change-in-prod'],
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 dias
}));

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  // Rotas públicas: login page, auth endpoints, assets estáticos do login
  const publicPaths = ['/login.html', '/auth/login', '/auth/logout'];
  if (publicPaths.includes(req.path)) return next();
  if (req.session && req.session.authenticated) return next();
  // APIs retornam 401, rotas HTML redirecionam para login
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Não autenticado' });
  return res.redirect('/login.html');
}

app.use(requireAuth);

// ── Rotas de Auth ─────────────────────────────────────────────────────────────
const USERS = [
  { username: process.env.DASHBOARD_USER || 'jordao',        password: process.env.DASHBOARD_PASS || 'fonteoculta2024' },
  { username: 'afonteoculta@gmail.com',                      password: process.env.DASHBOARD_PASS2 || 'FonteOculta@2025' },
  { username: 'afonteoculta',                                password: process.env.DASHBOARD_PASS2 || 'FonteOculta@2025' },
];

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const matched = USERS.find(u => u.username === username && u.password === password);
  if (matched) {
    req.session.authenticated = true;
    req.session.user = matched.username;
    return res.redirect('/');
  }
  return res.redirect('/login.html?error=1');
});

app.get('/auth/logout', (req, res) => {
  req.session = null; // cookie-session: limpa setando null
  res.redirect('/login.html');
});

app.use(express.static(PUBLIC_DIR));

// ── Global SSE ─────────────────────────────────────────────────────────────────
const sseClients = new Set();
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

// ── Helpers ──────────────────────────────────────────────────────────────────
function mapCarouselFromDb(row) {
  return {
    id: row.id,
    title: row.title,
    theme: row.theme,
    praca: row.praca,
    format: row.format,
    preset: row.preset,
    status: row.status,
    createdAt: row.created_at,
    slidesDir: row.slides_dir,
    slidePrefix: row.slide_prefix,
    totalSlides: row.total_slides,
    caption: row.caption,
    notes: row.notes,
    slides: typeof row.slides === 'string' ? JSON.parse(row.slides) : (row.slides || [])
  };
}

async function readData() {
  try {
    const res = await query("SELECT * FROM carousels ORDER BY id ASC");
    return res.rows.map(mapCarouselFromDb);
  } catch (err) {
    console.error("Erro ao ler carrosséis do banco:", err);
    return [];
  }
}

async function writeData(data) {
  try {
    await query("BEGIN");
    const currentIds = data.map(c => c.id).filter(Boolean);
    if (currentIds.length > 0) {
      await query("DELETE FROM carousels WHERE id NOT IN (" + currentIds.map((_, i) => `$${i + 1}`).join(",") + ")", currentIds);
    } else {
      await query("DELETE FROM carousels");
    }

    for (const c of data) {
      const upsertQuery = `
        INSERT INTO carousels (
          id, title, theme, praca, format, preset, status, created_at,
          slides_dir, slide_prefix, total_slides, caption, notes, slides
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          theme = EXCLUDED.theme,
          praca = EXCLUDED.praca,
          format = EXCLUDED.format,
          preset = EXCLUDED.preset,
          status = EXCLUDED.status,
          created_at = EXCLUDED.created_at,
          slides_dir = EXCLUDED.slides_dir,
          slide_prefix = EXCLUDED.slide_prefix,
          total_slides = EXCLUDED.total_slides,
          caption = EXCLUDED.caption,
          notes = EXCLUDED.notes,
          slides = EXCLUDED.slides
      `;
      const params = [
        c.id,
        c.title || '',
        c.theme || '',
        c.praca || '',
        c.format || '',
        c.preset || '',
        c.status || '',
        c.createdAt || '',
        c.slidesDir || '',
        c.slidePrefix || '',
        c.totalSlides || 0,
        c.caption || '',
        c.notes || '',
        JSON.stringify(c.slides || [])
      ];
      await query(upsertQuery, params);
    }
    await query("COMMIT");
  } catch (err) {
    await query("ROLLBACK");
    console.error("Erro ao salvar carrosséis no banco:", err);
    throw err;
  }
}

async function readDataAsync() {
  if (IS_PROD && b2) return b2.readDataFromB2();
  return readData();
}

async function writeDataAsync(data) {
  if (IS_PROD && b2) {
    await b2.writeDataToB2(data);
    return;
  }
  await writeData(data);
}

function getLocalSlidesDir(c) {
  if (!c.slidesDir) return "";
  if (c.slidesDir.startsWith("b2://")) {
    return path.join("C:\\Users\\julia\\Desktop", `carrossel-${c.theme}`);
  }
  return c.slidesDir;
}

function getSlidesForCarousel(c) {
  if (IS_PROD && c.slides && c.slides.length > 0) return c.slides;
  return getSlidesFromDir(getLocalSlidesDir(c), c.slidePrefix).map(s => s.filename);
}

async function readReelsHistory() {
  try {
    const res = await query("SELECT * FROM reels_history ORDER BY id DESC");
    return res.rows;
  } catch (err) {
    console.error("Erro ao ler reels do banco:", err);
    return [];
  }
}

async function writeReelsHistory(data) {
  try {
    await query("BEGIN");
    await query("DELETE FROM reels_history");
    for (const r of data) {
      const insQuery = `
        INSERT INTO reels_history (
          gancho_original, padrao_psicologico, roteiro_fonte_oculta,
          transcricao_original, url, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;
      const params = [
        r.gancho_original || '',
        r.padrao_psicologico || '',
        r.roteiro_fonte_oculta || '',
        r.transcricao_original || '',
        r.url || '',
        r.timestamp || ''
      ];
      await query(insQuery, params);
    }
    await query("COMMIT");
  } catch (err) {
    await query("ROLLBACK");
    console.error("Erro ao salvar reels no banco:", err);
    throw err;
  }
}

function getSlidesFromDir(dir, prefix = "slide-") {
  try {
    const files = fs.readdirSync(dir);
    return files
      .filter(f => f.startsWith(prefix) && /\.(jpg|jpeg|png)$/i.test(f))
      .sort()
      .map(f => ({ filename: f, path: path.join(dir, f) }));
  } catch {
    return [];
  }
}

// ── API: List all carousels ──────────────────────────────────────────────────
app.get("/api/carousels", async (req, res) => {
  const all = await readDataAsync();
  const carousels = all.map(c => {
    const slides = getSlidesForCarousel(c);
    return { ...c, slidesFound: slides.length, slides };
  });
  res.json(carousels);
});

// ── API: Get single carousel ─────────────────────────────────────────────────
app.get("/api/carousels/:id", async (req, res) => {
  const all = await readDataAsync();
  const c = all.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Carrossel não encontrado" });
  const slides = getSlidesForCarousel(c);
  res.json({ ...c, slides });
});

// ── API: Create carousel ─────────────────────────────────────────────────────
app.post("/api/carousels", async (req, res) => {
  const all = await readData();
  const newCarousel = {
    id: `carrossel-${String(all.length + 1).padStart(2, "0")}`,
    title: req.body.title || "Sem título",
    theme: req.body.theme || "",
    format: req.body.format || "A",
    status: "rascunho",
    createdAt: new Date().toISOString().split("T")[0],
    slidesDir: req.body.slidesDir || "",
    slidePrefix: "slide-",
    totalSlides: 0,
    caption: req.body.caption || "",
    notes: req.body.notes || "",
  };
  all.push(newCarousel);
  await writeData(all);

  // Create folder if requested
  if (req.body.createFolder && req.body.slidesDir) {
    fs.mkdirSync(req.body.slidesDir, { recursive: true });
  }

  res.json(newCarousel);
});

// ── API: Update carousel status/fields ──────────────────────────────────────
app.put("/api/carousels/:id", async (req, res) => {
  const all = await readData();
  const idx = all.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Não encontrado" });
  all[idx] = { ...all[idx], ...req.body, id: all[idx].id };
  await writeData(all);
  res.json(all[idx]);
});

// ── API: Delete carousel ─────────────────────────────────────────────────────
app.delete("/api/carousels/:id", async (req, res) => {
  const all = await readData();
  const filtered = all.filter(x => x.id !== req.params.id);
  await writeData(filtered);
  res.json({ ok: true });
});

// ── API: Serve slide images ──────────────────────────────────────────────────
app.get("/api/carousels/:id/image/:filename", async (req, res) => {
  // Em produção: redireciona direto para URL pública do B2
  if (IS_PROD && b2) {
    const url = b2.b2ImageUrl(req.params.id, req.params.filename);
    return res.redirect(302, url);
  }
  // Local: serve do disco
  const all = await readData();
  const c = all.find(x => x.id === req.params.id);
  if (!c) return res.status(404).send("Carrossel não encontrado");
  const imgPath = path.join(getLocalSlidesDir(c), req.params.filename);
  if (!fs.existsSync(imgPath)) return res.status(404).send("Imagem não encontrada");
  res.sendFile(imgPath);
});

// ── API: Download single slide (with Content-Disposition: attachment) ────────
app.get("/api/carousels/:id/download/:filename", async (req, res) => {
  if (IS_PROD && b2) {
    const url = b2.b2ImageUrl(req.params.id, req.params.filename);
    return res.redirect(302, url);
  }
  const all = await readData();
  const c = all.find(x => x.id === req.params.id);
  if (!c) return res.status(404).send("Não encontrado");
  const imgPath = path.join(getLocalSlidesDir(c), req.params.filename);
  if (!fs.existsSync(imgPath)) return res.status(404).send("Imagem não encontrada");
  res.setHeader("Content-Disposition", `attachment; filename="${req.params.filename}"`);
  res.sendFile(imgPath);
});

// ── API: Read slide meta (title/body/layout stored alongside the image) ───────
app.get("/api/carousels/:id/slide/:filename/meta", async (req, res) => {
  const all = await readData();
  const c = all.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Não encontrado" });
  const metaPath = path.join(getLocalSlidesDir(c), req.params.filename.replace(/\.(jpg|jpeg|png)$/i, ".meta.json"));
  if (!fs.existsSync(metaPath)) return res.json({ title: "", body: "", layout: "fullbleed" });
  try {
    res.json(JSON.parse(fs.readFileSync(metaPath, "utf-8")));
  } catch {
    res.json({ title: "", body: "", layout: "fullbleed" });
  }
});

// ── API: Recompose slide with new text (keeps original image) ────────────────
app.post("/api/carousels/:id/slide/:filename/recompose", async (req, res) => {
  const all = await readData();
  const c = all.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Não encontrado" });
  const imgPath = path.join(getLocalSlidesDir(c), req.params.filename);
  if (!fs.existsSync(imgPath)) return res.status(404).json({ error: "Imagem não encontrada" });
  const { title, body, layout = "fullbleed" } = req.body;
  if (!title || !body) return res.status(400).json({ error: "title e body são obrigatórios" });
  try {
    const { stdout } = await execFileAsync("python", [
      COMPOSE_SCRIPT,
      "--image", imgPath, "--title", title, "--body", body,
      "--layout", layout, "--output", imgPath
    ], { timeout: 60000 });
    console.log("recompose:", stdout.trim());
    // Salva meta para seleção de elemento futura
    const metaPath = imgPath.replace(/\.(jpg|jpeg|png)$/i, ".meta.json");
    fs.writeFileSync(metaPath, JSON.stringify({ title, body, layout }, null, 2));
    res.json({ ok: true, message: stdout.trim() });
  } catch (e) {
    console.error("recompose error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── API: Excluir carrossel inteiro ─────────────────────────────────────────────
app.delete("/api/carousels/:id", async (req, res) => {
  let all = await readData();
  const index = all.findIndex(x => x.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Não encontrado" });
  
  const c = all[index];
  
  // Tentar remover a pasta de slides se existir
  try {
    const localDir = getLocalSlidesDir(c);
    if (localDir && fs.existsSync(localDir)) {
      fs.rmSync(localDir, { recursive: true, force: true });
    }
  } catch (e) {
    console.error(`Erro ao apagar pasta ${c.slidesDir}:`, e.message);
  }

  all.splice(index, 1);
  await writeData(all);
  res.json({ ok: true, message: "Carrossel apagado com sucesso" });
});

// ── API: Excluir slide individual ─────────────────────────────────────────────
app.delete("/api/carousels/:id/slide/:filename", async (req, res) => {
  const all = await readData();
  const c = all.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Carrossel não encontrado" });
  
  const imgPath = path.join(getLocalSlidesDir(c), req.params.filename);
  try {
    if (fs.existsSync(imgPath)) {
      fs.unlinkSync(imgPath);
      res.json({ ok: true, message: "Slide apagado com sucesso" });
    } else {
      res.status(404).json({ error: "Arquivo do slide não encontrado" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── API: Regenerate image via Gemini + recompose ─────────────────────────────
app.post("/api/carousels/:id/slide/:filename/regen", async (req, res) => {
  const all = await readData();
  const c = all.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Não encontrado" });
  const imgPath = path.join(getLocalSlidesDir(c), req.params.filename);
  const { prompt, title, body, layout = "fullbleed" } = req.body;
  if (!prompt || !title || !body) return res.status(400).json({ error: "prompt, title e body são obrigatórios" });
  try {
    const { stdout } = await execFileAsync("python", [
      REGEN_SCRIPT,
      "--prompt", prompt, "--title", title, "--body", body,
      "--layout", layout, "--output", imgPath
    ], { timeout: 180000 });
    console.log("regen:", stdout.trim());
    res.json({ ok: true, message: stdout.trim() });
  } catch (e) {
    console.error("regen error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── API: Download ZIP — carrossel individual ─────────────────────────────────
app.get("/api/carousels/:id/download-zip", async (req, res) => {
  const all = await readData();
  const c   = all.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Carrossel não encontrado" });

  const slides = getSlidesFromDir(getLocalSlidesDir(c), c.slidePrefix);
  if (slides.length === 0) return res.status(404).json({ error: "Nenhum slide encontrado na pasta" });

  const payload  = [{ ...c, slides: slides.map(s => s.filename) }];
  const safeName = c.id.replace(/[^a-z0-9-]/gi, "-");
  const tmpFile  = path.join(os.tmpdir(), `${safeName}-${Date.now()}.zip`);

  try {
    const { stdout } = await execFileAsync("python", [
      ZIP_SCRIPT,
      "--data",   JSON.stringify(payload),
      "--output", tmpFile,
    ], { timeout: 60000 });
    console.log("zip-carousel:", stdout.trim());

    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.zip"`);
    res.setHeader("Content-Type", "application/zip");
    const stream = fs.createReadStream(tmpFile);
    stream.pipe(res);
    stream.on("close", () => fs.unlink(tmpFile, () => {}));
  } catch (e) {
    console.error("zip-carousel error:", e.message);
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

// ── API: Download ZIP — TODOS os carrosséis ──────────────────────────────────
app.get("/api/download-all", async (req, res) => {
  const all  = await readData();
  const payload = all.map(c => {
    const slides = getSlidesFromDir(getLocalSlidesDir(c), c.slidePrefix);
    return { ...c, slides: slides.map(s => s.filename) };
  }).filter(c => c.slides.length > 0);

  if (payload.length === 0) {
    return res.status(404).json({ error: "Nenhum slide encontrado em nenhum carrossel" });
  }

  const tmpFile = path.join(os.tmpdir(), `afonteoculta-todos-${Date.now()}.zip`);

  try {
    const { stdout } = await execFileAsync("python", [
      ZIP_SCRIPT,
      "--data",   JSON.stringify(payload),
      "--output", tmpFile,
    ], { timeout: 180000 });
    console.log("download-all:", stdout.trim());

    const date = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Disposition", `attachment; filename="afonteoculta-carrosseis-${date}.zip"`);
    res.setHeader("Content-Type", "application/zip");
    const stream = fs.createReadStream(tmpFile);
    stream.pipe(res);
    stream.on("close", () => fs.unlink(tmpFile, () => {}));
  } catch (e) {
    console.error("download-all error:", e.message);
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

// ── API: Publicar no Instagram via script Python ──────────────────────────────
app.post("/api/carousels/:id/publish-instagram", async (req, res) => {
  const all = await readData();
  const c   = all.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Carrossel não encontrado" });

  const PUBLISH_SCRIPT = path.join(__dirname, "..", "infra", "social", "publish_instagram.py");
  const caption = req.body.caption || c.caption || "";

  const args = [
    "-X", "utf8", PUBLISH_SCRIPT,
    "--id",      req.params.id,
  ];
  if (caption) {
    args.push("--caption", caption);
  }
  if (req.body.stories) {
    args.push("--stories");
  }

  // Streaming de progresso via SSE não é trivial aqui — retornamos resultado final
  try {
    const { stdout, stderr } = await execFileAsync("python", args, { timeout: 300000 }); // 5 min timeout

    console.log("publish-instagram:", stdout.trim());
    if (stderr) console.error("publish-instagram stderr:", stderr.trim());

    // Recarrega dados atualizados
    const updated = (await readData()).find(x => x.id === req.params.id);
    res.json({ ok: true, log: stdout, carousel: updated });
  } catch (e) {
    console.error("publish-instagram error:", e.message);
    res.status(500).json({ error: e.message, log: e.stdout || "" });
  }
});

// ── API: Oráculo — Buscar métricas reais do Instagram ────────────────────────
app.post("/api/oraculo/update", async (req, res) => {
  const ORACULO_SCRIPT = path.join(__dirname, "..", "oraculo_metrics.py");
  const carouselId = req.body.id || null;
  const args = ["-X", "utf8", ORACULO_SCRIPT];
  if (carouselId) args.push("--id", carouselId);

  try {
    const { stdout, stderr } = await execFileAsync("python", args, { timeout: 60000 });
    console.log("oraculo:", stdout.trim());
    const all = await readData();
    res.json({ ok: true, log: stdout, carousels: all });
  } catch (e) {
    console.error("oraculo error:", e.message);
    res.status(500).json({ error: e.message, log: e.stdout || "" });
  }
});

app.get("/api/oraculo", async (req, res) => {
  const all = await readData();
  const withMetrics = all
    .filter(c => c.metrics)
    .map(c => ({
      id:          c.id,
      title:       c.title,
      status:      c.status,
      publishedAt: c.publishedAt || "",
      permalink:   c.metrics?.permalink || "",
      likes:       c.metrics?.likes || 0,
      comments:    c.metrics?.comments || 0,
      impressions: c.metrics?.impressions || 0,
      reach:       c.metrics?.reach || 0,
      saved:       c.metrics?.saved || 0,
      shares:      c.metrics?.shares || 0,
      engagement:  c.metrics?.engagement || 0,
      updated_at:  c.metrics?.updated_at || "",
    }))
    .sort((a, b) => b.engagement - a.engagement);
  res.json(withMetrics);
});

// ── API: Oráculo Completo — todos os posts do Instagram ──────────────────────
const ORACULO_DATA_FILE    = path.join(__dirname, "data", "oraculo_data.json");
const ORACULO_COMPLETO_SCRIPT = path.join(__dirname, "..", "core", "agentes", "oraculo_completo.py");

function readOraculoData() {
  try {
    return JSON.parse(fs.readFileSync(ORACULO_DATA_FILE, "utf-8"));
  } catch {
    return { posts: [], last_sync: null, total_posts: 0, totals: {} };
  }
}

// Sincroniza todos os posts do Instagram
app.post("/api/oraculo/sync", async (req, res) => {
  try {
    const { stdout, stderr } = await execFileAsync("python", [
      "-X", "utf8", ORACULO_COMPLETO_SCRIPT
    ], { timeout: 300000 }); // 5 min para contas com muitos posts
    console.log("oraculo-sync:", stdout.trim());
    if (stderr) console.error("oraculo-sync stderr:", stderr.trim());
    const data = readOraculoData();
    res.json({ ok: true, log: stdout, ...data });
  } catch (e) {
    console.error("oraculo-sync error:", e.message);
    res.status(500).json({ error: e.message, log: e.stdout || "" });
  }
});

// Retorna dados do Oráculo (sem chamar a API — só o que já foi sincronizado)
app.get("/api/oraculo/completo", (req, res) => {
  res.json(readOraculoData());
});

// ── API: HauCacau — Gerar Carrossel ──────────────────────────────────────────
const HAU_PIPELINE = path.join(__dirname, "..", "core", "agentes", "pipeline_haucacau.py");

app.post("/api/haucacau/gerar", (req, res) => {
  const { tema, universo = 2, avatar = "A", ancora = "" } = req.body;
  if (!tema) return res.status(400).json({ error: "tema é obrigatório" });

  const params = JSON.stringify({ tema, universo, avatar, ancora });

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  const proc = spawn("python", ["-X", "utf8", HAU_PIPELINE, "--data", params]);

  proc.stdout.on("data", chunk => {
    chunk.toString().split("\n").filter(Boolean).forEach(line => {
      try {
        const obj = JSON.parse(line);
        res.write(`data: ${JSON.stringify(obj)}\n\n`);
      } catch {}
    });
  });

  proc.stderr.on("data", chunk => {
    res.write(`data: ${JSON.stringify({ type: "log", msg: chunk.toString().trim() })}\n\n`);
  });

  proc.on("close", code => {
    res.write(`data: ${JSON.stringify({ type: "closed", code })}\n\n`);
    res.end();
  });
});

// ── API: HauCacau — Listar carrosséis ────────────────────────────────────────
app.get("/api/haucacau/carousels", async (req, res) => {
  const all = await readData();
  res.json(all.filter(c => c.projeto === "haucacau"));
});

// ── API: Stats ───────────────────────────────────────────────────────────────
app.get("/api/stats", async (req, res) => {
  const all = await readData();
  const statusCount = {};
  let totalSlides = 0;
  let totalCost = 0;
  all.forEach(c => {
    statusCount[c.status] = (statusCount[c.status] || 0) + 1;
    const slides = getSlidesFromDir(getLocalSlidesDir(c), c.slidePrefix);
    totalSlides += slides.length;
    if (c.costUSD) totalCost += Number(c.costUSD) || 0;
  });
  res.json({
    totalCarousels: all.length,
    totalSlides,
    byStatus: statusCount,
    totalCost: Math.round(totalCost * 10000) / 10000,
    lastUpdated: new Date().toISOString(),
  });
});

const ENV_PATH = fs.existsSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env'))
  ? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env')
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env');

const MANAGED_KEYS = [
  { key: 'OPENAI_API_KEY',       label: 'OpenAI API Key',          group: 'Geração de Imagem' },
  { key: 'FAL_KEY',              label: 'Fal.ai API Key',           group: 'Geração de Imagem' },

  { key: 'GEMINI_API_KEY',       label: 'Google Gemini API Key',    group: 'Geração de Imagem' },
  { key: 'ELEVENLABS_API_KEY',   label: 'ElevenLabs API Key',       group: 'Áudio' },
  { key: 'META_ACCESS_TOKEN',    label: 'Meta / Instagram Token',   group: 'Publicação' },
  { key: 'INSTAGRAM_ACCOUNT_ID', label: 'Instagram Account ID',     group: 'Publicação' },
  { key: 'FACEBOOK_PAGE_ID',     label: 'Facebook Page ID',         group: 'Publicação' },
  { key: 'IMGBB_API_KEY',        label: 'ImgBB API Key',            group: 'Publicação' },
  { key: 'NOTION_TOKEN',         label: 'Notion Token',             group: 'Integrações' },
  { key: 'APIFY_API_KEY',        label: 'Apify API Key',            group: 'Integrações' },
  { key: 'ACTIVE_IMAGE_PROVIDER',label: 'Provedor de Imagem Ativo', group: 'Geração de Imagem' },
];



function readEnvFile() {
  try { return fs.readFileSync(ENV_PATH, 'utf-8'); } catch { return ''; }
}

function parseEnvFile(content) {
  const result = {};
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    result[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return result;
}

function maskValue(v) {
  if (!v || v.length < 6) return v ? '••••' : '';
  return '••••' + v.slice(-4);
}

app.get('/api/settings/keys', (req, res) => {
  const env = parseEnvFile(readEnvFile());
  const result = MANAGED_KEYS.map(({ key, label, group }) => ({
    key, label, group,
    value: env[key] || '',
    masked: maskValue(env[key] || ''),
    set: !!(env[key] && env[key] !== `sua_${key.toLowerCase()}_aqui`),
  }));
  res.json({
    keys: result,
    activeProvider: env['ACTIVE_IMAGE_PROVIDER'] || 'gpt-image-2',
  });
});


app.post('/api/settings/keys', (req, res) => {
  const updates = req.body; // { KEY: 'value', ... }
  if (!updates || typeof updates !== 'object') return res.status(400).json({ error: 'body inválido' });

  let content = readEnvFile();
  const lines = content.split('\n');

  for (const [key, value] of Object.entries(updates)) {
    if (!value && value !== '') continue; // skip undefined
    // Find existing line and update, or append
    const idx = lines.findIndex(l => {
      const t = l.trim();
      return !t.startsWith('#') && t.startsWith(key + '=');
    });
    const newLine = `${key}=${value}`;
    if (idx >= 0) {
      lines[idx] = newLine;
    } else {
      lines.push(newLine);
    }
  }

  try {
    fs.writeFileSync(ENV_PATH, lines.join('\n'), 'utf-8');
    // Reload into process.env
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) process.env[k] = v;
    }
    res.json({ ok: true, updated: Object.keys(updates) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── API: Radar de Descobertas ─────────────────────────────────────────────────
const RADAR_DATA_FILE = path.join(__dirname, "data", "radar_data.json");
const RADAR_SCRIPT = path.join(__dirname, "..", "infra", "social", "radar_apify.py");

function readRadarData() {
  try {
    return JSON.parse(fs.readFileSync(RADAR_DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

app.post("/api/radar/sync", async (req, res) => {
  try {
    const { stdout, stderr } = await execFileAsync("python", ["-X", "utf8", RADAR_SCRIPT], { timeout: 300000 });
    console.log("radar-sync:", stdout.trim());
    if (stderr) console.error("radar-sync stderr:", stderr.trim());
    const data = readRadarData();
    res.json({ ok: true, log: stdout, data });
  } catch (e) {
    console.error("radar-sync error:", e.message);
    res.status(500).json({ error: e.message, log: e.stdout || "" });
  }
});

app.get("/api/radar", (req, res) => {
  res.json(readRadarData());
});

// ── API: Máquina de Reels ────────────────────────────────────────────────────
app.get("/api/reels/analyze", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "URL is required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const REELS_SCRIPT = path.join(__dirname, "..", "core", "agentes", "reels_engineer.py");
  const child = spawn("python", ["-X", "utf8", REELS_SCRIPT, url], { shell: true });

  let finalResult = null;

  child.on("error", (err) => {
    res.write(`data: ${JSON.stringify({ type: "error", message: "Erro ao iniciar o script: " + err.message })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "done", result: { error: err.message } })}\n\n`);
    res.end();
  });

  child.stdout.on("data", (data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      if (line.startsWith("FINAL_RESULT:")) {
        try {
          finalResult = JSON.parse(line.substring(13));
        } catch(e) {}
      } else {
        res.write(`data: ${JSON.stringify({ type: "log", message: line })}\n\n`);
      }
    }
  });

  child.stderr.on("data", (data) => {
    // Ignore yt-dlp internal warnings, but send them to log
    res.write(`data: ${JSON.stringify({ type: "log", message: data.toString() })}\n\n`);
  });

  child.on("close", async (code) => {
    if (finalResult && !finalResult.error) {
      const history = await readReelsHistory();
      history.unshift({
        ...finalResult,
        url: url,
        timestamp: new Date().toISOString()
      });
      // Mantém os últimos 50 registros
      await writeReelsHistory(history.slice(0, 50));
    }
    res.write(`data: ${JSON.stringify({ type: "done", result: finalResult })}\n\n`);
    res.end();
  });
});

app.get("/api/reels/history", async (req, res) => {
  res.json(await readReelsHistory());
});

// ── API: Download de Reel (yt-dlp) ───────────────────────────────────────────
app.get("/api/reels/download", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const tmpDir = path.join(__dirname, "data", "reel-downloads");
  fs.mkdirSync(tmpDir, { recursive: true });

  const outTemplate = path.join(tmpDir, "%(id)s.%(ext)s");
  const dlScript   = path.join(__dirname, "scripts", "download_reel.py");

  try {
    const { stdout } = await execFileAsync(
      "python",
      ["-X", "utf8", dlScript, url, outTemplate],
      { shell: false, maxBuffer: 10 * 1024 * 1024 }
    );

    const result   = JSON.parse(stdout.trim().split("\n").pop());
    if (result.error) return res.status(500).json({ error: result.error });

    const filePath = result.file;
    const title    = (result.title || "reel").replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 60);

    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ error: "Arquivo não encontrado após download." });
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp4"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on("close", () => { try { fs.unlinkSync(filePath); } catch {} });
  } catch (e) {
    res.status(500).json({ error: e.stderr || e.message });
  }
});

// ── API: Fábrica de Vídeos (Seedance) SSE ───────────────────────────────────
app.get("/api/video/generate", (req, res) => {
  const tema = req.query.tema;
  if (!tema) return res.status(400).json({ error: "Tema is required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const PIPELINE_SCRIPT = path.join(__dirname, "..", "processos", "pipeline_reels.py");
  const child = spawn("python", ["-X", "utf8", PIPELINE_SCRIPT, tema], { shell: true });

  child.on("error", (err) => {
    res.write(`data: ${JSON.stringify({ type: "error", message: "Erro ao iniciar o script: " + err.message })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  });

  child.stdout.on("data", (data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      res.write(`data: ${JSON.stringify({ type: "log", message: line })}\n\n`);
    }
  });

  child.stderr.on("data", (data) => {
    res.write(`data: ${JSON.stringify({ type: "log", message: data.toString() })}\n\n`);
  });

  child.on("close", (code) => {
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  });
});

app.delete("/api/reels/history/:index", async (req, res) => {
  const history = await readReelsHistory();
  const idx = parseInt(req.params.index);
  if (isNaN(idx) || idx < 0 || idx >= history.length) return res.status(400).json({ error: "Invalid index" });
  history.splice(idx, 1);
  await writeReelsHistory(history);
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
    // Silencia erros normais do script se não tiver post, mas se falhar por código, exibe no console.
    if (e.stdout && e.stdout.includes("Post:")) {
       console.log("\n[CRON] Publicador executou (mas retornou erro):\n" + e.stdout);
    }
  }
}, 60000); // Roda a cada 60 segundos

// ── API: Client config ────────────────────────────────────────────────────────
app.get('/api/client', (req, res) => {
  if (!CLIENT) return res.status(404).json({ error: 'client.json não encontrado' });
  // Retorna versão segura (sem dados sensíveis — client.json não tem senhas)
  res.json(CLIENT);
});

// ── O Escritório — Personas dos Agentes ──────────────────────────────────────
// Prompts são gerados dinamicamente a partir do client.json
function buildAgentPrompts(c) {
  if (!c) {
    // fallback seguro se client.json não existir
    return {};
  }

  const creator  = c.meta?.creator       || 'o criador';
  const handle   = c.meta?.handle        || '';
  const brand    = c.meta?.clientName    || 'o estúdio';
  const method   = c.method?.name        || 'o método';
  const niche    = (c.brand?.niche       || []).join(', ');
  const product  = c.brand?.product      || 'o produto principal';
  const aesthetic= (c.visual?.aesthetic  || []).join(', ');
  const audioStyle=(c.audio?.style       || []).join(', ');
  const voiceRef = c.voice?.narration?.voice_ref      || '';
  const voiceProvider = c.voice?.narration?.voice_provider || 'ElevenLabs';
  const voiceQ   = c.voice?.narration?.voice_qualities || '';
  const forbidden= (c.voice?.vocabulary?.forbidden    || []).map(f => `"${f}"`).join(', ');
  const forbidVisuals = (c.visual?.forbidden_visuals  || []).join(', ');
  const prefVisuals   = (c.visual?.preferred_visuals  || []).join(', ');
  const sfxTypes = (c.audio?.allowed_types || []).join(', ');
  const sfxForbid= (c.audio?.forbidden_types || []).join(', ');
  const sfxRefs  = (c.audio?.references    || []).join(', ');

  const methodBeats = (c.method?.structure?.beats || [])
    .map(b => `${b.id}. ${b.name} — ${b.description}`)
    .join('\n');

  const states   = (c.carousel?.states   || []).join(', ');
  const presets  = Object.entries(c.carousel?.presets || {})
    .map(([k, v]) => `${k} (${v.palette})`).join(', ');

  const m = c.metrics || {};
  const metricsLine = m.posts
    ? `${m.posts} posts | ${(m.likes/1e6).toFixed(2)}M likes | ${Math.round(m.comments/1000)}K comentários | ${Math.round(m.saves/1000)}K saves | ${(m.shares/1e6).toFixed(2)}M shares | ${(m.reach/1e6).toFixed(1)}M de alcance | ${m.followers_gained_organic?.toLocaleString('pt-BR')} seguidores ganhos (orgânico)`
    : 'métricas não configuradas';

  const agents = c.agents || {};
  const ag = (id) => agents[id] || {};

  return {

    copywriter: `Você é ${ag('copywriter').persona_name || 'o Copywriter'} de ${brand} — a copywriter do estúdio. Trabalha com ${creator}${handle ? `, criador do ${handle}` : ''}.

Especialidade: roteiros usando o ${method} (${c.method?.structure?.format?.replace('_', ' ')}, ${c.method?.structure?.fala_length} cada):
${methodBeats}

Regras: jamais use clichês como ${forbidden}. Sem traços (—) como muleta. Tom ${(c.voice?.tone || []).join(', ')}. Vocabulário ${c.voice?.density || 'denso e específico'}. Quando ${creator} traz um tema, entregue as falas prontas e numeradas. Responda em ${c.meta?.language || 'português brasileiro'}.`,

    diretor_cena: `Você é ${ag('diretor_cena').persona_name || 'o Diretor de Cena'} de ${brand} — Diretor de Cena do estúdio. Trabalha com ${creator}.

Especialidade: para cada fala de roteiro, criar a descrição visual surrealista que aparece no fundo do vídeo.

Regras: NUNCA cenas literais (${forbidVisuals}). SEMPRE metáforas viscerais: ${prefVisuals}. Estética: ${aesthetic}. Figuras humanas: ${c.visual?.human_figures || 'apenas silhueta, sem rosto'}. Cada descrição: 2-4 frases específicas.

Descreva cenas em inglês quando for para a IA de vídeo. Converse com ${creator} em ${c.meta?.language || 'português brasileiro'}.`,

    sonoplasta: `Você é ${ag('sonoplasta').persona_name || 'o Sonoplasta'} de ${brand} — Sonoplasta do estúdio. Trabalha com ${creator}.

Especialidade: criar texturas sonoras ambientais para cada cena dos Reels.

Regras: NUNCA ${sfxForbid}. APENAS ${sfxTypes}. Tom: ${audioStyle}. Cada prompt SFX: ${c.audio?.sfx_length || '8-15 palavras'} em inglês.

Para cada cena que ${creator} descreve: identifique a emoção central, descreva o SFX ideal em inglês, explique em português por que esse som serve a cena. Você conhece ${sfxRefs}. Responda em ${c.meta?.language || 'português brasileiro'}.`,

    voz: `Você é ${ag('voz').persona_name || 'o Narrador'} de ${brand} — o Narrador do estúdio. Trabalha com ${creator}.

Especialidade: preparar as falas do roteiro para narração cinematográfica.

Para cada fala, você indica:
- PAUSA: marcada com ${c.voice?.narration?.pause_marker || '│'} (ex: "Você sempre soube │ que algo estava errado.")
- ÊNFASE: palavra em ${c.voice?.narration?.emphasis_style || 'MAIÚSCULAS'} (ex: "Isso não é acaso. É PROGRAMAÇÃO.")
- VELOCIDADE: ${(c.voice?.narration?.speed_options || ['lento', 'normal', 'acelerado']).join(' / ')}
- TOM: ${(c.voice?.narration?.tone_options || ['assombrado', 'revelador', 'íntimo', 'urgente', 'preditivo']).join(' / ')}

Você também sugere variações mais cinematográficas e identifica palavras-âncora que grudam na memória. Referência de voz: ${voiceRef} da ${voiceProvider} — ${voiceQ}. Responda em ${c.meta?.language || 'português brasileiro'}.`,

    diretor_artistico: `Você é ${ag('diretor_artistico').persona_name || 'o Diretor Artístico'} de ${brand} — Diretor Artístico do estúdio. Trabalha com ${creator}.

Especialidade: orquestrar a produção visual completa dos carrosséis Instagram.

Você domina:
- ${c.carousel?.total_slides || 10} ESTADOS: ${states}
- PRESETS: ${presets}
- MODOS: image (foto+texto sobreposto) e text (apenas texto, fundo escuro)
- S4, S5, S6: sempre text. S1: sempre image+cover (capa máxima). S10: sempre image (CTA)

Quando ${creator} traz um tema, sugira: preset, estratégia por slide, modo image/text e prompt base dos slides visuais. Responda em ${c.meta?.language || 'português brasileiro'}.`,

    engenheiro_reels: `Você é ${ag('engenheiro_reels').persona_name || 'o Engenheiro de Reels'} de ${brand} — Engenheiro de Reels do estúdio. Trabalha com ${creator}.

Especialidade: analisar o que faz um Reel viral e traduzir para o estilo ${brand}.

Você entende de: HOOKS (o que para o scroll em 0,5s), PADRÃO DE RETENÇÃO, COPYWRITING DE VÍDEO, MECANISMOS PSICOLÓGICOS (curiosidade, identidade, medo de perder).

Quando ${creator} traz um tema ou transcrição, você entrega:
1. GANCHO: o que estava funcionando e por quê
2. PADRÃO PSICOLÓGICO: mecanismo ativado
3. ROTEIRO ${brand.toUpperCase()}: ${c.method?.structure?.format?.replace('_', ' ')?.replace(/^\d+/, '') || 'falas'} reescritas no ${method}

Nicho: ${niche}. Responda em ${c.meta?.language || 'português brasileiro'}.`,

    roteirista: `Você é ${ag('roteirista').persona_name || 'o Roteirista'} de ${brand} — Roteirista do estúdio. Trabalha com ${creator}.

Especialidade: fatiar roteiros em cenas de produção prontas para o pipeline (${c.method?.structure?.scene_duration_sec || '4-5'} segundos por cena).

PARA CADA CENA você entrega:
- FALA: ${c.method?.structure?.fala_length || '10-15 palavras'} (ritmo arrastado, ${c.method?.structure?.scene_duration_sec || '4-5'} segundos)
- VISUAL (inglês): metáfora visual surrealista para o fundo do vídeo
- SFX (inglês): prompt de efeito sonoro ambiental (${c.audio?.sfx_length || '8-15 palavras'})

Vídeo total: ${c.method?.structure?.video_total_sec || '30-40'} segundos. Visuais nunca literais — sempre metáforas ${aesthetic.split(',')[0] || 'cósmicas'}. Cada cena tem identidade própria. Quando ${creator} traz falas do Copywriter, monte a tabela completa pronta para produção. Responda em ${c.meta?.language || 'português brasileiro'}.`,

    oraculo: `Você é ${ag('oraculo').persona_name || 'o Oráculo'} de ${brand} — Oráculo de Métricas do estúdio. Trabalha com ${creator}.

DADOS ATUAIS de ${handle || brand}:
- ${metricsLine}

Você analisa: o que performa melhor e por quê, padrões de engajamento por tipo de conteúdo, estratégia de crescimento, timing de publicação, temas com maior potencial viral no nicho.

Nicho: ${niche}. Produto: ${product}. Seja analítico mas fale em português claro, sem jargão de marketing. Responda em ${c.meta?.language || 'português brasileiro'}.`,

    criador: `Você é o CRIADOR — o agente unificado de produção de conteúdo de ${brand}. Trabalha diretamente com ${creator}${handle ? ` (${handle})` : ''}.

## SEU TRABALHO PRINCIPAL

Quando ${creator} traz um TEMA, você entrega o carrossel completo de 10 slides usando o ${method} — estrutura de curva dramática viral para Instagram.

Você também responde perguntas estratégicas, sugere temas, analisa ganchos e pensa sobre conteúdo com a profundidade da Voz Oculta.

---

## VOZ OCULTA — FILTRO OBRIGATÓRIO

${brand} não revela informação. Ela levanta um véu. O seguidor não recebe dados — ele é iniciado.

**O Véu:** aponta para o que foi escondido, nunca entrega direto.
❌ "Nixon desconectou o dólar do ouro em 1971"
✅ "Existe um domingo à noite em 1971 em que o dinheiro perdeu a alma."

**A Transmissão:** o campo do seguidor já opera antes de qualquer decisão consciente.
❌ "A pessoa mais exausta não tem dinheiro"
✅ "Seu campo já sabe quanto você vai ganhar antes de você ir à entrevista."

**A Iniciação:** o leitor é chamado a ver algo que sempre soube mas nunca nomeou.
❌ "Bancos criam dinheiro do nada"
✅ "Toda vez que você assina um contrato, o banco invoca dinheiro do vazio — literalmente do nada."

VOCABULÁRIO PROIBIDO: "estudos mostram", "a verdade é que", "o que ninguém te contou", "você precisa ver isso", "você deveria saber", "calibrado/recalibrar", "frequência de merecimento", "irradiar/irradiando", "arquitetura invisível", "não é acidente. É arquitetura.", "Ademais", "Nesse sentido".

TOM: calma de quem já viu o que está por trás. Não é animação. Não é urgência. Fala com quem sempre suspeitou que existia.

---

## MÉTODO JORDÂNICO — ESTRUTURA DOS 10 SLIDES

A curva dramática de tensão que gera engajamento viral:

S1 DISRUPÇÃO → tensão MÁXIMA. Gancho que para o scroll. Paradoxo, confronto direto ou contradição visceral. Deve conter número OU nome OU comparação com referente real. 1-2 frases. Espaço é tensão.

S2 DESCIDA → validação. "Você não estava errado em sentir isso." Tom baixo, cúmplice.

S3 NOMEAÇÃO → raiva direcionada. Existe um responsável nomeável com evidência específica (nome, instituição, ano, número). 2-3 frases + dado verificável.

S4 PROFUNDIDADE → mecanismo real. Ciência ou história verificável. Nível intelectual. Nomeia a força externa.

S5 QUEDA MAIS FUNDA → cumplicidade interna. O que o avatar faz para manter o padrão sem perceber. Esta é a frase mais difícil de escrever e de ler. Deve ir UN NÍVEL mais fundo que S4. S4 nomeia o sistema externo. S5 nomeia o que o avatar carrega internamente.

S6 ESPELHO → o avatar se vê. Reconhecimento doloroso. Segunda pessoa. "Você já..." ou "Existe uma parte de você que..."

S7 ASCENSÃO → existe saída. Tem nome. Tem mecanismo. Não é "você pode mudar." É concreta e específica.

S8 CRISTALIZAÇÃO → síntese pura em 1-2 frases. O que corpo/campo/sistema aprendeu. SEM CTA. SEM produto. Resolução com PESO — não com leveza. É reconhecimento que transforma.

S9 SETUP CTA → urgência de possibilidade SEM revelar produto. Usa linguagem de protocolo/frequência/resultado. Cria tensão de "existe algo". Exemplos: "Existe um protocolo específico para...", "Existe uma frequência que...", "Eu mapeei exatamente o que..."

S10 CTA FIXO → INTOCÁVEL. TÍTULO: sempre "COMENTE\\nFONTE". CORPO: sempre "E eu te envio a Tecnologia Sonora capaz de [resultado específico do pilar] usando o Desbloqueio Neural."

REGRA DE OSCILAÇÃO: ALTO (S1) → baixo (S2) → médio-alto raiva (S3) → fundo intelectual (S4) → fundo emocional mais fundo (S5) → reconhecimento (S6) → esperança (S7) → resolução (S8) → tensão possibilidade (S9) → portal (S10). NUNCA curva linear.

---

## FORMATO DE SAÍDA COMPLETO — QUANDO O USUÁRIO TRAZ UM TEMA

Entregue EXATAMENTE neste formato dissertativo completo (não pule nenhuma seção):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRAÇA: [MENTE / SISTEMA / CORPO / ESPÍRITO / ALAVANCA]
FORMATO: [A / B / C / D]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARQUEOLOGIA:
- Dor atual: [situação concreta, não abstrata]
- Desejo profundo (real): [o que nunca admite em voz alta]
- Frustrações acumuladas: [o que já tentou e não funcionou]
- Crença falsa nuclear: [narrativa que conta para si mesmo]
- Verdade oculta: [o que o carrossel vai revelar]
- Raiva coletiva (responsável nomeável): [sistema/instituição com evidência]

BIG IDEA: [1 frase — verificável, contraintuitiva, falsificável]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOOK FORGE:

CONFRONTO DIRETO: [...]
INVERSÃO DE CRENÇA: [...]
PARADOXO SAGRADO: [...]

→ ESCOLHIDO: [tipo]
→ MOTIVO: [por que este serve melhor a ESTE tema — e por que os outros dois foram descartados]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PARTITURA EMOCIONAL:
S1  [DISRUPÇÃO]     — estado: ___ | tensão: MÁXIMA           | gatilho: ___
S2  [DESCIDA]       — estado: ___ | tensão: BAIXA             | gatilho: Validação
S3  [NOMEAÇÃO]      — estado: ___ | tensão: MÉDIA-ALTA        | gatilho: Raiva + Evidência
S4  [PROFUNDIDADE]  — estado: ___ | tensão: INTELECTUAL       | gatilho: Mecanismo
S5  [QUEDA FUNDA]   — estado: ___ | tensão: EMOCIONAL FUNDA   | gatilho: Cumplicidade Interna
S6  [ESPELHO]       — estado: ___ | tensão: RECONHECIMENTO    | gatilho: Identificação
S7  [ASCENSÃO]      — estado: ___ | tensão: ESPERANÇA ESPEC.  | gatilho: Saída Concreta
S8  [CRISTALIZAÇÃO] — estado: ___ | tensão: RESOLUÇÃO PURA    | gatilho: Síntese da Jornada
S9  [SETUP CTA]     — estado: ___ | tensão: POSSIBILIDADE     | gatilho: Existe algo (sem nome)
S10 [CTA FIXO]      — estado: ___ | tensão: ABERTURA          | gatilho: Tecnologia Sonora

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLIDES:

[S1 — DISRUPÇÃO | layout: fullbleed]
TÍTULO: [CAIXA ALTA — máx 6 palavras por linha, máx 3 linhas]
CORPO: [1-2 frases. Espaço é tensão. Número OU nome OU referente real obrigatório.]
VISUAL: [descrição em inglês da imagem — metáfora visceral, nunca literal. 2-3 frases.]

[S2 — DESCIDA | layout: dramatico]
TÍTULO: ...
CORPO: [validação. "Você não estava errado." Tom baixo, cúmplice.]
VISUAL: [...]

[S3 — NOMEAÇÃO | layout: dramatico]
TÍTULO: ...
CORPO: [2-3 frases + dado específico com nome/ano/número]
VISUAL: [...]

[S4 — PROFUNDIDADE | layout: text_only]
TÍTULO: ...
CORPO: [mecanismo real — ciência ou história verificável. Nível intelectual.]
VISUAL: [fundo escuro com textura sutil]

[S5 — QUEDA FUNDA | layout: text_only]
TÍTULO: ...
CORPO: [cumplicidade interna. A frase mais dura. UM NÍVEL mais fundo que S4.]
VISUAL: [fundo escuro — mais pesado que S4]

[S6 — ESPELHO | layout: text_only]
TÍTULO: ...
CORPO: [segunda pessoa direta. "Você já..." ou "Existe uma parte de você que..."]
VISUAL: [...]

[S7 — ASCENSÃO | layout: dramatico]
TÍTULO: ...
CORPO: [saída concreta com mecanismo — não genérica]
VISUAL: [...]

[S8 — CRISTALIZAÇÃO | layout: etereo]
TÍTULO: ...
CORPO: [síntese com PESO — não leveza. SEM CTA. SEM produto.]
VISUAL: [...]

[S9 — SETUP CTA | layout: dramatico]
TÍTULO: ...
CORPO: [urgência de possibilidade — sem nomear produto. "Existe um protocolo..."]
VISUAL: [...]

[S10 — CTA FIXO | layout: fullbleed]
TÍTULO: COMENTE
FONTE
CORPO: E eu te envio a Tecnologia Sonora capaz de [resultado específico do pilar] usando o Desbloqueio Neural.
VISUAL: portal dourado puro, luz emanando do centro, fundo profundo escuro
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAPTION (Instagram):
[150-200 palavras. Emojis sutis. Hashtags no final.]

CTA TRIBAL: "Comente FONTE se [experiência interna específica — estado que o seguidor carregava sem nome, não comportamento externo]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REVISÃO AUTÔNOMA:
C1 Gancho Paradoxal:           ?/3 — [justificativa]
C2 Arco com Oscilação:         ?/3 — [onde oscila / onde fica plano]
C3 Raiva Coletiva + Evidência: ?/3 — [citar o dado específico usado]
C4 CTA Tribal Estado Interno:  ?/3 — [por que é interno, não externo]
C5 S8 Três Camadas:            ?/3 — [nomear as 3 camadas]
TOTAL: ?/15 — [APROVADO ≥12 / REESCRITA 8-11 / DESCARTE <8]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## HUMANIZADOR — APLICAR ANTES DE ENTREGAR

- Sem travessões excessivos (máx 1 por slide — substituir por ponto final)
- Sem "Não é X. É Y." mais de 2x no mesmo slide
- Teste do Bar: pessoa de 28 anos entenderia numa conversa? Se não → reescrever
- Parágrafos curtos. Pontos frequentes. Sem subordinadas encadeadas.
- S5 claramente mais fundo que S4
- S8 tem peso — não leveza
- Palavra "calibrado" proibida em qualquer lugar

---

Responda em ${c.meta?.language || 'português brasileiro'}. Você é incisivo, específico, nunca genérico. Quando não receber um tema, converse naturalmente sobre estratégia, ganchos ou responda dúvidas.`,
  };
}

const AGENT_SYSTEM_PROMPTS = buildAgentPrompts(CLIENT);

// ── POST /api/agent/chat ──────────────────────────────────────────────────────
app.post('/api/agent/chat', async (req, res) => {
  const { agentId, messages } = req.body;
  const system = AGENT_SYSTEM_PROMPTS[agentId];
  if (!system) return res.status(400).json({ error: `Agente não encontrado: ${agentId}` });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY não configurada no .env' });

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages é obrigatório' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: 700,
        temperature: 0.85,
      }),
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    res.json({ reply: data.choices[0].message.content });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── API: Criador — Capacidades do ambiente ────────────────────────────────────
app.get('/api/criador/capabilities', (req, res) => {
  res.json({ canGenerateImages: true, isProd: IS_PROD });
});

// ── API: Criador — Gerar carrossel completo (pipeline Python) ─────────────────
// Local:  salva em Desktop, registra em carousels.json local
// Render: salva em /tmp/, faz upload B2, registra em carousels.json no B2
app.post('/api/criador/generate', async (req, res) => {
  const payload = req.body; // { title, theme, format, caption, notes, revisor_score, slides[] }

  if (!payload || !Array.isArray(payload.slides) || payload.slides.length === 0) {
    return res.status(400).json({ error: 'slides é obrigatório' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const PYTHON   = process.platform === 'win32' ? 'python' : 'python3';
  const PIPELINE = path.join(__dirname, '..', 'core', 'criador_pipeline.py');
  const child = spawn(PYTHON, ['-X', 'utf8', PIPELINE, '--data', JSON.stringify(payload)], {
    shell: false,
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      // Raiz do projeto (para imports core.*) + python_packages (deps instalados via --target no Render)
      PYTHONPATH: [
        path.join(__dirname, '..'),
        path.join(__dirname, '..', 'python_packages'),
      ].join(process.platform === 'win32' ? ';' : ':'),
    },
  });

  child.on('error', (err) => {
    res.write(`data: ${JSON.stringify({ type: 'error', msg: err.message })}\n\n`);
    res.end();
  });

  // Produção: acumula slides gerados para upload B2 ao final
  const generatedFiles = []; // [{ num, estado, file }]
  let donePayload = null;

  let buf = '';
  child.stdout.on('data', (data) => {
    buf += data.toString();
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      try {
        const obj = JSON.parse(t);
        // Em produção acumula para depois
        if (IS_PROD && obj.type === 'slide' && obj.status === 'ok' && obj.file) {
          generatedFiles.push({ num: obj.num, estado: obj.estado, file: obj.file });
        }
        if (IS_PROD && obj.type === 'done') donePayload = obj;
        res.write(`data: ${JSON.stringify(obj)}\n\n`);
      } catch {
        // linha de log não-JSON (ex: print() do Python)
        res.write(`data: ${JSON.stringify({ type: 'log', msg: t })}\n\n`);
      }
    }
  });

  child.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg) res.write(`data: ${JSON.stringify({ type: 'log', msg })}\n\n`);
  });

  child.on('close', async (code) => {
    // Drena buffer residual
    if (buf.trim()) {
      try {
        const obj = JSON.parse(buf.trim());
        if (IS_PROD && obj.type === 'slide' && obj.status === 'ok' && obj.file) {
          generatedFiles.push({ num: obj.num, estado: obj.estado, file: obj.file });
        }
        if (IS_PROD && obj.type === 'done') donePayload = obj;
        res.write(`data: ${JSON.stringify(obj)}\n\n`);
      } catch {}
    }

    // ── Produção: upload para B2 + registro no carousels.json ────────────────
    if (IS_PROD && b2 && generatedFiles.length > 0 && donePayload) {
      try {
        res.write(`data: ${JSON.stringify({ type: 'log', msg: '☁ Enviando imagens para B2...' })}\n\n`);

        // Determina próximo ID
        let allCarousels = [];
        try { allCarousels = await b2.readDataFromB2(); } catch {}
        const nums   = allCarousels.map(c => parseInt(c.id?.split('-').pop()) || 0).filter(Boolean);
        const nextNum = nums.length ? Math.max(...nums) + 1 : 1;
        const newId   = `carrossel-${String(nextNum).padStart(2, '0')}`;

        // Upload de cada slide
        const slideUrls = [];
        for (const { num, estado, file } of generatedFiles) {
          const filename = path.basename(file);
          try {
            const url = await b2.uploadImageToB2(newId, filename, file);
            slideUrls.push({ num, estado, filename, url });
            res.write(`data: ${JSON.stringify({ type: 'log', msg: `☁ ${filename} → B2 ✓` })}\n\n`);
          } catch (err) {
            res.write(`data: ${JSON.stringify({ type: 'log', msg: `☁ ${filename} falhou: ${err.message}` })}\n\n`);
          }
          // Remove arquivo temporário
          try { fs.unlinkSync(file); } catch {}
        }
        // Remove pasta temporária
        try { fs.rmdirSync(donePayload.slides_dir); } catch {}

        // Monta entrada e salva no B2
        const entry = {
          id:          newId,
          title:       donePayload.title   || payload.title   || 'Carrossel',
          theme:       donePayload.theme   || '',
          format:      donePayload.format  || 'B',
          status:      (donePayload.total_ok === donePayload.total) ? 'pronto' : 'rascunho',
          createdAt:   new Date().toISOString().slice(0, 10),
          slidesDir:   null,
          slidePrefix: 'slide-',
          totalSlides: slideUrls.length,
          caption:     donePayload.caption || payload.caption || '',
          notes:       donePayload.notes   || payload.notes   || '',
          b2BaseUrl:   b2.b2ImageUrl(newId, ''),
          slides:      slideUrls,
        };
        if (donePayload.revisor_score) entry.revisorScore = donePayload.revisor_score;

        allCarousels.push(entry);
        await b2.writeDataToB2(allCarousels);

        res.write(`data: ${JSON.stringify({ type: 'registered', id: newId, entry })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'log', msg: `✓ ${newId} salvo no B2` })}\n\n`);
      } catch (err) {
        res.write(`data: ${JSON.stringify({ type: 'error', msg: `Upload B2 falhou: ${err.message}` })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'close', code })}\n\n`);
    res.end();
  });
});

// ── API: Criador — Chat unificado com streaming SSE (gpt-5.4 / online only) ──
app.post('/api/criador/stream', async (req, res) => {
  const { messages } = req.body;
  const system = AGENT_SYSTEM_PROMPTS['criador'];
  if (!system) return res.status(500).json({ error: 'Agente criador não configurado' });

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages é obrigatório' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.write(`data: ${JSON.stringify({ error: 'OPENAI_API_KEY não configurada' })}\n\n`);
    return res.end();
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-5.4',
        messages: [{ role: 'system', content: system }, ...messages],
        max_completion_tokens: 4000,
        temperature: 0.88,
        stream: true,
      }),
    });

    if (!response.ok) {
      let errText = `HTTP ${response.status}`;
      try { const j = await response.json(); errText = j.error?.message || errText; } catch {}
      res.write(`data: ${JSON.stringify({ error: errText })}\n\n`);
      return res.end();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        const t = line.trim();
        if (!t || t === 'data: [DONE]') continue;
        if (t.startsWith('data: ')) {
          try {
            const json = JSON.parse(t.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) res.write(`data: ${JSON.stringify({ token: delta })}\n\n`);
          } catch {}
        }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (e) {
    console.error('criador/stream error:', e.message);
    if (!res.headersSent) res.status(500).json({ error: e.message });
    else { res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`); res.end(); }
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\nFonte Oculta Dashboard rodando em: http://localhost:${PORT}\n`);
  });
}).catch(err => {
  console.error("❌ Falha crítica ao inicializar banco de dados:", err);
  process.exit(1);
});
