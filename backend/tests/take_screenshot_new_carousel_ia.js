import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACT_DIR = 'C:/Users/aryar/.gemini/antigravity/brain/a79e77ff-8ad9-4dfe-ae10-d2f2a1c47023';

async function run() {
  console.log('🚀 Iniciando teste visual de Envio do Carrossel para o Chat (IA)...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 800 });

  page.on('pageerror', exception => {
    console.log(`❌ Page Uncaught Exception: ${exception}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Page Console Error: ${msg.text()}`);
    }
  });

  try {
    // 1. Acessa a página de login
    console.log('🌐 Acessando página de login...');
    await page.goto('http://localhost:5176/login.html');
    await page.waitForTimeout(1000);

    // 2. Preenche os dados de login
    console.log('✍️ Preenchendo credenciais...');
    await page.fill('input[name="username"]', 'aryarajmarketing@gmail.com');
    await page.fill('input[name="password"]', '123456');
    
    console.log('🚪 Clicando no botão de Login...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 3. Clica no botão "+ Novo Carrossel" no sidebar
    console.log('➕ Clicando em "Novo Carrossel" no menu lateral...');
    await page.click('button:has-text("Novo Carrossel")');
    await page.waitForTimeout(2000); // Aguarda troca de aba

    // Captura o input preenchido no chat com o template limpo
    console.log('📸 Salvando captura do template preenchido no input...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'new_carousel_ia_input_prefilled.png') });

    console.log('🎉 Teste visual concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no teste visual:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
