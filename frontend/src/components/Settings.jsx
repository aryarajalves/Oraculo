import React, { useState, useEffect } from 'react';

export default function Settings({ showToast, onLoadBranding }) {
  const [settingsData, setSettingsData] = useState(null);
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('general'); // 'general', 'prompts' ou 'branding'

  // Estados dos Prompts
  const [prompts, setPrompts] = useState([]);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [promptContent, setPromptContent] = useState('');
  const [promptSaving, setPromptSaving] = useState(false);

  // Estados de Visualização & Edição Adicional
  const [isMaximized, setIsMaximized] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState('');

  // Branding
  const [brandingData, setBrandingData] = useState({
    companyName: 'FONTE OCULTA',
    logoText: 'FONTE OCULTA',
    logoSub: 'PRODUÇÃO',
    logoSize: '13px',
    logoColor: '#ffffff',
    carouselTextSize: '15px',
    carouselTextColor: '#e4e4e7'
  });

  useEffect(() => {
    loadSettings();
    loadPrompts();
    loadBrandingData();
  }, []);

  const loadBrandingData = async () => {
    try {
      const res = await fetch('/api/settings/branding');
      const data = await res.json();
      if (data) setBrandingData(data);
    } catch (e) {
      showToast('Erro ao carregar identidade visual.');
    }
  };

  const handleSaveBranding = async () => {
    try {
      const res = await fetch('/api/settings/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandingData)
      });
      const data = await res.json();
      if (data.ok) {
        showToast('✓ Identidade Visual salva com sucesso!');
        if (onLoadBranding) onLoadBranding();
      } else {
        showToast('Erro ao salvar identidade visual.');
      }
    } catch (e) {
      showToast('Erro de rede ao salvar identidade visual.');
    }
  };

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
    setIsRenaming(false);
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

  const handleRenamePrompt = async () => {
    if (!tempName.trim()) return;
    try {
      const res = await fetch('/api/settings/prompts/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPromptId, name: tempName.trim() })
      });
      const data = await res.json();
      if (data.ok) {
        showToast('✓ Nome do agente atualizado!');
        setPrompts(prev => prev.map(p => p.id === selectedPromptId ? { ...p, name: tempName.trim() } : p));
        setIsRenaming(false);
      } else {
        showToast('Erro ao renomear: ' + data.error);
      }
    } catch (e) {
      showToast('Erro de rede ao renomear.');
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

  // Lógica de Categorização
  const categorizePrompt = (id) => {
    const textCopyIds = ['oraculo-v2', 'oraculo-haucacau', 'gancho-viral', 'humanizer', 'cta-desbloqueio-neural'];
    const designVisualIds = ['canalizador-visual', 'diretor-de-arte', 'visual-dna', 'visual-dna-haucacau'];
    
    if (textCopyIds.includes(id)) return 'Texto & Copy';
    if (designVisualIds.includes(id)) return 'Design & Visual';
    return 'Revisão & Gestão';
  };

  const groupedPrompts = {
    'Texto & Copy': [],
    'Design & Visual': [],
    'Revisão & Gestão': []
  };

  prompts.forEach(p => {
    const category = categorizePrompt(p.id);
    if (!groupedPrompts[category]) groupedPrompts[category] = [];
    groupedPrompts[category].push(p);
  });

  const activePrompt = prompts.find(p => p.id === selectedPromptId);

  const editorStyles = isMaximized ? {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 2000,
    background: '#09090b',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  } : {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '16px'
  };

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
        ) : subTab === 'prompts' ? (
          <button className="btn btn-gold" onClick={handleSavePrompt} disabled={promptSaving}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            {promptSaving ? 'Salvando...' : 'Salvar Prompt'}
          </button>
        ) : (
          <button className="btn btn-gold" onClick={handleSaveBranding}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Salvar Identidade
          </button>
        )}
      </div>

      <div className="inner-tabs" style={{ display: 'flex', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', paddingLeft: '16px' }}>
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
        <button 
          className={`inner-tab-btn ${subTab === 'branding' ? 'active' : ''}`} 
          onClick={() => setSubTab('branding')}
          style={{
            background: subTab === 'branding' ? 'rgba(255,255,255,0.05)' : 'transparent',
            border: subTab === 'branding' ? '1px solid var(--border)' : '1px solid transparent',
            color: subTab === 'branding' ? 'var(--text)' : 'var(--text-3)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          Identidade Visual
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
      ) : subTab === 'prompts' ? (
        <div className="prompts-settings-container" style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 240px)', minHeight: '450px' }}>
          <div className="prompts-list-panel" style={{ width: '260px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
            {Object.entries(groupedPrompts).map(([categoryName, items]) => (
              <div key={categoryName} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '4px 8px 6px' }}>{categoryName}</div>
                {items.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPrompt(p.id)}
                    style={{
                      textAlign: 'left',
                      background: selectedPromptId === p.id ? 'var(--crimson-d)' : 'transparent',
                      color: selectedPromptId === p.id ? 'var(--crimson)' : 'var(--text-2)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '12px',
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
            ))}
          </div>
          <div className="prompt-editor-panel" style={editorStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isRenaming ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      style={{
                        background: '#09090b',
                        color: '#fff',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                    <button className="btn btn-gold" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleRenamePrompt}>Salvar</button>
                    <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setIsRenaming(false)}>Cancelar</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                      {activePrompt?.name || 'Editor de Prompt'}
                    </div>
                    <button
                      onClick={() => { setTempName(activePrompt?.name || ''); setIsRenaming(true); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px',
                        borderRadius: '4px'
                      }}
                      title="Renomear Agente"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                  Arquivo: agents/{selectedPromptId}.md
                </div>
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--text-2)',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {isMaximized ? (
                    <>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>
                      Minimizar
                    </>
                  ) : (
                    <>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                      Maximizar
                    </>
                  )}
                </button>
                {isMaximized && (
                  <button className="btn btn-gold" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={handleSavePrompt} disabled={promptSaving}>
                    {promptSaving ? 'Salvando...' : 'Salvar Prompt'}
                  </button>
                )}
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
      ) : (
        <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="key-group">
            <div className="key-group-title">Logomarca & Cabeçalho</div>

            <div className="key-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <div className="key-label" style={{ marginBottom: '4px' }}>Nome da Empresa (Título da Aba & Sidebar)</div>
              <input
                className="key-input"
                type="text"
                value={brandingData.companyName || ''}
                onChange={(e) => setBrandingData(prev => ({ ...prev, companyName: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px' }}
                placeholder="Ex: FONTE OCULTA"
              />
            </div>
            
            <div className="key-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <div className="key-label" style={{ marginBottom: '4px' }}>Texto da Logomarca</div>
              <input
                className="key-input"
                type="text"
                value={brandingData.logoText}
                onChange={(e) => setBrandingData(prev => ({ ...prev, logoText: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px' }}
                placeholder="Ex: FONTE OCULTA"
              />
            </div>

            <div className="key-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <div className="key-label" style={{ marginBottom: '4px' }}>Subtítulo da Logomarca</div>
              <input
                className="key-input"
                type="text"
                value={brandingData.logoSub}
                onChange={(e) => setBrandingData(prev => ({ ...prev, logoSub: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px' }}
                placeholder="Ex: Produção"
              />
            </div>

            <div className="key-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="key-label">Tamanho da Fonte (Logo)</div>
                <input
                  className="key-input"
                  type="text"
                  value={brandingData.logoSize}
                  onChange={(e) => setBrandingData(prev => ({ ...prev, logoSize: e.target.value }))}
                  placeholder="Ex: 16px"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="key-label">Cor do Texto (Logo)</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={brandingData.logoColor.startsWith('#') ? brandingData.logoColor : '#ffffff'}
                    onChange={(e) => setBrandingData(prev => ({ ...prev, logoColor: e.target.value }))}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  />
                  <input
                    className="key-input"
                    type="text"
                    value={brandingData.logoColor}
                    onChange={(e) => setBrandingData(prev => ({ ...prev, logoColor: e.target.value }))}
                    style={{ flex: 1 }}
                    placeholder="Ex: #ffffff"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="key-group">
            <div className="key-group-title">Textos do Carrossel (Slides & Visualização)</div>

            <div className="key-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="key-label">Tamanho do Texto (Carrossel)</div>
                <input
                  className="key-input"
                  type="text"
                  value={brandingData.carouselTextSize}
                  onChange={(e) => setBrandingData(prev => ({ ...prev, carouselTextSize: e.target.value }))}
                  placeholder="Ex: 14px"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="key-label">Cor do Texto (Carrossel)</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={brandingData.carouselTextColor.startsWith('#') ? brandingData.carouselTextColor : '#ffffff'}
                    onChange={(e) => setBrandingData(prev => ({ ...prev, carouselTextColor: e.target.value }))}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  />
                  <input
                    className="key-input"
                    type="text"
                    value={brandingData.carouselTextColor}
                    onChange={(e) => setBrandingData(prev => ({ ...prev, carouselTextColor: e.target.value }))}
                    style={{ flex: 1 }}
                    placeholder="Ex: #ffffff"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="key-group">
            <div className="key-group-title">Painel de Demonstração (Fundo Branco)</div>
            <div className="settings-group-sub">Visualize em tempo real como o texto do carrossel e o título ficarão aplicados sobre uma imagem ou slide de fundo branco</div>
            <div style={{
              background: '#ffffff',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              marginTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '140px',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <div style={{
                fontSize: brandingData.logoSize ? (brandingData.logoSize.trim().match(/^\d+$/) ? `${brandingData.logoSize.trim()}px` : brandingData.logoSize) : '13px',
                color: brandingData.logoColor,
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                padding: '4px 8px',
                background: 'rgba(0,0,0,0.85)',
                borderRadius: '4px'
              }}>
                {brandingData.companyName || brandingData.logoText || 'LOGOMARCA'}
              </div>
              <div style={{
                fontSize: brandingData.carouselTextSize ? (brandingData.carouselTextSize.trim().match(/^\d+$/) ? `${brandingData.carouselTextSize.trim()}px` : brandingData.carouselTextSize) : '15px',
                color: brandingData.carouselTextColor,
                fontWeight: '500',
                textAlign: 'center',
                maxWidth: '80%',
                lineHeight: '1.5',
                wordBreak: 'break-word',
                padding: '8px',
                background: 'rgba(0,0,0,0.7)',
                borderRadius: '6px'
              }}>
                Este é um texto de exemplo do Carrossel para você validar o contraste e o tamanho da fonte sobre o fundo branco.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
