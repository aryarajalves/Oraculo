import React, { useState, useEffect } from 'react';

export default function Settings({ showToast }) {
  const [settingsData, setSettingsData] = useState(null);
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('general'); // 'general' ou 'prompts'

  // Estados dos Prompts
  const [prompts, setPrompts] = useState([]);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [promptContent, setPromptContent] = useState('');
  const [promptSaving, setPromptSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadPrompts();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/keys');
      const data = await res.json();
      setSettingsData(data);
    } catch (e) {
      showToast('Erro ao carregar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const loadPrompts = async () => {
    try {
      const res = await fetch('/api/settings/prompts');
      const data = await res.json();
      if (data.prompts) {
        setPrompts(data.prompts);
        if (data.prompts.length > 0) {
          setSelectedPromptId(data.prompts[0].id);
          setPromptContent(data.prompts[0].content);
        }
      }
    } catch (e) {
      showToast('Erro ao carregar prompts dos agentes.');
    }
  };

  const handleSelectPrompt = (id) => {
    setSelectedPromptId(id);
    const p = prompts.find(pr => pr.id === id);
    setPromptContent(p ? p.content : '');
  };

  const handleSavePrompt = async () => {
    if (!selectedPromptId) return;
    setPromptSaving(true);
    try {
      const res = await fetch('/api/settings/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPromptId, content: promptContent })
      });
      const data = await res.json();
      if (data.ok) {
        showToast('✓ Prompt do agente salvo com sucesso!');
        setPrompts(prev => prev.map(p => p.id === selectedPromptId ? { ...p, content: promptContent } : p));
      } else {
        showToast('Erro ao salvar prompt: ' + data.error);
      }
    } catch (e) {
      showToast('Erro de rede ao salvar prompt.');
    } finally {
      setPromptSaving(false);
    }
  };

  const toggleVisibility = (key) => {
    const input = document.getElementById(`key-${key}`);
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  };

  const selectProvider = (provider) => {
    setPendingUpdates(prev => ({ ...prev, ACTIVE_IMAGE_PROVIDER: provider }));
    setSettingsData(prev => ({ ...prev, activeProvider: provider }));
  };

  const handleSave = async () => {
    const updates = {};
    for (const [k, v] of Object.entries(pendingUpdates)) {
      if (v && v.trim()) updates[k] = v.trim();
    }
    if (Object.keys(updates).length === 0) {
      showToast('Nenhuma alteração para salvar.');
      return;
    }
    try {
      const res = await fetch('/api/settings/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`✓ ${data.updated.length} chave(s) salva(s) com sucesso!`);
        setPendingUpdates({});
        loadSettings();
      } else {
        showToast('Erro: ' + data.error);
      }
    } catch (e) {
      showToast('Erro de rede ao salvar configurações.');
    }
  };

  if (loading) {
    return (
      <div className="empty">
        <div className="empty-icon">⏳</div>
        <div className="empty-text">Carregando chaves...</div>
      </div>
    );
  }

  const keysMap = {};
  if (settingsData && settingsData.keys) {
    settingsData.keys.forEach(k => { keysMap[k.key] = k; });
  }

  const openaiSet = !!(keysMap['OPENAI_API_KEY'] && keysMap['OPENAI_API_KEY'].set);
  const falSet = !!(keysMap['FAL_KEY'] && keysMap['FAL_KEY'].set);
  const geminiSet = !!(keysMap['GEMINI_API_KEY'] && keysMap['GEMINI_API_KEY'].set);

  const provider = settingsData?.activeProvider || 'gpt-image-2';

  const groups = {};
  if (settingsData?.keys) {
    settingsData.keys.forEach(k => {
      if (!groups[k.group]) groups[k.group] = [];
      groups[k.group].push(k);
    });
  }

  return (
    <div>
      <div className="oraculo-header">
        <div>
          <div className="oraculo-title">CONFIGURAÇÕES</div>
          <div className="oraculo-subtitle">Gerencie suas chaves, provedores de imagem e prompts dos agentes</div>
        </div>
        {subTab === 'general' ? (
          <button className="btn btn-gold" onClick={handleSave}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Salvar Configurações
          </button>
        ) : (
          <button className="btn btn-gold" onClick={handleSavePrompt} disabled={promptSaving}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            {promptSaving ? 'Salvando...' : 'Salvar Prompt'}
          </button>
        )}
      </div>

      <div className="inner-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <button 
          className={`inner-tab-btn ${subTab === 'general' ? 'active' : ''}`} 
          onClick={() => setSubTab('general')}
          style={{
            background: subTab === 'general' ? 'rgba(255,255,255,0.05)' : 'transparent',
            border: subTab === 'general' ? '1px solid var(--border)' : '1px solid transparent',
            color: subTab === 'general' ? 'var(--text)' : 'var(--text-3)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          Configurações Gerais
        </button>
        <button 
          className={`inner-tab-btn ${subTab === 'prompts' ? 'active' : ''}`} 
          onClick={() => setSubTab('prompts')}
          style={{
            background: subTab === 'prompts' ? 'rgba(255,255,255,0.05)' : 'transparent',
            border: subTab === 'prompts' ? '1px solid var(--border)' : '1px solid transparent',
            color: subTab === 'prompts' ? 'var(--text)' : 'var(--text-3)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          Prompts dos Agentes
        </button>
      </div>

      {subTab === 'general' ? (
        <div className="section">
          <div className="settings-group">
            <div className="settings-group-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Provedor de Geração de Imagens
            </div>
            <div className="settings-group-sub">Escolha qual API será usada para gerar as imagens dos slides</div>
            <div className="provider-selector">
              <div
                className={`provider-card ${provider === 'gpt-image-2' ? 'active' : ''} ${!openaiSet ? 'disabled-card' : ''}`}
                onClick={() => openaiSet && selectProvider('gpt-image-2')}
                style={{ opacity: openaiSet ? 1 : 0.4, cursor: openaiSet ? 'pointer' : 'not-allowed', pointerEvents: openaiSet ? 'auto' : 'none' }}
              >
                <div className="provider-icon">🤖</div>
                <div className="provider-name">GPT Image 2</div>
                <div className="provider-desc">OpenAI · Alta qualidade · ~$0.08/img</div>
              </div>
              <div
                className={`provider-card ${provider === 'fal' ? 'active' : ''} ${!falSet ? 'disabled-card' : ''}`}
                onClick={() => falSet && selectProvider('fal')}
                style={{ opacity: falSet ? 1 : 0.4, cursor: falSet ? 'pointer' : 'not-allowed', pointerEvents: falSet ? 'auto' : 'none' }}
              >
                <div className="provider-icon">⚡</div>
                <div className="provider-name">Fal.ai</div>
                <div className="provider-desc">Flux / SDXL · Rápido · ~$0.003/img</div>
              </div>
              <div
                className={`provider-card ${provider === 'gemini' ? 'active' : ''} ${!geminiSet ? 'disabled-card' : ''}`}
                onClick={() => geminiSet && selectProvider('gemini')}
                style={{ opacity: geminiSet ? 1 : 0.4, cursor: geminiSet ? 'pointer' : 'not-allowed', pointerEvents: geminiSet ? 'auto' : 'none' }}
              >
                <div className="provider-icon">✦</div>
                <div className="provider-name">Gemini Imagen</div>
                <div className="provider-desc">Google · Experimental · Pré-pago</div>
              </div>
            </div>
          </div>

          {Object.entries(groups).map(([groupName, keys]) => (
            <div className="key-group" key={groupName}>
              <div className="key-group-title">{groupName}</div>
              {keys.filter(k => k.key !== 'ACTIVE_IMAGE_PROVIDER').map(k => (
                <div className="key-row" key={k.key}>
                  <div className="key-label">
                    <span className={`key-status ${k.set ? 'set' : ''}`}></span>
                    {k.label}
                  </div>
                  <input
                    className="key-input"
                    id={`key-${k.key}`}
                    type="password"
                    defaultValue={k.value || ''}
                    placeholder={k.masked || 'Não configurada'}
                    autoComplete="off"
                    onChange={(e) => setPendingUpdates(prev => ({ ...prev, [k.key]: e.target.value }))}
                  />
                  <button className="key-reveal" onClick={() => toggleVisibility(k.key)}>Mostrar</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="prompts-settings-container" style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 240px)', minHeight: '450px' }}>
          <div className="prompts-list-panel" style={{ width: '250px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 8px 10px' }}>Agentes</div>
            {prompts.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectPrompt(p.id)}
                style={{
                  textAlign: 'left',
                  background: selectedPromptId === p.id ? 'var(--crimson-d)' : 'transparent',
                  color: selectedPromptId === p.id ? 'var(--crimson)' : 'var(--text-2)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '12.5px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'background 0.15s, color 0.15s'
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="prompt-editor-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                {prompts.find(p => p.id === selectedPromptId)?.name || 'Editor de Prompt'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                Arquivo: agents/{selectedPromptId}.md
              </div>
            </div>
            <textarea
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              style={{
                flex: 1,
                background: '#09090b',
                color: '#e4e4e7',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '14px',
                fontSize: '13px',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                resize: 'none',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
              }}
              placeholder="Selecione um prompt ou aguarde o carregamento..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

