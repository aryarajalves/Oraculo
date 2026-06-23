# 🔖 Registro de Evolução: Projeto Fonte Oculta
**Data de Atualização:** 30 de Abril de 2026

Este arquivo serve como ponte de comunicação de estado do projeto.

### 1. Sistema de Monitoramento (Fábrica Aberta)
*   **Pipeline em Tempo Real (SSE):** O dashboard agora recebe eventos via Server-Sent Events do `diretor_artistico.py`.
*   **Indicador de Progresso:** Adicionado cálculo de porcentagem (`0% a 100%`) e contador de slides (`Slide X de Y`) nas notificações (`index.html`).
*   **Status Inteligente:** Corrigido o bug da etiqueta "Gerando" persistente. Ao finalizar, o Dashboard limpa o cache e atualiza o status para "Pronto".

### 2. Motor de Design (`compose_util_v3.py`)
*   **Fim dos Cortes de Texto:** A restrição rígida `max_y` foi substituída por uma priorização da base (`BOTTOM_PAD`). Se o texto for longo, o bloco **sobe** em direção ao topo em vez de ser empurrado para baixo.
*   **Shrink Automático de Fontes:** Reduzidos os limites mínimos de fonte (Corpo: 16 | Título: 28) para impedir que textos densos quebrem o layout.
*   **Estética "Realismo Metafísico":** Novo padrão estético (Chiaroscuro, luz dramática) integrado ao `diretor_artistico.py`.

### 3. Clonador de Reels & Engenharia Reversa (`reels_engineer.py` e Dashboard)
*   **Transcrição Literal Completa:** O script agora retorna a transcrição pura do Whisper, e a UI do Dashboard a exibe num novo campo para conferência.
*   **Download de Transcrição:** Adicionado botão JavaScript que converte e baixa a fala do vídeo em um arquivo `.txt` direto pelo navegador.
*   **Memória de Longo Prazo (Histórico):** Criado o arquivo `dashboard/data/reels_history.json`. As análises ficam salvas e a UI as exibe em um grid para restauração rápida (1 clique).
*   **Fix Anti-Colisão (WinError 32):** Corrigido o problema de lock de arquivo no `yt-dlp` implementando `time.time()` para gerar nomes de arquivos de vídeo únicos (`temp_reel_12345678.mp4`).

### 4. Próximos Passos Sugeridos
*   Monitorar legibilidade de fontes minúsculas (tamanho 16) no Instagram.
*   Automatizar totalmente o CRON de postagem após o status ir para "Pronto".
