import React from 'react';

export default function DeleteUserModal({
  isOpen,
  onClose,
  deletingUser,
  onSubmit,
  deleteSubmitting
}) {
  if (!isOpen || !deletingUser) return null;

  return (
    <div className="form-modal open">
      <div className="form-box">
        <h3 className="form-title" style={{ color: 'var(--red, #f43f5e)', fontSize: '16px' }}>Excluir Usuário permanentemente</h3>
        <p style={{ margin: '14px 0 24px', color: '#e4e4e7', fontSize: '14px', lineHeight: '1.5' }}>
          Você tem certeza que deseja remover o usuário <strong>{deletingUser.name}</strong> ({deletingUser.email})? Esta ação removerá totalmente seus direitos de acesso ao estúdio.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-danger" style={{ backgroundColor: 'var(--red, #f43f5e)', border: 'none', color: '#ffffff' }} onClick={onSubmit} disabled={deleteSubmitting}>
            {deleteSubmitting ? 'Excluindo...' : 'Excluir usuário'}
          </button>
        </div>
      </div>
    </div>
  );
}
