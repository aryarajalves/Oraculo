import React, { useState } from 'react';

export default function NewCarouselModal({ isOpen, onClose, onCreate, onSendToChat }) {
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState('');
  const [format, setFormat] = useState('A');
  const [dir, setDir] = useState('');
  const [caption, setCaption] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onCreate({ title, theme, format, dir, caption, notes });
    onClose();
  };

  const handleSendToChat = () => {
    if (onSendToChat) {
      onSendToChat({ title, theme, format, dir, caption, notes });
    }
    onClose();
  };

  return (
    <div className="form-modal open" id="new-modal">
      <div className="form-box">
        <div className="form-title">+ NOVO CARROSSEL</div>
        <div className="form-group">
          <label className="form-label">Título / Gancho</label>
          <input className="form-input" placeholder="Ex: O que a física prova sobre dinheiro..." value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Tema</label>
          <input className="form-input" placeholder="Ex: frequencia-dinheiro" value={theme} onChange={e => setTheme(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Formato</label>
          <select className="form-select" value={format} onChange={e => setFormat(e.target.value)}>
            <option value="A">A — Tese + Tradução</option>
            <option value="B">B — Demolição + Reconstrução</option>
            <option value="C">C — Lista Revelação</option>
            <option value="D">D — História + Verdade</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Pasta das artes (caminho completo)</label>
          <input className="form-input" placeholder="C:/Users/julia/Desktop/nome-da-pasta" value={dir} onChange={e => setDir(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Caption (texto para o post)</label>
          <textarea className="form-textarea" placeholder="Caption para publicar junto ao carrossel..." value={caption} onChange={e => setCaption(e.target.value)}></textarea>
        </div>
        <div className="form-group">
          <label className="form-label">Notas internas</label>
          <textarea className="form-textarea" placeholder="Observações, modelo usado, bolha A/B..." value={notes} onChange={e => setNotes(e.target.value)}></textarea>
        </div>
        <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-gold" onClick={handleSendToChat}>Criar</button>
        </div>
      </div>
    </div>
  );
}
