import React, { useState, useEffect } from 'react';

export default function Dashboard({
  allCarousels,
  stats,
  filterStatus,
  setFilterStatus,
  onOpenLightbox,
  onOpenEditModal,
  onLoadCarousels,
  showToast
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCards, setExpandedCards] = useState({});
  const PAGE_SIZE = 12;

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStatusChange = async (carouselId, status) => {
    try {
      const res = await fetch(`/api/carousels/${carouselId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Status atualizado para: ${status.toUpperCase()}`);
        onLoadCarousels();
      }
    } catch (e) {
      showToast('Erro ao atualizar status.');
    }
  };

  const handlePublish = async (carouselId) => {
    try {
      const res = await fetch(`/api/carousels/${carouselId}/publish`, { method: 'POST' });
      if (res.ok) {
        showToast('✓ Publicado no Instagram!');
        onLoadCarousels();
      } else {
        const err = await res.json();
        alert('Erro: ' + (err.error || 'Falha ao publicar'));
      }
    } catch (e) {
      showToast('Erro ao conectar ao Instagram.');
    }
  };

  const handleDownloadPptx = async (carouselId) => {
    try {
      const res = await fetch(`/api/carousels/${carouselId}/pptx`);
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `carrossel-${carouselId}.pptx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      showToast('Erro ao baixar PPTX.');
    }
  };

  const handleDelete = async (carouselId) => {
    // Popup de confirmação centralizado (obrigatório pelas regras de UX!)
    if (!confirm('Tem certeza que deseja excluir este carrossel?')) return;
    try {
      const res = await fetch(`/api/carousels/${carouselId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Carrossel excluído.');
        onLoadCarousels();
      }
    } catch (e) {
      showToast('Erro ao excluir carrossel.');
    }
  };

  // Filter & Pagination
  const filtered = allCarousels.filter(c => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStartIndex = (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(pageStartIndex, pageStartIndex + PAGE_SIZE);

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card" style={{ '--accent': 'var(--gold)' }}>
          <div className="stat-num">{stats?.total || 0}</div>
          <div className="stat-label">Carrosséis produzidos</div>
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--cyan)' }}>
          <div className="stat-num">{stats?.slides || 0}</div>
          <div className="stat-label">Slides gerados</div>
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--green)' }}>
          <div className="stat-num">{stats?.aprovados || 0}</div>
          <div className="stat-label">Aprovados / prontos</div>
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--purple)' }}>
          <div className="stat-num">{stats?.publicados || 0}</div>
          <div className="stat-label">Publicados</div>
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--green)' }}>
          <div className="stat-num">{stats?.cost ? Number(stats.cost).toFixed(2) : '0.00'}</div>
          <div className="stat-label">Custo total (USD)</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">Carrosséis</div>
          <div className="filter-row">
            {['all', 'rascunho', 'pronto', 'aprovado', 'agendado', 'publicado'].map(status => (
              <button
                key={status}
                className={`btn btn-outline btn-sm ${filterStatus === status ? 'active' : ''}`}
                onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                style={status === 'agendado' ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}}
              >
                {status === 'all' ? 'Todos' : status.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="carousel-grid">
          {paginated.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">⏳</div>
              <div className="empty-text">Nenhum carrossel encontrado.</div>
            </div>
          ) : (
            paginated.map(c => {
              const isExpanded = expandedCards[c.id];
              return (
                <div className="carousel-card" key={c.id}>
                  <div className="card-header" onClick={() => toggleExpand(c.id)}>
                    {c.slides && c.slides.length > 0 ? (
                      <img src={`/api/carousels/${c.id}/image/${c.slides[0]}`} className="card-thumb" alt="" />
                    ) : (
                      <div className="card-thumb-placeholder">🎨</div>
                    )}
                    <div className="card-meta">
                      <div className="card-title">{c.title}</div>
                      <div className="card-badges">
                        <span className="badge badge-format">F: {c.format}</span>
                        <span className={`badge badge-${c.status}`}>{c.status}</span>
                        {c.cost > 0 && <span className="card-cost">${c.cost}</span>}
                      </div>
                      <div className="card-date">
                        {c.scheduledDate ? `📅 ${c.scheduledDate} ${c.scheduledTime || ''}` : new Date(c.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <>
                      <div className="slide-strip open">
                        {c.slides?.map((slide, idx) => (
                          <div className="slide-thumb-wrap" key={idx}>
                            <img
                              src={`/api/carousels/${c.id}/image/${slide}`}
                              className="slide-thumb"
                              alt=""
                              onClick={() => onOpenLightbox(c.id, c.slides, idx)}
                            />
                            <div className="slide-thumb-num">{idx + 1}</div>
                            <div className="slide-actions-overlay">
                              <button className="slide-icon-btn slide-icon-btn-dl" onClick={() => {
                                const a = document.createElement('a');
                                a.href = `/api/carousels/${c.id}/image/${slide}`;
                                a.download = slide;
                                a.click();
                              }}>↓</button>
                              <button className="slide-icon-btn slide-icon-btn-edit" onClick={() => onOpenEditModal(c.id, slide)}>✎</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {c.caption && <div className="caption-box open">{c.caption}</div>}
                    </>
                  )}

                  <div className="card-footer">
                    <select
                      className="status-select"
                      value={c.status}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                    >
                      <option value="rascunho">Rascunho</option>
                      <option value="pronto">Pronto</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="publicado">Publicado</option>
                    </select>

                    <div className="card-actions">
                      <button
                        className="btn-instagram btn-sm"
                        disabled={c.status === 'publicado'}
                        onClick={() => handlePublish(c.id)}
                      >
                        {c.status === 'publicado' ? '✓ Postado' : '✈ Postar'}
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleDownloadPptx(c.id)}>PPTX</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(c.id)}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">Página {currentPage} de {totalPages}</span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Anterior</button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  className={`page-btn ${currentPage === idx + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(idx + 1)}
                >
                  {idx + 1}
                </button>
              ))}
              <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Próxima</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
