"use strict";

const pptxgen = require("pptxgenjs");

// ─── PALETTE ────────────────────────────────────────────────────────────────
const C = {
  bg:        "080810",
  bgCard:    "10101E",
  bgCard2:   "16162C",
  gold:      "C9A84C",
  goldLight: "E8C86A",
  teal:      "1A9B8C",
  tealLight: "2DC5B5",
  white:     "FFFFFF",
  muted:     "8888AA",
  border:    "1E1E35",
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
const makeShadow = () => ({
  type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.35,
});

const W = 10;      // slide width  (inches)
const H = 5.625;   // slide height (inches)

function slideBase(pres) {
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  return slide;
}

// We'll pass `pres` explicitly
function addDecorativeBars(pres, slide) {
  // top gold bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: W, h: 0.06,
    fill: { color: C.gold }, line: { color: C.gold },
  });
  // bottom teal bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: H - 0.06, w: W, h: 0.06,
    fill: { color: C.teal }, line: { color: C.teal },
  });
  // left vertical gold line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 0, w: 0.03, h: H,
    fill: { color: C.gold }, line: { color: C.gold },
  });
}

// Standard slide title (no decorative line — clean per instructions)
function addTitle(slide, text, opts = {}) {
  slide.addText(text, {
    x: opts.x !== undefined ? opts.x : 0.65,
    y: opts.y !== undefined ? opts.y : 0.18,
    w: opts.w !== undefined ? opts.w : 8.8,
    h: opts.h !== undefined ? opts.h : 0.7,
    fontFace: "Georgia",
    fontSize: opts.fontSize || 22,
    bold: true,
    color: C.gold,
    align: opts.align || "left",
    valign: "middle",
    margin: 0,
  });
}

// ─── SLIDE 01 — CAPA ────────────────────────────────────────────────────────
function slide01(pres) {
  const slide = pres.addSlide();
  slide.background = { color: C.bg };

  // top gold bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: W, h: 0.06,
    fill: { color: C.gold }, line: { color: C.gold },
  });
  // bottom teal bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: H - 0.06, w: W, h: 0.06,
    fill: { color: C.teal }, line: { color: C.teal },
  });
  // left vertical gold line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 0, w: 0.03, h: H,
    fill: { color: C.gold }, line: { color: C.gold },
  });

  // brand label top-left
  slide.addText("Afonteoculta", {
    x: 0.65, y: 0.12, w: 3, h: 0.28,
    fontFace: "Calibri", fontSize: 11, italic: true,
    color: C.muted, align: "left", margin: 0,
  });

  // main title
  slide.addText("SISTEMA AUTÔNOMO\nDE CRIAÇÃO DE CONTEÚDO", {
    x: 0.65, y: 1.05, w: 6.8, h: 2.0,
    fontFace: "Georgia", fontSize: 38, bold: true,
    color: C.gold, align: "left", valign: "top",
  });

  // subtitle
  slide.addText(
    "Como geramos carrosséis virais com inteligência artificial\n— sem aprovação humana em cada etapa",
    {
      x: 0.65, y: 3.15, w: 6.5, h: 0.85,
      fontFace: "Calibri", fontSize: 14,
      color: C.white, align: "left", valign: "top",
    }
  );

  // footer pipeline
  slide.addText(
    "Pipeline de Agentes · Oráculo Revisor · Nano Banana 2 · Visual Style Guide",
    {
      x: 0.65, y: H - 0.52, w: 8, h: 0.32,
      fontFace: "Calibri", fontSize: 10,
      color: C.muted, align: "left", margin: 0,
    }
  );

  // decorative circles right side — teal (outer)
  slide.addShape(pres.shapes.OVAL, {
    x: 7.6, y: 0.5, w: 2.2, h: 2.2,
    fill: { color: C.teal, transparency: 82 },
    line: { color: C.teal, width: 1 },
  });
  // decorative circle — gold (inner)
  slide.addShape(pres.shapes.OVAL, {
    x: 8.1, y: 1.5, w: 1.6, h: 1.6,
    fill: { color: C.gold, transparency: 82 },
    line: { color: C.gold, width: 1 },
  });
}

// ─── SLIDE 02 — O QUE É O SISTEMA ──────────────────────────────────────────
function slide02(pres) {
  const slide = slideBase(pres);
  addDecorativeBars(pres, slide);
  addTitle(slide, "O Sistema de Agentes", { fontSize: 20 });

  // subtitle
  slide.addText(
    "Um sistema de agentes que cria, revisa e publica conteúdo sem aprovação em cada etapa",
    {
      x: 0.65, y: 0.88, w: 8.8, h: 0.38,
      fontFace: "Calibri", fontSize: 12, color: C.white,
      align: "left", margin: 0,
    }
  );

  // 3 column cards
  const cols = [
    {
      title: "COPY", icon: "✍", titleColor: C.gold,
      body: "Hook Forge · Humanizer · Copy Squad criam a narrativa completa com gatilhos psicológicos calibrados",
    },
    {
      title: "REVISÃO", icon: "✓", titleColor: C.teal,
      body: "Oráculo Revisor avalia 5 critérios com pontuação 1-3 cada. Aprova, reescreve ou escala para humano",
    },
    {
      title: "VISUAL", icon: "★", titleColor: C.gold,
      body: "Prompt Engineer → Nano Banana 2 → Design Compositor. Imagem + texto compostos automaticamente",
    },
  ];

  const cardW = 2.8;
  const cardH = 2.8;
  const cardY = 1.4;
  const startX = 0.65;
  const gap = 0.25;

  cols.forEach((col, i) => {
    const x = startX + i * (cardW + gap);

    // card bg
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: cardY, w: cardW, h: cardH,
      fill: { color: C.bgCard2 },
      line: { color: col.titleColor, width: 1.5 },
      shadow: makeShadow(),
    });

    // top accent bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: cardY, w: cardW, h: 0.06,
      fill: { color: col.titleColor },
      line: { color: col.titleColor },
    });

    // icon
    slide.addText(col.icon, {
      x, y: cardY + 0.15, w: cardW, h: 0.5,
      fontFace: "Calibri", fontSize: 26,
      color: col.titleColor, align: "center", margin: 0,
    });

    // title
    slide.addText(col.title, {
      x, y: cardY + 0.7, w: cardW, h: 0.38,
      fontFace: "Georgia", fontSize: 16, bold: true,
      color: col.titleColor, align: "center", margin: 0,
    });

    // body
    slide.addText(col.body, {
      x: x + 0.15, y: cardY + 1.15, w: cardW - 0.3, h: 1.5,
      fontFace: "Calibri", fontSize: 11,
      color: C.white, align: "center", valign: "top",
    });
  });

  // result footer bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.65, y: 4.55, w: 8.7, h: 0.42,
    fill: { color: C.bgCard }, line: { color: C.gold, width: 1 },
  });
  slide.addText(
    "Resultado: carrosséis prontos para publicar, com score de qualidade documentado",
    {
      x: 0.75, y: 4.55, w: 8.5, h: 0.42,
      fontFace: "Calibri", fontSize: 11, bold: true,
      color: C.gold, align: "center", valign: "middle", margin: 0,
    }
  );
}

// ─── SLIDE 03 — PIPELINE COMPLETO ──────────────────────────────────────────
function slide03(pres) {
  const slide = slideBase(pres);
  addDecorativeBars(pres, slide);
  addTitle(slide, "Pipeline de Produção — Da ideia ao carrossel publicado", { fontSize: 18 });

  // Helper to draw a flow box
  function flowBox(x, y, label, borderColor) {
    const bw = 1.55, bh = 0.42;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: bw, h: bh,
      fill: { color: C.bgCard2 },
      line: { color: borderColor, width: 1.5 },
    });
    slide.addText(label, {
      x, y, w: bw, h: bh,
      fontFace: "Calibri", fontSize: 9, bold: true,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
  }

  // Arrow helper (horizontal)
  function arrowH(x, y) {
    slide.addShape(pres.shapes.LINE, {
      x, y, w: 0.22, h: 0,
      line: { color: C.muted, width: 1.5, endArrowType: "arrow" },
    });
  }

  // Arrow helper (vertical down)
  function arrowV(x, y) {
    slide.addShape(pres.shapes.LINE, {
      x, y, w: 0, h: 0.2,
      line: { color: C.muted, width: 1.5, endArrowType: "arrow" },
    });
  }

  // ── Row 1: Copy ──
  const row1y = 0.98;
  const boxes1 = ["TEMA", "COPY SQUAD", "HOOK FORGE", "HUMANIZER"];
  const bw = 1.55, gap = 0.22;
  const startX1 = 0.65;

  boxes1.forEach((lbl, i) => {
    const x = startX1 + i * (bw + gap);
    flowBox(x, row1y, lbl, C.gold);
    if (i < boxes1.length - 1) arrowH(x + bw, row1y + 0.21);
  });

  // Row 1 label
  slide.addText("COPY", {
    x: 9.0, y: row1y, w: 0.9, h: 0.42,
    fontFace: "Calibri", fontSize: 9, italic: true,
    color: C.gold, align: "right", valign: "middle", margin: 0,
  });

  // ── Arrow down from HUMANIZER to ORÁCULO ──
  const humanizerX = startX1 + 3 * (bw + gap) + bw / 2 - 0.01;
  const row2y = 1.85;
  slide.addShape(pres.shapes.LINE, {
    x: humanizerX, y: row1y + 0.42, w: 0, h: 0.25,
    line: { color: C.muted, width: 1.5, endArrowType: "arrow" },
  });

  // ── Row 2: Revisão ──
  const oraculoX = startX1 + 3 * (bw + gap);
  flowBox(oraculoX, row2y, "ORÁCULO REVISOR", C.teal);

  // Decision branches
  // APROVADO (score 12-15)
  const aprovX = startX1 + 1 * (bw + gap);
  flowBox(aprovX, row2y, "✓ APROVADO\n(score 12-15)", C.tealLight);

  // Arrow from ORÁCULO to APROVADO (left arrow)
  slide.addShape(pres.shapes.LINE, {
    x: aprovX + bw, y: row2y + 0.21, w: oraculoX - aprovX - bw, h: 0,
    line: { color: C.teal, width: 1.5, endArrowType: "arrow" },
  });

  // REESCRITA
  const reesX = startX1 + 2 * (bw + gap);
  flowBox(reesX, row2y + 0.7, "↩ REESCRITA\n(score 8-11, máx 2x)", C.gold);
  slide.addShape(pres.shapes.LINE, {
    x: reesX + bw / 2, y: row2y + 0.42, w: 0, h: 0.28,
    line: { color: C.gold, width: 1.2, endArrowType: "arrow" },
  });

  // ESCALA
  const escX = startX1 + 3 * (bw + gap);
  flowBox(escX, row2y + 0.7, "⚠ ESCALA\n(score <8, humano)", "FF6B6B");
  slide.addShape(pres.shapes.LINE, {
    x: escX + bw / 2, y: row2y + 0.42, w: 0, h: 0.28,
    line: { color: "FF6B6B", width: 1.2, endArrowType: "arrow" },
  });

  // Row 2 label
  slide.addText("REVISÃO", {
    x: 9.0, y: row2y, w: 0.9, h: 0.42,
    fontFace: "Calibri", fontSize: 9, italic: true,
    color: C.teal, align: "right", valign: "middle", margin: 0,
  });

  // ── Row 3: Visual ──
  const row3y = 3.55;
  const boxes3 = ["APROVADO", "PROMPT ENG.", "NANO BANANA 2", "DESIGN COMP.", "NOÇÃO + DASH"];
  const bw3 = 1.5, gap3 = 0.15;
  const startX3 = 0.6;

  // Arrow from APROVADO (row2) down to row3
  const aprovMidX = aprovX + bw / 2;
  slide.addShape(pres.shapes.LINE, {
    x: aprovMidX, y: row2y + 0.42, w: 0, h: row3y - row2y - 0.42,
    line: { color: C.muted, width: 1.5, endArrowType: "arrow" },
  });

  boxes3.forEach((lbl, i) => {
    const x = startX3 + i * (bw3 + gap3);
    const borderC = i === 0 ? C.tealLight : i < 3 ? C.goldLight : C.teal;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: row3y, w: bw3, h: 0.42,
      fill: { color: C.bgCard2 },
      line: { color: borderC, width: 1.5 },
    });
    slide.addText(lbl, {
      x, y: row3y, w: bw3, h: 0.42,
      fontFace: "Calibri", fontSize: 8.5, bold: true,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
    if (i < boxes3.length - 1) {
      slide.addShape(pres.shapes.LINE, {
        x: x + bw3, y: row3y + 0.21, w: gap3, h: 0,
        line: { color: C.muted, width: 1.5, endArrowType: "arrow" },
      });
    }
  });

  // Row 3 label
  slide.addText("VISUAL", {
    x: 9.0, y: row3y, w: 0.9, h: 0.42,
    fontFace: "Calibri", fontSize: 9, italic: true,
    color: C.goldLight, align: "right", valign: "middle", margin: 0,
  });
}

// ─── SLIDE 04 — OS AGENTES ──────────────────────────────────────────────────
function slide04(pres) {
  const slide = slideBase(pres);
  addDecorativeBars(pres, slide);
  addTitle(slide, "Os Agentes e suas Funções", { fontSize: 21 });

  const agents = [
    {
      name: "COPY SQUAD", border: C.gold,
      body: "Escreve os 10 slides com narrativa completa, arco emocional e 15 gatilhos psicológicos calibrados para o avatar.",
    },
    {
      name: "HOOK FORGE", border: C.teal,
      body: "Gera 3 variações de gancho (Paradoxo / Confronto Direto / Inversão de Crença) e seleciona o mais forte.",
    },
    {
      name: "HUMANIZER", border: C.gold,
      body: "Remove traços de IA: elimina travessões, linguagem distante e estruturas artificiais. Mantém voz conectiva.",
    },
    {
      name: "ORÁCULO REVISOR", border: C.teal,
      body: "Avalia 5 critérios com score 1-3 cada. Total 15pts. Aprova autônomo acima de 12. Sem aprovação humana.",
    },
    {
      name: "PROMPT ENGINEER", border: C.gold,
      body: "Transforma o conceito de cada slide em prompt cinematográfico para o Nano Banana 2. Estética dark, minimalista.",
    },
    {
      name: "NANO BANANA 2", border: C.tealLight,
      body: "Modelo Gemini gemini-2.0-flash-exp-image-generation. Gera imagem dark cinematográfica por slide.",
    },
  ];

  const cardW = 2.85, cardH = 1.55;
  const colGap = 0.22, rowGap = 0.18;
  const startX = 0.65, startY = 1.05;

  agents.forEach((ag, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = startX + col * (cardW + colGap);
    const y = startY + row * (cardH + rowGap);

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: cardW, h: cardH,
      fill: { color: C.bgCard2 },
      line: { color: ag.border, width: 1.5 },
      shadow: makeShadow(),
    });

    // left accent bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.06, h: cardH,
      fill: { color: ag.border },
      line: { color: ag.border },
    });

    slide.addText(ag.name, {
      x: x + 0.15, y: y + 0.1, w: cardW - 0.2, h: 0.35,
      fontFace: "Georgia", fontSize: 13, bold: true,
      color: ag.border, align: "left", margin: 0,
    });

    slide.addText(ag.body, {
      x: x + 0.15, y: y + 0.48, w: cardW - 0.25, h: cardH - 0.58,
      fontFace: "Calibri", fontSize: 11,
      color: C.white, align: "left", valign: "top",
    });
  });
}

// ─── SLIDE 05 — ORÁCULO REVISOR ─────────────────────────────────────────────
function slide05(pres) {
  const slide = slideBase(pres);
  addDecorativeBars(pres, slide);
  addTitle(slide, "Oráculo Revisor — Sistema de Avaliação Autônoma", { fontSize: 19 });

  slide.addText("5 critérios · Score 1-3 cada · Total 15 pts · Decisão automática", {
    x: 0.65, y: 0.85, w: 8.8, h: 0.32,
    fontFace: "Calibri", fontSize: 12, italic: true,
    color: C.muted, align: "left", margin: 0,
  });

  // Criteria table
  const headers = [
    { text: "#", options: { fill: { color: C.bgCard }, color: C.gold, bold: true, fontSize: 11 } },
    { text: "Critério", options: { fill: { color: C.bgCard }, color: C.gold, bold: true, fontSize: 11 } },
    { text: "O que avalia", options: { fill: { color: C.bgCard }, color: C.gold, bold: true, fontSize: 11 } },
    { text: "Score", options: { fill: { color: C.bgCard }, color: C.gold, bold: true, fontSize: 11 } },
  ];

  const rows = [
    ["C1", "Gancho Paradoxal", "Provoca crença do seguidor com tensão real", "1-3"],
    ["C2", "Arco Emocional 10 slides", "Validação → Confronto → Revelação → Esperança", "1-3"],
    ["C3", "Raiva Coletiva", "Nomeia o sistema/instituição que sabotou", "1-3"],
    ["C4", 'CTA Tribal "Comente FONTE se..."', "Verbaliza experiência interna específica", "1-3"],
    ["C5", "Slide 10 três camadas", "Cristalização + Ativação Tribal + Portal Sutil", "1-3"],
  ];

  const tableData = [
    headers,
    ...rows.map((r, ri) => {
      const bg = ri % 2 === 0 ? C.bgCard : C.bgCard2;
      return r.map((cell) => ({
        text: cell,
        options: { fill: { color: bg }, color: C.white, fontSize: 10 },
      }));
    }),
  ];

  slide.addTable(tableData, {
    x: 0.65, y: 1.25, w: 8.7,
    border: { pt: 0.5, color: C.border },
    colW: [0.5, 2.1, 4.5, 0.9],
    rowH: 0.38,
  });

  // Decision table
  const decisionY = 3.68;
  slide.addText("Tabela de Decisão", {
    x: 0.65, y: decisionY - 0.28, w: 8.7, h: 0.26,
    fontFace: "Calibri", fontSize: 11, bold: true,
    color: C.gold, align: "left", margin: 0,
  });

  const decisions = [
    { range: "12-15 pts", action: "APROVADO", detail: "Segue para imagens", bg: "0D4F2E", border: "2ECC71" },
    { range: "8-11 pts", action: "REESCRITA", detail: "Volta para Copy Squad (máx 2x)", bg: "4F3A0A", border: C.gold },
    { range: "<8 pts", action: "ESCALA", detail: "Revisão humana obrigatória", bg: "4F0D0D", border: "FF4444" },
  ];

  const dw = 2.8, dh = 0.72;
  decisions.forEach((d, i) => {
    const x = 0.65 + i * (dw + 0.18);
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: decisionY, w: dw, h: dh,
      fill: { color: d.bg },
      line: { color: d.border, width: 1.5 },
    });
    slide.addText([
      { text: d.range + " → ", options: { bold: true, color: d.border, fontSize: 12 } },
      { text: d.action, options: { bold: true, color: C.white, fontSize: 12, breakLine: true } },
      { text: d.detail, options: { color: C.muted, fontSize: 10 } },
    ], {
      x: x + 0.1, y: decisionY, w: dw - 0.2, h: dh,
      fontFace: "Calibri", valign: "middle",
    });
  });
}

// ─── SLIDE 06 — NANO BANANA 2 ───────────────────────────────────────────────
function slide06(pres) {
  const slide = slideBase(pres);
  addDecorativeBars(pres, slide);
  addTitle(slide, "Geração de Imagem — Do Conceito ao Visual Cinematográfico", { fontSize: 18 });

  // Left column — Prompt Engineer
  const colW = 4.1, colH = 3.4, colY = 1.0;
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.65, y: colY, w: colW, h: colH,
    fill: { color: C.bgCard2 },
    line: { color: C.gold, width: 1.5 },
    shadow: makeShadow(),
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.65, y: colY, w: colW, h: 0.06,
    fill: { color: C.gold }, line: { color: C.gold },
  });
  slide.addText("Prompt Engineer", {
    x: 0.65, y: colY + 0.12, w: colW, h: 0.36,
    fontFace: "Georgia", fontSize: 15, bold: true,
    color: C.gold, align: "center", margin: 0,
  });
  slide.addText([
    { text: "Recebe: ", options: { bold: true, color: C.gold } },
    { text: "conceito do slide + tema", options: { color: C.white, breakLine: true } },
    { text: "Aplica: ", options: { bold: true, color: C.gold } },
    { text: "Visual Style Guide (DNA da marca)", options: { color: C.white, breakLine: true } },
    { text: "Prefixo obrigatório:", options: { bold: true, color: C.muted, breakLine: true } },
    { text: '"Dark cinematic mystical illustration, single focal point, minimalist..."', options: { italic: true, color: C.muted, fontSize: 10, breakLine: true } },
    { text: "Sufixo: ", options: { bold: true, color: C.muted } },
    { text: '"No text, no words, no letters visible..."', options: { italic: true, color: C.muted, fontSize: 10, breakLine: true } },
    { text: "Output: ", options: { bold: true, color: C.gold } },
    { text: "prompt específico por slide", options: { color: C.white } },
  ], {
    x: 0.8, y: colY + 0.55, w: colW - 0.3, h: colH - 0.65,
    fontFace: "Calibri", fontSize: 11, valign: "top",
  });

  // Right column — Nano Banana 2
  const rightX = 5.2;
  slide.addShape(pres.shapes.RECTANGLE, {
    x: rightX, y: colY, w: colW, h: colH,
    fill: { color: C.bgCard2 },
    line: { color: C.teal, width: 1.5 },
    shadow: makeShadow(),
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: rightX, y: colY, w: colW, h: 0.06,
    fill: { color: C.teal }, line: { color: C.teal },
  });
  slide.addText("Nano Banana 2", {
    x: rightX, y: colY + 0.12, w: colW, h: 0.36,
    fontFace: "Georgia", fontSize: 15, bold: true,
    color: C.teal, align: "center", margin: 0,
  });
  slide.addText([
    { text: "Modelo: ", options: { bold: true, color: C.teal } },
    { text: "gemini-2.0-flash-exp-image-generation", options: { color: C.white, breakLine: true } },
    { text: "API: ", options: { bold: true, color: C.teal } },
    { text: "Google Generative Language", options: { color: C.white, breakLine: true } },
    { text: "Retry: ", options: { bold: true, color: C.teal } },
    { text: "4 tentativas com backoff exponencial", options: { color: C.white, breakLine: true } },
    { text: "Output: ", options: { bold: true, color: C.teal } },
    { text: "imagem 1080x1350px (formato 4:5 Instagram)", options: { color: C.white, breakLine: true } },
    { text: "Composição: ", options: { bold: true, color: C.teal } },
    { text: "Design Compositor (Python + Pillow)", options: { color: C.white } },
  ], {
    x: rightX + 0.15, y: colY + 0.55, w: colW - 0.25, h: colH - 0.65,
    fontFace: "Calibri", fontSize: 11, valign: "top",
  });

  // Gold footer box
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.65, y: 4.52, w: 8.7, h: 0.52,
    fill: { color: C.bgCard },
    line: { color: C.gold, width: 1.5 },
  });
  slide.addText(
    "Resultado: imagem dark cinematográfica + texto com margens corretas (MARGIN=92px) + marca d'água dupla",
    {
      x: 0.75, y: 4.52, w: 8.5, h: 0.52,
      fontFace: "Calibri", fontSize: 11, bold: true,
      color: C.gold, align: "center", valign: "middle", margin: 0,
    }
  );
}

// ─── SLIDE 07 — LIÇÕES DO CARROSSEL DE 1M+ ──────────────────────────────────
function slide07(pres) {
  const slide = slideBase(pres);
  addDecorativeBars(pres, slide);
  addTitle(slide, "A Fórmula do Carrossel Viral — Lições de 1M+ visualizações", { fontSize: 18 });

  const discoveries = [
    {
      title: "COLAGEM, NÃO IA PURA",
      body: "Os slides mais impactantes combinam foto real P&B + overlay geométrico colorido. Não imagem 100% gerada por IA.",
      border: C.gold,
    },
    {
      title: "COLISÃO DE DOIS MUNDOS",
      body: "O gancho une duas verdades que o seguidor conhece mas nunca conectou. 'O que X chama de A, Y chama de B.'",
      border: C.teal,
    },
    {
      title: "FRASE DEVASTADORA",
      body: "Todo carrossel viral tem um slide curto e impactante — a linha que vai nos stories de outras pessoas.",
      border: C.gold,
    },
    {
      title: "RICH TEXT NO CORPO",
      body: "Alternância de bold + italic dentro do parágrafo cria hierarquia de atenção e mantém o olho em movimento.",
      border: C.teal,
    },
  ];

  const cardW = 4.25, cardH = 1.65;
  const gap = 0.18;
  const startX = 0.65, startY = 1.05;

  discoveries.forEach((d, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = startX + col * (cardW + gap);
    const y = startY + row * (cardH + gap);

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: cardW, h: cardH,
      fill: { color: C.bgCard2 },
      line: { color: d.border, width: 1.5 },
      shadow: makeShadow(),
    });

    // top accent
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: cardW, h: 0.06,
      fill: { color: d.border }, line: { color: d.border },
    });

    slide.addText(d.title, {
      x: x + 0.15, y: y + 0.12, w: cardW - 0.25, h: 0.38,
      fontFace: "Georgia", fontSize: 13, bold: true,
      color: d.border, align: "left", margin: 0,
    });

    slide.addText(d.body, {
      x: x + 0.15, y: y + 0.55, w: cardW - 0.25, h: cardH - 0.65,
      fontFace: "Calibri", fontSize: 11,
      color: C.white, align: "left", valign: "top",
    });
  });

  // footer
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.65, y: 4.78, w: 8.7, h: 0.32,
    fill: { color: C.bgCard }, line: { color: C.teal, width: 1 },
  });
  slide.addText(
    "40k compartilhamentos · 1M+ visualizações · Tema: O que a Bíblia chama de Verbo, a Física chama de Frequência",
    {
      x: 0.75, y: 4.78, w: 8.5, h: 0.32,
      fontFace: "Calibri", fontSize: 9.5, italic: true,
      color: C.muted, align: "center", valign: "middle", margin: 0,
    }
  );
}

// ─── SLIDE 08 — ANATOMIA DO CARROSSEL ────────────────────────────────────────
function slide08(pres) {
  const slide = slideBase(pres);
  addDecorativeBars(pres, slide);
  addTitle(slide, "Estrutura Narrativa — A Função de Cada Posição", { fontSize: 19 });

  const structure = [
    ["01", "Gancho Paradoxal", "Colisão de dois mundos — o cérebro não categoriza rápido, para"],
    ["02", "Validação Silenciosa", '"Foi escrito pra mim" — nomeia o que o seguidor sente mas não articula'],
    ["03", "O Que Te Ensinaram", "Nomeia a mentira — ativa cortisol, tensão sem escape"],
    ["04", "Raiva Coletiva", "Nomeia o culpado — direciona a raiva, gera identificação tribal"],
    ["05", "A Prova Científica", '"Então não era loucura minha" — valida a intuição que já existia'],
    ["06", "O Mecanismo", "Explica como funciona — sensação de acesso a algo oculto"],
    ["07", "A Ponte Sagrada", "Une ciência + espiritualidade — reconciliação cognitiva"],
    ["08", "O Impacto Real", "Sai do abstrato — o seguidor se vê na narrativa"],
    ["09", "A Aplicação", "Transforma insight em comportamento — sensação de controle"],
    ["10", "Cristalização + CTA", 'Frase devastadora + "Comente FONTE se..." — alimenta o algoritmo'],
  ];

  const header = [
    { text: "Pos.", options: { fill: { color: C.bgCard }, color: C.gold, bold: true, fontSize: 10 } },
    { text: "Função", options: { fill: { color: C.bgCard }, color: C.gold, bold: true, fontSize: 10 } },
    { text: "Por que funciona", options: { fill: { color: C.bgCard }, color: C.gold, bold: true, fontSize: 10 } },
  ];

  const tableData = [
    header,
    ...structure.map((r, ri) => {
      const bg = ri % 2 === 0 ? C.bgCard : C.bgCard2;
      return [
        { text: r[0], options: { fill: { color: bg }, color: C.gold, bold: true, fontSize: 10, align: "center" } },
        { text: r[1], options: { fill: { color: bg }, color: C.white, bold: true, fontSize: 10 } },
        { text: r[2], options: { fill: { color: bg }, color: C.white, fontSize: 10 } },
      ];
    }),
  ];

  slide.addTable(tableData, {
    x: 0.65, y: 0.98, w: 8.7,
    border: { pt: 0.5, color: C.border },
    colW: [0.55, 2.1, 6.05],
    rowH: 0.39,
  });
}

// ─── SLIDE 09 — OS 10 NOVOS TEMAS ───────────────────────────────────────────
function slide09(pres) {
  const slide = slideBase(pres);
  addDecorativeBars(pres, slide);
  addTitle(slide, "10 Temas Desenvolvidos — Prontos para Produção", { fontSize: 20 });

  const left = [
    { n: "1", title: "O Diabo e o Ego", phrase: "Você não está possuído. Está programado." },
    { n: "2", title: "O Placebo e a Mente", phrase: "O remédio mais poderoso é a crença." },
    { n: "3", title: "A Ansiedade e o Despertar", phrase: "Você não está doente. Está acordando." },
    { n: "4", title: "À Imagem e Semelhança", phrase: "Você foi criado para criar. Te ensinaram a pedir permissão." },
    { n: "5", title: "O Karma e a Epigenética", phrase: "Karma não é dívida. É herança reescrevível." },
  ];

  const right = [
    { n: "6", title: "A Emoção e o Campo", phrase: "O passado está no seu corpo como frequência." },
    { n: "7", title: "A Intuição e os 11M bits", phrase: "Você trocou 11M bits por 50. E chamou de bom senso." },
    { n: "8", title: "O Entrelaçamento e a Conexão", phrase: "A separação não é real na física." },
    { n: "9", title: "O TDAH e o Processamento", phrase: "Foram eles que precisavam de diagnóstico." },
    { n: "10", title: "O Vazio e a Memória de Unidade", phrase: "O vazio não é o que falta. É o que sobrou." },
  ];

  const colW = 4.25;
  const leftX = 0.65, rightX = 5.2;
  const startY = 1.0, itemH = 0.76, gap = 0.08;

  function renderThemes(themes, x) {
    themes.forEach((t, i) => {
      const y = startY + i * (itemH + gap);

      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: colW, h: itemH,
        fill: { color: C.bgCard2 },
        line: { color: C.border, width: 0.75 },
      });

      // number
      slide.addText(t.n, {
        x: x + 0.08, y, w: 0.38, h: itemH,
        fontFace: "Georgia", fontSize: 14, bold: true,
        color: C.gold, align: "center", valign: "middle", margin: 0,
      });

      // title
      slide.addText(t.title, {
        x: x + 0.5, y: y + 0.06, w: colW - 0.6, h: 0.34,
        fontFace: "Calibri", fontSize: 11, bold: true,
        color: C.white, align: "left", valign: "top", margin: 0,
      });

      // phrase
      slide.addText(t.phrase, {
        x: x + 0.5, y: y + 0.38, w: colW - 0.6, h: 0.32,
        fontFace: "Calibri", fontSize: 10, italic: true,
        color: C.muted, align: "left", valign: "top", margin: 0,
      });
    });
  }

  renderThemes(left, leftX);
  renderThemes(right, rightX);
}

// ─── SLIDE 10 — RESULTADOS PRODUZIDOS ───────────────────────────────────────
function slide10(pres) {
  const slide = slideBase(pres);
  addDecorativeBars(pres, slide);
  addTitle(slide, "Carrosséis Produzidos — Score do Oráculo Revisor", { fontSize: 19 });

  const carousels = [
    ["01", "Glândula Pineal", "—", "Concluído"],
    ["02", "Oração = Reconfiguração Neural", "—", "Concluído"],
    ["03", "Einstein + Campo Unificado", "—", "Concluído"],
    ["04", "Identidade Vibracional", "—", "Concluído"],
    ["05", "Memórias como Frequência", "15/15", "✓ Aprovado"],
    ["06", "Cabala + Neurociência", "14/15", "✓ Aprovado"],
    ["07", "Neville Goddard", "15/15", "✓ Aprovado"],
    ["08", "Memórias como Frequência", "15/15", "✓ Aprovado"],
  ];

  const header = [
    { text: "#", options: { fill: { color: C.bgCard }, color: C.gold, bold: true, fontSize: 11, align: "center" } },
    { text: "Carrossel", options: { fill: { color: C.bgCard }, color: C.gold, bold: true, fontSize: 11 } },
    { text: "Tema", options: { fill: { color: C.bgCard }, color: C.gold, bold: true, fontSize: 11 } },
    { text: "Score", options: { fill: { color: C.bgCard }, color: C.gold, bold: true, fontSize: 11, align: "center" } },
    { text: "Status", options: { fill: { color: C.bgCard }, color: C.gold, bold: true, fontSize: 11 } },
  ];

  const tableData = [
    header,
    ...carousels.map((r, ri) => {
      const bg = ri % 2 === 0 ? C.bgCard : C.bgCard2;
      const scoreColor = r[2] === "15/15" ? "2ECC71" : r[2] === "14/15" ? C.goldLight : C.muted;
      const statusColor = r[3].includes("Aprovado") ? "2ECC71" : C.muted;
      return [
        { text: r[0], options: { fill: { color: bg }, color: C.muted, fontSize: 10, align: "center" } },
        { text: r[1], options: { fill: { color: bg }, color: C.white, bold: true, fontSize: 10 } },
        { text: r[2], options: { fill: { color: bg }, color: C.white, fontSize: 10 } },
        { text: r[3], options: { fill: { color: bg }, color: scoreColor, bold: true, fontSize: 10, align: "center" } },
        { text: r[4], options: { fill: { color: bg }, color: statusColor, fontSize: 10 } },
      ];
    }),
  ];

  slide.addTable(tableData, {
    x: 0.65, y: 1.0, w: 8.7,
    border: { pt: 0.5, color: C.border },
    colW: [0.5, 1.5, 3.5, 1.0, 2.2],
    rowH: 0.4,
  });

  // highlight box
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.65, y: 4.58, w: 8.7, h: 0.44,
    fill: { color: "0D4F2E" },
    line: { color: "2ECC71", width: 1.5 },
  });
  slide.addText("3 carrosséis consecutivos com 15/15 — máxima qualidade autônoma", {
    x: 0.75, y: 4.58, w: 8.5, h: 0.44,
    fontFace: "Calibri", fontSize: 12, bold: true,
    color: "2ECC71", align: "center", valign: "middle", margin: 0,
  });
}

// ─── SLIDE 11 — INFRAESTRUTURA TÉCNICA ──────────────────────────────────────
function slide11(pres) {
  const slide = slideBase(pres);
  addDecorativeBars(pres, slide);
  addTitle(slide, "A Infraestrutura Técnica por Trás do Sistema", { fontSize: 20 });

  const cols = [
    {
      title: "GERAÇÃO",
      titleColor: C.gold,
      items: [
        "Python + Pillow (composição)",
        "Google Gemini API (imagem)",
        "compose_util.py (margens, fontes)",
        "MARGIN: 92px · Canvas: 1080x1350",
      ],
    },
    {
      title: "DADOS",
      titleColor: C.teal,
      items: [
        "Node.js + Express (dashboard)",
        "JSON flat store (carousels.json)",
        "Filesystem de imagens",
        "API REST para CRUD",
      ],
    },
    {
      title: "INTERFACE",
      titleColor: C.goldLight,
      items: [
        "Dashboard web (porta 3131)",
        "Download por slide ou total",
        "Edição de texto por slide",
        "Regeneração de imagem por slide",
      ],
    },
  ];

  const cardW = 2.8, cardH = 3.2;
  const gap = 0.28;
  const startX = 0.65, startY = 1.05;

  cols.forEach((col, i) => {
    const x = startX + i * (cardW + gap);

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: startY, w: cardW, h: cardH,
      fill: { color: C.bgCard2 },
      line: { color: col.titleColor, width: 1.5 },
      shadow: makeShadow(),
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: startY, w: cardW, h: 0.06,
      fill: { color: col.titleColor }, line: { color: col.titleColor },
    });

    slide.addText(col.title, {
      x, y: startY + 0.1, w: cardW, h: 0.4,
      fontFace: "Georgia", fontSize: 15, bold: true,
      color: col.titleColor, align: "center", margin: 0,
    });

    slide.addText(
      col.items.map((item, idx) => ({
        text: item,
        options: { bullet: true, breakLine: idx < col.items.length - 1 },
      })),
      {
        x: x + 0.15, y: startY + 0.6, w: cardW - 0.25, h: cardH - 0.7,
        fontFace: "Calibri", fontSize: 11,
        color: C.white, align: "left", valign: "top",
      }
    );
  });
}

// ─── SLIDE 12 — PRÓXIMOS PASSOS ──────────────────────────────────────────────
function slide12(pres) {
  const slide = slideBase(pres);
  addDecorativeBars(pres, slide);
  addTitle(slide, "Próximos Passos — Roadmap", { fontSize: 22 });

  const steps = [
    { n: "1", label: "PRODUÇÃO", detail: "Gerar os 10 novos carrosséis com estrutura de 10 slides", color: C.gold },
    { n: "2", label: "VISUAL", detail: "Implementar estilo de colagem fotográfica nos prompts de imagem", color: C.teal },
    { n: "3", label: "DASHBOARD", detail: "Download por slide + edição de texto + regeneração de imagem", color: C.gold },
    { n: "4", label: "ESCALA", detail: "Automação de publicação no Instagram via API", color: C.teal },
    { n: "5", label: "ANÁLISE", detail: "Tracking de métricas por carrossel (alcance, saves, compartilhamentos)", color: C.goldLight },
  ];

  const cardH = 0.72, gap = 0.14;
  const startY = 1.05, cardW = 8.7;

  steps.forEach((s, i) => {
    const y = startY + i * (cardH + gap);

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.65, y, w: cardW, h: cardH,
      fill: { color: C.bgCard2 },
      line: { color: s.color, width: 1 },
    });

    // number circle
    slide.addShape(pres.shapes.OVAL, {
      x: 0.72, y: y + 0.12, w: 0.48, h: 0.48,
      fill: { color: s.color }, line: { color: s.color },
    });
    slide.addText(s.n, {
      x: 0.72, y: y + 0.12, w: 0.48, h: 0.48,
      fontFace: "Georgia", fontSize: 13, bold: true,
      color: C.bg, align: "center", valign: "middle", margin: 0,
    });

    // label
    slide.addText(s.label, {
      x: 1.32, y: y + 0.06, w: 1.8, h: 0.36,
      fontFace: "Georgia", fontSize: 13, bold: true,
      color: s.color, align: "left", valign: "middle", margin: 0,
    });

    // detail
    slide.addText(s.detail, {
      x: 1.32, y: y + 0.38, w: cardW - 0.85, h: 0.3,
      fontFace: "Calibri", fontSize: 11,
      color: C.white, align: "left", valign: "top", margin: 0,
    });
  });

  // final quote
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.65, y: 4.88, w: 8.7, h: 0.38,
    fill: { color: C.bgCard }, line: { color: C.gold, width: 1 },
  });
  slide.addText(
    "O sistema não substitui a criatividade humana. Ele a escala.",
    {
      x: 0.75, y: 4.88, w: 8.5, h: 0.38,
      fontFace: "Georgia", fontSize: 13, italic: true, bold: true,
      color: C.gold, align: "center", valign: "middle", margin: 0,
    }
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Afonteoculta";
  pres.title = "Sistema Autônomo de Criação de Conteúdo";

  console.log("Building slides...");
  slide01(pres);
  console.log("  Slide 01 — Capa ✓");
  slide02(pres);
  console.log("  Slide 02 — O que é o sistema ✓");
  slide03(pres);
  console.log("  Slide 03 — Pipeline completo ✓");
  slide04(pres);
  console.log("  Slide 04 — Os Agentes ✓");
  slide05(pres);
  console.log("  Slide 05 — Oráculo Revisor ✓");
  slide06(pres);
  console.log("  Slide 06 — Nano Banana 2 ✓");
  slide07(pres);
  console.log("  Slide 07 — Lições 1M+ ✓");
  slide08(pres);
  console.log("  Slide 08 — Anatomia do Carrossel ✓");
  slide09(pres);
  console.log("  Slide 09 — 10 Novos Temas ✓");
  slide10(pres);
  console.log("  Slide 10 — Resultados Produzidos ✓");
  slide11(pres);
  console.log("  Slide 11 — Infraestrutura ✓");
  slide12(pres);
  console.log("  Slide 12 — Próximos Passos ✓");

  const outPath = "C:/Users/julia/nano-banana-mcp/presentation/SistemaConteudo-Afonteoculta.pptx";
  await pres.writeFile({ fileName: outPath });
  console.log(`\nPresentation saved to:\n  ${outPath}`);
}

main().catch((err) => {
  console.error("Error generating presentation:", err);
  process.exit(1);
});
