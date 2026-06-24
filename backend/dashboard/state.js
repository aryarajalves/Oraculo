import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const IS_PROD = process.env.NODE_ENV === "production";

let b2Instance = null;
if (IS_PROD) {
  try {
    b2Instance = await import("./b2.js");
    console.log("[B2] Modo produção ativado — usando Backblaze B2");
  } catch (err) {
    console.error("Erro ao carregar módulo B2:", err);
  }
}
export { b2Instance as b2 };

function loadClientConfig() {
  try {
    const p = path.join(__dirname, '..', 'client.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch (e) {
    console.error("Erro ao carregar client.json:", e);
  }
  return null;
}
export const CLIENT = loadClientConfig();

export const DATA_FILE = path.join(__dirname, "data", "carousels.json");
export const PUBLIC_DIR = path.join(__dirname, "..", "..", "frontend");
export const COMPOSE_SCRIPT = path.join(__dirname, "..", "core", "util", "compose-slide.py");
export const REGEN_SCRIPT = path.join(__dirname, "..", "regen-slide.py");
export const REELS_HISTORY_FILE = path.join(__dirname, "data", "reels_history.json");
export const ZIP_SCRIPT = path.join(__dirname, "..", "zip-carousels.py");

export const generationJobs = new Map();
export const sseClients = new Set();

// Hash helper para senhas
export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper para obter e-mail do Super Admin
export function getSuperAdminEmail() {
  return process.env.DASHBOARD_USER || 'jordao';
}

// Helper para verificar se um e-mail pertence ao Super Admin
export function isUserSuperAdmin(email) {
  const superAdminUser = getSuperAdminEmail();
  return email === superAdminUser || email === 'afonteoculta@gmail.com' || email === 'afonteoculta';
}

// Auth middleware
export function requireAuth(req, res, next) {
  const publicPaths = ['/login.html', '/auth/login', '/auth/logout', '/api/settings/branding', '/register.html', '/api/users/register'];
  if (publicPaths.includes(req.path)) return next();

  if (req.path.startsWith('/api/users/invitations/') && req.path.endsWith('/verify')) {
    return next();
  }

  if (req.session && req.session.authenticated) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Não autenticado' });
  return res.redirect('/login.html');
}

// Middleware para restringir rotas apenas ao Super Admin
export function requireSuperAdmin(req, res, next) {
  if (req.session && req.session.authenticated && isUserSuperAdmin(req.session.user)) {
    return next();
  }
  return res.status(403).json({ error: 'Acesso negado. Apenas o Super Admin tem acesso.' });
}
