import React from 'react';

export default function DeleteInviteModal({
  isOpen,
  onClose,
  deletingInvite,
  onSubmit,
  deleteInviteSubmitting
}) {
  if (!isOpen || !deletingInvite) return null;

  return (
    <div className="form-modal open">
      <div className="form-box">
        <h3 className="form-title" style={{ color: 'var(--red, #f43f5e)', fontSize: '16px' }}>Excluir Convite permanentemente</h3>
        <p style={{ margin: '14px 0 24px', color: '#e4e4e7', fontSize: '14px', lineHeight: '1.5' }}>
          Você tem certeza que deseja excluir o convite <strong>{deletingInvite.id}</strong>? Esta ação invalidará o link permanentemente e removerá o convite do histórico.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-danger" style={{ backgroundColor: 'var(--red, #f43f5e)', border: 'none', color: '#ffffff' }} onClick={onSubmit} disabled={deleteInviteSubmitting}>
            {deleteInviteSubmitting ? 'Excluindo...' : 'Excluir convite'}
          </button>
        </div>
      </div>
    </div>
  );
}
