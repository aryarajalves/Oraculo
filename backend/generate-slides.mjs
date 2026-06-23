/**
 * Gerador de Slides — Fonte Oculta
 * Carrossel 3: "Físicos provaram que a pobreza é uma frequência"
 */

const API_KEY = "AIzaSyCd9yWpbmGVJKjTaiQSY4WzATaQ99FVvNA";
const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const OUT_DIR = "/c/Users/julia/Desktop/slides-fonte-oculta";

import fs from "fs";
import path from "path";

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const slides = [
  {
    num: "01",
    title: "A POBREZA É UMA FREQUÊNCIA",
    prompt: `Dark mystical illustration for Instagram. A human silhouette standing in deep dark space, surrounded by concentric golden frequency rings and quantum wave patterns radiating outward. The waves show two states: chaotic red waves labeled 'scarcity' below and harmonious golden waves labeled 'abundance' above. Cosmic particles, deep black background with subtle electric energy. Cinematic, ultra-detailed, spiritual quantum aesthetic. No text. Square 1:1 format.`
  },
  {
    num: "02",
    title: "VOCÊ ATRAI O QUE IRRADIA",
    prompt: `Dark cosmic illustration for Instagram. A glowing human figure at the center of a quantum field, their body emitting visible electromagnetic waves outward. The waves interact with floating geometric shapes representing reality — some dissolve, some solidify based on the frequency. Observer effect visualization. Deep black and dark navy background, electric blue and gold energy. Mystical scientific aesthetic. No text. Square 1:1 format.`
  },
  {
    num: "03",
    title: "SUA FREQUÊNCIA CHEGA ANTES DE VOCÊ",
    prompt: `Dark space illustration for Instagram. Two glowing quantum particles connected by a beam of electric light across vast dark space — quantum entanglement visualization. One particle is gold (abundance frequency), the other silver (receiving). Between them, ripples of energy traveling at light speed. Nobel prize medal subtly integrated. Deep black cosmic background with stars and quantum field lines. Ultra-detailed mystical science art. No text. Square 1:1 format.`
  },
  {
    num: "04",
    title: "40Hz — O ESTADO QUE CRIA RIQUEZA",
    prompt: `Dark mystical illustration for Instagram. A meditating monk figure in lotus position, their brain visible and glowing with gamma frequency waves at 40Hz — shown as golden rippling rings emanating from the mind. Ancient temple meets neuroscience laboratory aesthetic. Brain wave graph subtly visible in background showing gamma state. Deep black background, warm gold and amber tones. Sacred geometry patterns. No text. Square 1:1 format.`
  },
  {
    num: "05",
    title: "FREQUÊNCIA HERDADA",
    prompt: `Dark emotional illustration for Instagram. A DNA double helix stretching vertically, within it trapped ancestral figures — grandparents, parents — their hands reaching downward passing chains of red energy patterns. The chains represent inherited scarcity patterns in epigenetics. At the bottom, a person receiving these patterns unknowingly. Dark teal and deep purple palette, moody and heavy atmosphere. No text. Square 1:1 format.`
  },
  {
    num: "06",
    title: "TECNOLOGIA SONORA",
    prompt: `Dark scientific mystical illustration for Instagram. Two glowing brain hemispheres shown side by side — on the left they are disconnected, fragmented (red/chaotic). In the center, a binaural sound wave (shown as a golden sinusoidal wave) passes through both. On the right, both hemispheres glow and synchronize perfectly in golden light. Sound waves ripple outward. Deep black background with electric blue accents. Neuroscience meets spirituality aesthetic. No text. Square 1:1 format.`
  },
  {
    num: "07",
    title: "FREQUÊNCIA DE PROSPERIDADE",
    prompt: `Dark radiant illustration for Instagram. A glowing human heart at the center, expanding powerful golden electromagnetic field rings outward — the HeartMath field visualization. From the expanding field, golden particles and opportunities are being magnetically attracted inward. Each ring of the field shows: expanded decisions, visible opportunities, abundance frequency. Deep black background, rich gold and warm amber tones, cosmic scale. Cinematic mystical art. No text. Square 1:1 format.`
  },
  {
    num: "08",
    title: "O PORTAL ESTÁ ABERTO",
    prompt: `Dark cinematic illustration for Instagram. A luminous portal made of sound wave rings opens in dark space, emitting golden and white light. A lone human silhouette stands at the threshold looking into the light, on the edge of transformation. Around the portal, quantum frequency patterns and sacred geometry. The atmosphere is silent, powerful, decisive — the moment before change. Deep black background, dramatic light contrast. No text. Square 1:1 format.`
  }
];

async function generateImage(slide) {
  console.log(`\n⏳ Gerando Slide ${slide.num}: ${slide.title}...`);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "x-goog-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: slide.prompt }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Erro Slide ${slide.num}:`, JSON.stringify(data?.error || data).slice(0, 200));
      return null;
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));

    if (!imagePart) {
      console.error(`❌ Nenhuma imagem no Slide ${slide.num}. Resposta:`, JSON.stringify(data).slice(0, 300));
      return null;
    }

    const ext = imagePart.inlineData.mimeType.split("/")[1] || "png";
    const filename = `slide-${slide.num}-${slide.title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")}.${ext}`;
    const filepath = path.join(OUT_DIR, filename);

    fs.writeFileSync(filepath, Buffer.from(imagePart.inlineData.data, "base64"));
    console.log(`✅ Slide ${slide.num} salvo: ${filepath}`);
    return filepath;
  } catch (err) {
    console.error(`❌ Exceção Slide ${slide.num}:`, err.message);
    return null;
  }
}

// Gerar todos os slides (2 em paralelo para não sobrecarregar a API)
const results = [];
for (let i = 0; i < slides.length; i += 2) {
  const batch = slides.slice(i, i + 2);
  const paths = await Promise.all(batch.map(generateImage));
  results.push(...paths);
  if (i + 2 < slides.length) {
    console.log("\n⏱ Aguardando 2s antes do próximo lote...");
    await new Promise(r => setTimeout(r, 2000));
  }
}

console.log("\n\n🎉 CONCLUÍDO!");
console.log(`📁 Imagens salvas em: ${OUT_DIR}`);
console.log(`✅ Sucessos: ${results.filter(Boolean).length}/${slides.length}`);
