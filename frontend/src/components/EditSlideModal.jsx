import React, { useState, useEffect } from 'react';

export default function EditSlideModal({ isOpen, onClose, carouselId, filename, showToast }) {
  const [activeTab, setActiveTab] = useState('text');
  const [slideMeta, setSlideMeta] = useState({ title: '', body: '', prompt: '', layout: 'fullbleed' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && carouselId && filename) {
      loadSlideMeta();
    }
  }, [isOpen, carouselId, filename]);

  const loadSlideMeta = async () => {
    try {
      const res = await fetch(`/api/carousels/${carouselId}/slide/${filename}/meta`);
      const data = await res.json();
      setSlideMeta({
        title: data.title || '',
        body: data.body || '',
        prompt: data.prompt || '',
        layout: data.layout || 'fullbleed'
      });
    } catch (e) {
      showToast('Erro ao carregar metadados do slide.');
    }
  };

  const handleRecompose = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/carousels/${carouselId}/slide/${filename}/recompose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slideMeta)
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Slide recomposto!');
        onClose();
      } else {
        alert('Erro: ' + (data.error || 'desconhecido'));
      }
    } catch (e) {
      showToast('Erro ao recompor slide.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegen = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/carousels/${carouselId}/slide/${filename}/regen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slideMeta)
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Imagem gerada e slide recomposto!');
        onClose();
      } else {
        alert('Erro: ' + (data.error || 'desconhecido'));
      }
    } catch (e) {
      showToast('Erro ao gerar nova imagem.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edit-modal open" id="edit-modal">
      <div className="edit-box">
        <div className="edit-header">
          <div>
            <div className="form-title" style={{ margin: 0 }}>EDITAR SLIDE</div>
            <div className="edit-filename" style={{ marginTop: '4px' }}>{filename}</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ position: 'static' }}>✕</button>
        </div>

        <div className="edit-tabs">
          <button className={`edit-tab ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>Texto & Layout</button>
          <button className={`edit-tab ${activeTab === 'image' ? 'active' : ''}`} onClick={() => setActiveTab('image')}>Recriar Imagem</button>
        </div>

        {activeTab === 'text' ? (
          <div className="edit-panel active">
            <div className="form-group">
              <label className="form-label">Título</label>
              <textarea className="form-textarea" value={slideMeta.title} onChange={e => setSlideMeta(prev => ({ ...prev, title: e.target.value }))}></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Corpo</label>
              <textarea className="form-textarea" value={slideMeta.body} onChange={e => setSlideMeta(prev => ({ ...prev, body: e.target.value }))}></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Layout</label>
              <select className="form-select" value={slideMeta.layout} onChange={e => setSlideMeta(prev => ({ ...prev, layout: e.target.value }))}>
                <option value="fullbleed">Fullbleed (Layout padrão)</option>
                <option value="center">Centralizado</option>
                <option value="left">Alinhado à Esquerda</option>
              </select>
            </div>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
              <button className="btn btn-gold" onClick={handleRecompose} disabled={saving}>
                {saving ? 'Salvando...' : 'Recompor Slide'}
              </button>
            </div>
          </div>
        ) : (
          <div className="edit-panel active">
            <div className="form-group">
              <label className="form-label">Prompt Visual</label>
              <textarea className="form-textarea" style={{ minHeight: '110px' }} value={slideMeta.prompt} onChange={e => setSlideMeta(prev => ({ ...prev, prompt: e.target.value }))}></textarea>
            </div>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
              <button className="btn btn-gold" onClick={handleRegen} disabled={saving}>
                {saving ? 'Gerando...' : 'Gerar Nova Imagem'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
