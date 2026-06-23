import React, { useState, useEffect } from 'react';

export default function Oraculo({ showToast }) {
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/oraculo/completo');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || null);
        setPosts(data.posts || []);
      }
    } catch (e) {
      showToast('Erro ao carregar estatísticas do Oráculo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/oraculo/sync', { method: 'POST' });
      if (res.ok) {
        showToast('Instagram sincronizado!');
        loadStats();
      }
    } catch (e) {
      showToast('Erro ao sincronizar.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="oraculo-header">
        <div>
          <div className="oraculo-title">ORÁCULO</div>
          <div className="oraculo-subtitle">Clique em Sincronizar para carregar os dados do Instagram</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-sync" disabled={syncing} onClick={handleSync}>
            {syncing ? '⟳ Sincronizando...' : '⟳ Sincronizar'}
          </button>
        </div>
      </div>

      {stats && (
        <div className="oraculo-totals">
          <div className="oraculo-total-card" style={{ '--accent': 'var(--gold)' }}>
            <div className="oraculo-total-num">{stats.posts || 0}</div>
            <div className="oraculo-total-label">Posts</div>
          </div>
          <div className="oraculo-total-card" style={{ '--accent': '#e56' }}>
            <div className="oraculo-total-num">{stats.likes || 0}</div>
            <div className="oraculo-total-label">Curtidas</div>
          </div>
          <div className="oraculo-total-card" style={{ '--accent': 'var(--cyan)' }}>
            <div className="oraculo-total-num">{stats.comments || 0}</div>
            <div className="oraculo-total-label">Comentários</div>
          </div>
          <div className="oraculo-total-card" style={{ '--accent': 'var(--green)' }}>
            <div className="oraculo-total-num">{stats.saved || 0}</div>
            <div className="oraculo-total-label">Salvamentos</div>
          </div>
          <div className="oraculo-total-card" style={{ '--accent': 'var(--purple)' }}>
            <div className="oraculo-total-num">{stats.shares || 0}</div>
            <div className="oraculo-total-label">Shares</div>
          </div>
          <div className="oraculo-total-card" style={{ '--accent': 'var(--blue)' }}>
            <div className="oraculo-total-num">{stats.reach || 0}</div>
            <div className="oraculo-total-label">Alcance (reach)</div>
          </div>
          <div className="oraculo-total-card" style={{ '--accent': '#f0a500' }}>
            <div className="oraculo-total-num">{stats.follows || 0}</div>
            <div className="oraculo-total-label">Seguidores</div>
          </div>
        </div>
      )}

      <div className="oraculo-table-wrap">
        {loading ? (
          <div className="oraculo-empty">
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔮</div>
            <div style={{ fontSize: '15px', color: 'var(--text-2)', marginBottom: '8px' }}>Carregando dados...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="oraculo-empty">
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔮</div>
            <div style={{ fontSize: '15px', color: 'var(--text-2)', marginBottom: '8px' }}>Oráculo aguardando sincronização</div>
            <div style={{ fontSize: '13px' }}>Clique em Sincronizar para buscar todos os posts do @afonteoculta</div>
          </div>
        ) : (
          <table className="oraculo-table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Likes</th>
                <th>Comentários</th>
                <th>Salvamentos</th>
                <th>Shares</th>
                <th>Alcance</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, index) => (
                <tr key={index}>
                  <td>
                    <div className="oraculo-caption">{post.caption || 'Sem legenda'}</div>
                  </td>
                  <td className="oraculo-num">{post.likes}</td>
                  <td className="oraculo-num">{post.comments}</td>
                  <td className="oraculo-num">{post.saved}</td>
                  <td className="oraculo-num">{post.shares}</td>
                  <td className="oraculo-num">{post.reach}</td>
                  <td className="oraculo-date">{new Date(post.date).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
