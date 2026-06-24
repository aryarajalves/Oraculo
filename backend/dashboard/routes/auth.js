import express from "express";
import { query } from "../db.js";
import { 
  hashPassword, 
  getSuperAdminEmail, 
  isUserSuperAdmin 
} from "../state.js";

const router = express.Router();

// ── Rotas de Auth ─────────────────────────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  // 1. Verifica contra o Super Admin (legados incluídos)
  const superAdminUser = getSuperAdminEmail();
  const superAdminPass = process.env.DASHBOARD_PASS || 'fonteoculta2024';
  
  const isSuper = (username === superAdminUser && password === superAdminPass) ||
                  (username === 'afonteoculta@gmail.com' && password === (process.env.DASHBOARD_PASS2 || 'FonteOculta@2025')) ||
                  (username === 'afonteoculta' && password === (process.env.DASHBOARD_PASS2 || 'FonteOculta@2025'));

  if (isSuper) {
    req.session.authenticated = true;
    req.session.user = username;
    req.session.userName = 'Super Admin';
    req.session.role = 'admin';
    return res.redirect('/');
  }

  // 2. Verifica contra o banco de dados (tabela dashboard_users)
  try {
    const hashedPassword = hashPassword(password);
    const dbUserRes = await query(
      "SELECT * FROM dashboard_users WHERE email = $1 AND password = $2",
      [username, hashedPassword]
    );

    if (dbUserRes.rows.length > 0) {
      const u = dbUserRes.rows[0];
      req.session.authenticated = true;
      req.session.user = u.email;
      req.session.userName = u.name;
      req.session.role = u.role;
      return res.redirect('/');
    }
  } catch (err) {
    console.error("Erro ao validar login no banco:", err);
  }

  return res.redirect('/login.html?error=1');
});

router.get('/auth/logout', (req, res) => {
  req.session = null; // cookie-session: limpa setando null
  res.redirect('/login.html');
});

// Obter usuário atual logado
router.get('/api/me', async (req, res) => {
  if (!req.session || !req.session.authenticated) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  const isSuper = isUserSuperAdmin(req.session.user);
  
  let permissions = {};
  if (isSuper) {
    permissions = {
      carrosseis: 'liberado',
      criador: 'liberado',
      calendario: 'liberado',
      reels: 'liberado',
      fabrica: 'liberado',
      oraculo: 'liberado',
      radar: 'liberado'
    };
  } else {
    try {
      const dbUserRes = await query("SELECT permissions FROM dashboard_users WHERE email = $1", [req.session.user]);
      if (dbUserRes.rows.length > 0) {
        permissions = dbUserRes.rows[0].permissions || {};
      }
    } catch (err) {
      console.error("Erro ao buscar permissões do usuário:", err);
    }
  }

  res.json({
    name: isSuper ? (process.env.DASHBOARD_USER_NAME || 'Super Admin') : (req.session.userName || req.session.user),
    email: req.session.user,
    isSuperAdmin: isSuper,
    role: isSuper ? 'admin' : (req.session.role || 'user'),
    permissions
  });
});

export default router;
