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
    
    // 3. Abre o modal "+ Novo Carrossel"
    console.log('➕ Abrindo modal de Novo Carrossel...');
    await page.click('button:has-text("Novo Carrossel")');
    await page.waitForTimeout(1000);

    // 4. Preenche os dados do carrossel
    console.log('✍️ Preenchendo campos do formulário...');
    await page.fill('input[placeholder="Ex: O que a física prova sobre dinheiro..."]', 'Como programar melhor com inteligência artificial');
    await page.fill('input[placeholder="Ex: frequencia-dinheiro"]', 'ia-desenvolvimento');
    await page.selectOption('select.form-select', 'B'); // Formato B
    await page.fill('input[placeholder="C:/Users/julia/Desktop/nome-da-pasta"]', 'C:/Users/aryar/Desktop/ia-dev');
    await page.fill('textarea[placeholder="Caption para publicar junto ao carrossel..."]', 'Aprenda as melhores dicas para trabalhar com IA de forma eficiente.');
    await page.fill('textarea[placeholder="Observações, modelo usado, bolha A/B..."]', 'Usar tom direto e explicativo');

    // Captura o modal aberto com os dados e o botão novo
    console.log('📸 Salvando captura do modal preenchido...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'new_carousel_modal_ia_btn.png') });

    // 5. Clica no botão "Enviar para o Chat (IA)"
    console.log('💬 Clicando em "Enviar para o Chat (IA)"...');
    await page.click('button:has-text("Enviar para o Chat (IA)")');
    await page.waitForTimeout(3000); // Aguarda a troca de aba e envio

    // 6. Aguarda a resposta da IA começar a chegar (streaming)
    console.log('⏳ Aguardando streaming da IA no chat...');
    await page.waitForTimeout(6000);

    // Captura a tela do criador (chat) com a resposta
    console.log('📸 Salvando captura da resposta no chat...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'new_carousel_ia_chat_response.png') });

    console.log('🎉 Teste visual concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no teste visual:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
