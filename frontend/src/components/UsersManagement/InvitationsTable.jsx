import React from 'react';

export default function InvitationsTable({
  paginatedInvitations,
  invitesPage,
  setInvitesPage,
  invitesPerPage,
  setInvitesPerPage,
  totalInvitesPages,
  setDeletingInvite,
  setDeleteInviteModalOpen,
  showToast
}) {
  return (
    <div style={{ overflowX: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-3)' }}>
            <th style={{ padding: '12px 16px' }}>Link / Código</th>
            <th style={{ padding: '12px 16px' }}>Cargo Concedido</th>
            <th style={{ padding: '12px 16px' }}>Expira em</th>
            <th style={{ padding: '12px 16px' }}>Status</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginatedInvitations.map(inv => {
            const inviteUrl = `${window.location.protocol}//${window.location.host}/register.html?invite=${inv.id}`;
            return (
              <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: 'var(--text-2)' }}>
                <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '11px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteUrl);
                      showToast('Link do convite copiado!');
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', textAlign: 'left', outline: 'none' }}
                    title="Copiar Link"
                  >
                    🔗 {inv.id.substring(0, 18)}... (copiar)
                  </button>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    fontSize: '11px',
                    color: inv.role === 'admin' ? 'var(--cyan)' : 'var(--text-3)',
                    textTransform: 'uppercase',
                    fontWeight: '600'
                  }}>
                    {inv.role === 'admin' ? 'Admin' : 'Usuário'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>{new Date(inv.expires_at).toLocaleString('pt-BR')}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    border: '1px solid',
                    borderColor: inv.status === 'accepted' ? '#22c55e' : inv.status === 'pending' ? 'var(--gold)' : '#f43f5e',
                    color: inv.status === 'accepted' ? '#22c55e' : inv.status === 'pending' ? 'var(--gold)' : '#f43f5e',
                    background: inv.status === 'accepted' ? 'rgba(34,197,94,0.08)' : inv.status === 'pending' ? 'rgba(201,168,76,0.08)' : 'rgba(244,63,94,0.08)'
                  }}>
                    {inv.status === 'accepted' ? 'Aceito' : inv.status === 'pending' ? 'Pendente' : 'Expirado'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <button className="btn-danger btn-sm" onClick={() => { setDeletingInvite(inv); setDeleteInviteModalOpen(true); }}>Excluir</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Paginação de Convites */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-2)' }}>
          <span>Mostrar</span>
          <select
            value={invitesPerPage}
            onChange={(e) => {
              setInvitesPerPage(Number(e.target.value));
              setInvitesPage(1);
            }}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              color: 'var(--text-2)',
              padding: '4px 8px',
              borderRadius: '5px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>por página</span>
        </div>
        
        <div className="pagination-controls" style={{ display: 'flex', gap: '5px' }}>
          <button
            className="page-btn"
            disabled={invitesPage === 1}
            onClick={() => setInvitesPage(invitesPage - 1)}
          >
            Anterior
          </button>
          {Array.from({ length: totalInvitesPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`page-btn ${invitesPage === p ? 'active' : ''}`}
              onClick={() => setInvitesPage(p)}
              style={{
                backgroundColor: invitesPage === p ? 'var(--gold, #C9A84C)' : '',
                borderColor: invitesPage === p ? 'var(--gold, #C9A84C)' : '',
                color: invitesPage === p ? '#000' : ''
              }}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
            disabled={invitesPage === totalInvitesPages}
            onClick={() => setInvitesPage(invitesPage + 1)}
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}
