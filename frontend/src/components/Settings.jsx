import React, { useState, useEffect } from 'react';

export default function Settings({ showToast }) {
  const [settingsData, setSettingsData] = useState(null);
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
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
          <div className="oraculo-subtitle">Gerencie suas API Keys e escolha o provedor de geração de imagens</div>
        </div>
        <button className="btn btn-gold" onClick={handleSave}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Salvar Configurações
        </button>
      </div>

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
    </div>
  );
}
