import React, { useState, useEffect } from 'react';

export default function Criador({ onStartGeneration, showToast, initialPrompt, clearInitialPrompt }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [lastCarouselText, setLastCarouselText] = useState(sessionStorage.getItem('criadorLastCarousel') || null);

  const setLastCarousel = (text) => {
    setLastCarouselText(text);
    sessionStorage.setItem('criadorLastCarousel', text);
  };

  const isCriarIntent = (text) => {
    if (!lastCarouselText) return false;
    const t = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const verbo = /\b(criar|cria|crie|gerar|gera|gere|bora|faz|faca|fazer|produz|monta|execute|executa|dispara|ativa|roda|vai|cria)\b/;
    if (!verbo.test(t)) return false;
    const novoConteudo = /\b(sobre|com a|relacionado|baseado|partindo|a partir|novo|nova|diferente|outra|outro|tema|ideia|versao|variacao|gancho|hook|roteiro|legenda|caption|copy|texto)\b/;
    if (novoConteudo.test(t)) return false;
    return t.trim().split(/\s+/).length <= 6;
  };

  const handleSend = async (textToSend = null) => {
    const text = (textToSend || input).trim();
    if (!text || generating) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    if (isCriarIntent(text)) {
      setMessages(prev => [...prev, { role: 'ai', content: '✦ Iniciando criação das imagens...', id: 'auto-gen' }]);
      onStartGeneration(lastCarouselText);
      return;
    }

    setGenerating(true);
    const aiMessageId = 'ai-' + Date.now();
    setMessages(prev => [...prev, { role: 'ai', content: '', id: aiMessageId, streaming: true }]);

    let fullText = '';
    try {
      const res = await fetch('/api/criador/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: text }] }),
      });

      if (!res.ok) {
        setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: '⚠ Erro de conexão com a IA.', streaming: false } : m));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(t.slice(6));
            if (json.error) {
              setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: '⚠ Erro: ' + json.error, streaming: false } : m));
              return;
            }
            if (json.token) {
              fullText += json.token;
              setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: fullText } : m));
            }
            if (json.done) {
              setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, streaming: false } : m));
            }
          } catch {}
        }
      }
      if (fullText.includes('[S1') || fullText.includes('DISRUPÇÃO')) {
        setLastCarousel(fullText);
      }
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: '⚠ Erro de rede.', streaming: false } : m));
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      clearInitialPrompt();
    }
  }, [initialPrompt]);

  const handleSaveDraft = async (text) => {
    try {
      const res = await fetch('/api/carousels/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });
      if (res.ok) showToast('Rascunho salvo!');
    } catch (e) {
      showToast('Erro ao salvar rascunho.');
    }
  };

  return (
    <div className="main-view active" id="view-criador" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <div className="criador-wrap" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="criador-msgs" style={{ flex: 1, overflowY: 'auto', padding: '32px 24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {messages.length === 0 ? (
            <div className="criador-welcome">
              <div className="criador-welcome-icon">✦</div>
              <div className="criador-welcome-title">CRIADOR</div>
              <div className="criador-welcome-sub">Traga um tema e receba o carrossel completo de 10 slides.<br/>Método Jordânico · Voz Oculta · Humanizador.</div>
              <div className="criador-chips">
                <button className="criador-chip" onClick={() => handleSend('O sistema nervoso calibrado para escassez antes dos 7 anos')}>Sistema nervoso + escassez</button>
                <button className="criador-chip" onClick={() => handleSend('Por que pessoas inteligentes continuam quebradas')}>Inteligentes e quebradas</button>
              </div>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className={`criador-msg criador-msg--${m.role}`}>
                <div className="criador-avatar">{m.role === 'user' ? '✦' : '◈'}</div>
                <div className="criador-bubble">
                  {m.content}
                  {m.streaming && <span className="criador-cursor"></span>}
                  {m.role === 'ai' && !m.streaming && m.content && (
                    <div className="criador-msg-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button className="criador-action-btn" onClick={() => navigator.clipboard.writeText(m.content)}>Copiar tudo</button>
                      <button className="criador-action-btn" onClick={() => handleSaveDraft(m.content)}>+ Salvar rascunho</button>
                      {(m.content.includes('[S1') || m.content.includes('DISRUPÇÃO')) && (
                        <button className="criador-action-btn criador-action-btn--create" onClick={() => onStartGeneration(m.content)}>✦ Criar design</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="criador-input-row">
          <div className="criador-input-wrap">
            <textarea
              className="criador-textarea"
              placeholder="Digite o tema do carrossel ou faça uma pergunta..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            />
            <button className="criador-send-btn" onClick={() => handleSend()} disabled={generating}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div className="criador-info">gpt-5.4 · Método Jordânico · {generating ? 'gerando...' : 'pronto'}</div>
        </div>
      </div>
    </div>
  );
}
