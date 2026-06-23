import React, { useState, useEffect } from 'react';

export default function UsersManagement({ showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('users'); // 'users' ou 'invitations'
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de Modais
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState('user');
  const [inviteHours, setInviteHours] = useState('24');
  const [generatedLink, setGeneratedLink] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  // Estados de Edição de Usuário
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Estados de Deleção de Usuário
  const [deleteUserModalOpen, setDeleteUserModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'users') {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (res.ok) setUsers(data);
      } else {
        const res = await fetch('/api/users/invitations');
        const data = await res.json();
        if (res.ok) setInvitations(data);
      }
    } catch (e) {
      showToast('Erro ao carregar dados de gestão.');
    } finally {
      setLoading(false);
    }
  };

  // Gerar Convite
  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setInviteSubmitting(true);
    try {
      const res = await fetch('/api/users/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: inviteRole, hours: inviteHours })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        const link = `${window.location.protocol}//${window.location.host}/register.html?invite=${data.inviteId}`;
        setGeneratedLink(link);
        showToast('Convite gerado com sucesso!');
        loadData();
      } else {
        showToast(data.error || 'Erro ao gerar convite.');
      }
    } catch (err) {
      showToast('Erro de rede ao gerar convite.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  // Copiar link
  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    showToast('Link copiado para a área de transferência!');
  };

  // Revogar/Excluir Convite
  const handleRevokeInvite = async (inviteId) => {
    try {
      const res = await fetch(`/api/users/invitations/${inviteId}/revoke`, { method: 'POST' });
      if (res.ok) {
        showToast('Convite cancelado.');
        loadData();
      }
    } catch (e) {
      showToast('Erro ao cancelar convite.');
    }
  };

  // Abrir Modal de Edição
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditUserModalOpen(true);
  };

  // Salvar Edição
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail, role: editRole })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast('Usuário atualizado com sucesso.');
        setEditUserModalOpen(false);
        loadData();
      } else {
        showToast(data.error || 'Erro ao atualizar usuário.');
      }
    } catch (err) {
      showToast('Erro de rede ao atualizar usuário.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Confirmar Deleção
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Usuário excluído com sucesso.');
        setDeleteUserModalOpen(false);
        loadData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao excluir usuário.');
      }
    } catch (e) {
      showToast('Erro de rede ao excluir usuário.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div>
      <div className="oraculo-header">
        <div>
          <div className="oraculo-title">GESTÃO DE USUÁRIOS</div>
          <div className="oraculo-subtitle">Gerencie os acessos do estúdio e crie convites temporários com níveis de acesso.</div>
        </div>
      </div>

      <div className="inner-tabs" style={{ display: 'flex', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', paddingLeft: '16px' }}>
        <button
          className={`inner-tab-btn ${activeSubTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('users')}
          style={{
            background: activeSubTab === 'users' ? 'rgba(255,255,255,0.05)' : 'transparent',
            border: activeSubTab === 'users' ? '1px solid var(--border)' : '1px solid transparent',
            color: activeSubTab === 'users' ? 'var(--text)' : 'var(--text-3)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          Usuários Cadastrados
        </button>
        <button
          className={`inner-tab-btn ${activeSubTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('invitations')}
          style={{
            background: activeSubTab === 'invitations' ? 'rgba(255,255,255,0.05)' : 'transparent',
            border: activeSubTab === 'invitations' ? '1px solid var(--border)' : '1px solid transparent',
            color: activeSubTab === 'invitations' ? 'var(--text)' : 'var(--text-3)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          Convites Enviados
        </button>
      </div>

      {activeSubTab === 'users' && (
        <div className="section">
          {loading ? (
            <div className="empty">
              <div className="spinner"></div>
              <div className="empty-text">Carregando usuários...</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-3)' }}>
                    <th style={{ padding: '12px 16px' }}>Nome</th>
                    <th style={{ padding: '12px 16px' }}>E-mail (Login)</th>
                    <th style={{ padding: '12px 16px' }}>Cargo</th>
                    <th style={{ padding: '12px 16px' }}>Data de Criação</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: 'var(--text-2)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: '500', color: 'var(--text)' }}>
                        {u.name}
                        {u.isSuperAdmin && (
                          <span style={{ fontSize: '9px', background: 'var(--gold-dim)', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', fontWeight: 'bold' }}>
                            SUPER ADMIN
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>{u.email}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '11px',
                          color: u.role === 'admin' ? 'var(--cyan)' : 'var(--text-3)',
                          textTransform: 'uppercase',
                          fontWeight: '600'
                        }}>
                          {u.role === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>{new Date(u.created_at || u.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {u.isSuperAdmin ? (
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontStyle: 'italic', paddingRight: '8px' }}>🔐 Protegido</span>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => openEditModal(u)}>Editar</button>
                            <button className="btn-danger btn-sm" onClick={() => { setDeletingUser(u); setDeleteUserModalOpen(true); }}>Excluir</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'invitations' && (
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-2)' }}>Histórico de convites para cadastro no estúdio</div>
            <button className="btn btn-gold btn-sm" onClick={() => { setGeneratedLink(''); setInviteModalOpen(true); }}>+ Novo Convite</button>
          </div>

          {loading ? (
            <div className="empty">
              <div className="spinner"></div>
              <div className="empty-text">Carregando convites...</div>
            </div>
          ) : invitations.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">✉</div>
              <div className="empty-text">Nenhum convite gerado.</div>
              <div className="empty-sub">Clique em "+ Novo Convite" para liberar acesso para um novo colaborador.</div>
            </div>
          ) : (
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
                  {invitations.map(inv => {
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
                          {inv.status === 'pending' && (
                            <button className="btn btn-outline btn-sm" onClick={() => handleRevokeInvite(inv.id)}>Revogar</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Novo Convite */}
      {inviteModalOpen && (
        <div className="form-modal open">
          <div className="form-box" style={{ maxWidth: '480px' }}>
            <h3 className="form-title">Gerar Novo Convite</h3>
            
            {generatedLink ? (
              <div style={{ margin: '16px 0 24px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '8px' }}>Link de cadastro exclusivo gerado:</p>
                <div style={{ background: '#09090b', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--gold)', wordBreak: 'break-all', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ flex: 1 }}>{generatedLink}</span>
                  <button className="btn btn-gold btn-sm" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={handleCopyLink}>Copiar</button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '8px' }}>Envie este link para o novo membro realizar o cadastro.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Cargo do Novo Usuário</label>
                  <select className="form-select" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    <option value="user">Colaborador (Usuário comum — Criação/Ferramentas)</option>
                    <option value="admin">Administrador (Admin — Acessos completos)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Prazo de Expiração do Link</label>
                  <select className="form-select" value={inviteHours} onChange={e => setInviteHours(e.target.value)}>
                    <option value="12">12 horas</option>
                    <option value="24">24 horas</option>
                    <option value="48">48 horas</option>
                    <option value="72">72 horas</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setInviteModalOpen(false)}>Fechar</button>
                  <button type="submit" className="btn btn-gold" disabled={inviteSubmitting}>
                    {inviteSubmitting ? 'Gerando...' : 'Gerar Convite'}
                  </button>
                </div>
              </form>
            )}

            {generatedLink && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => { setInviteModalOpen(false); setGeneratedLink(''); }}>Fechar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Editar Usuário */}
      {editUserModalOpen && editingUser && (
        <div className="form-modal open">
          <div className="form-box" style={{ maxWidth: '480px' }}>
            <h3 className="form-title">Editar Usuário</h3>
            <form onSubmit={handleSaveEdit} style={{ marginTop: '16px' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Nome Completo</label>
                <input type="text" className="form-input" value={editName} onChange={e => setEditName(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">E-mail (Login)</label>
                <input type="email" className="form-input" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Cargo / Permissão</label>
                <select className="form-select" value={editRole} onChange={e => setEditRole(e.target.value)}>
                  <option value="user">Usuário comum (Colaborador)</option>
                  <option value="admin">Administrador (Admin)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditUserModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-gold" disabled={editSubmitting}>
                  {editSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Excluir Usuário (Premium Backdrop, sem fechar por clique externo) */}
      {deleteUserModalOpen && deletingUser && (
        <div className="form-modal open">
          <div className="form-box">
            <h3 className="form-title" style={{ color: 'var(--red, #f43f5e)', fontSize: '16px' }}>Excluir Usuário permanentemente</h3>
            <p style={{ margin: '14px 0 24px', color: '#e4e4e7', fontSize: '14px', lineHeight: '1.5' }}>
              Você tem certeza que deseja remover o usuário <strong>{deletingUser.name}</strong> ({deletingUser.email})? Esta ação removerá totalmente seus direitos de acesso ao estúdio.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setDeleteUserModalOpen(false)}>Cancelar</button>
              <button className="btn btn-danger" style={{ backgroundColor: 'var(--red, #f43f5e)', border: 'none' }} onClick={handleConfirmDelete} disabled={deleteSubmitting}>
                {deleteSubmitting ? 'Excluindo...' : 'Excluir usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
