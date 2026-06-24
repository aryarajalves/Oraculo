import React, { useState, useEffect, useRef } from 'react';

export default function BackupManagement({ showToast }) {
  const [config, setConfig] = useState({
    enabled: false,
    frequency: 'hours',
    interval_val: 6,
    s3_folder: 'backups/',
    retention: 30
  });

  const [backups, setBackups] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Seleção e Exclusão em Massa
  const [selectedBackups, setSelectedBackups] = useState([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Paginação e Exibição
  const [displayCount, setDisplayCount] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Modais de Confirmação
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreFilename, setRestoreFilename] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteFilename, setDeleteFilename] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadConfig();
    loadBackups();
  }, []);

  const loadConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/backups/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      showToast('Erro ao carregar configurações de backup.');
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadBackups = async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/backups/list');
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (e) {
      showToast('Erro ao carregar lista de backups.');
    } finally {
      setLoadingList(false);
    }
  };

  const handleSaveConfig = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/backups/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        showToast('✓ Configuração de backup salva com sucesso!');
        loadConfig();
      } else {
        showToast('Erro ao salvar configuração.');
      }
    } catch (e) {
      showToast('Erro de rede ao salvar configuração.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualBackup = async () => {
    setActionLoading(true);
    showToast('⚙️ Iniciando backup imediato...');
    try {
      const res = await fetch('/api/backups/run', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showToast(`✓ Backup ${data.filename} gerado com sucesso!`);
        loadBackups();
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao gerar backup.');
      }
    } catch (e) {
      showToast('Erro de rede ao gerar backup.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActionLoading(true);
    showToast('📤 Enviando arquivo de backup para o S3...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/backups/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`✓ Backup ${data.filename} importado com sucesso!`);
        loadBackups();
      } else {
        const data = await res.json();
        showToast(data.error || 'Falha no upload do backup.');
      }
    } catch (err) {
      showToast('Erro de rede ao importar backup.');
    } finally {
      setActionLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmRestore = (filename) => {
    setRestoreFilename(filename);
    setRestoreModalOpen(true);
  };

  const handleRestore = async () => {
    setRestoreModalOpen(false);
    setActionLoading(true);
    showToast(`⚙️ Restaurando banco de dados a partir de ${restoreFilename}...`);
    try {
      const res = await fetch(`/api/backups/restore/${restoreFilename}`, { method: 'POST' });
      if (res.ok) {
        showToast('✓ Banco de dados restaurado com sucesso!');
      } else {
        const data = await res.json();
        showToast(data.error || 'Falha ao restaurar banco de dados.');
      }
    } catch (e) {
      showToast('Erro de rede ao restaurar banco.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = (filename) => {
    setDeleteFilename(filename);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    setDeleteModalOpen(false);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/backups/${deleteFilename}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('✓ Backup excluído do S3.');
        loadBackups();
      } else {
        showToast('Falha ao deletar backup.');
      }
    } catch (e) {
      showToast('Erro de rede ao deletar backup.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectToggle = (filename) => {
    setSelectedBackups(prev => 
      prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]
    );
  };

  const handleSelectAllToggle = () => {
    const currentPageFilenames = paginatedBackups.map(b => b.filename);
    const allSelectedOnPage = currentPageFilenames.every(f => selectedBackups.includes(f));

    if (allSelectedOnPage) {
      setSelectedBackups(prev => prev.filter(f => !currentPageFilenames.includes(f)));
    } else {
      setSelectedBackups(prev => {
        const union = new Set([...prev, ...currentPageFilenames]);
        return Array.from(union);
      });
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleteModalOpen(false);
    setActionLoading(true);
    showToast(`⚙️ Excluindo ${selectedBackups.length} backup(s)...`);
    try {
      const res = await fetch('/api/backups/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames: selectedBackups })
      });
      if (res.ok) {
        showToast('✓ Backups excluídos com sucesso do S3.');
        setSelectedBackups([]);
        loadBackups();
      } else {
        showToast('Falha ao excluir backups em massa.');
      }
    } catch (e) {
      showToast('Erro de rede ao excluir backups.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0.00 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getFreqLabel = (freq, count) => {
    const labels = {
      minutes: count === 1 ? 'minuto' : 'minutos',
      hours: count === 1 ? 'hora' : 'horas',
      days: count === 1 ? 'dia' : 'dias'
    };
    return labels[freq] || freq;
  };

  // Paginação
  const totalPages = Math.ceil(backups.length / displayCount) || 1;
  const paginatedBackups = backups.slice((currentPage - 1) * displayCount, currentPage * displayCount);

  // Informações de status dos Cards
  const successBackups = backups.filter(b => b.status === 'success');
  const lastSuccessBackup = successBackups[0];

  const lastBackupFilename = lastSuccessBackup ? lastSuccessBackup.filename : 'Nenhum backup realizado';
  const lastBackupTime = lastSuccessBackup ? new Date(lastSuccessBackup.created_at).toLocaleString('pt-BR') : '';

  let nextBackupTime = 'Agendamento desativado';
  let nextBackupSub = `A cada ${config.interval_val || 6} ${getFreqLabel(config.frequency, config.interval_val || 6)}`;

  if (config.enabled) {
    const lastTime = lastSuccessBackup ? new Date(lastSuccessBackup.created_at) : new Date(config.updated_at || Date.now());
    let intervalMs = 0;
    const value = config.interval_val || 6;
    if (config.frequency === 'minutes') {
      intervalMs = value * 60 * 1000;
    } else if (config.frequency === 'hours') {
      intervalMs = value * 60 * 60 * 1000;
    } else if (config.frequency === 'days') {
      intervalMs = value * 24 * 60 * 60 * 1000;
    }
    const nextDate = new Date(lastTime.getTime() + intervalMs);
    nextBackupTime = nextDate.toLocaleString('pt-BR');
    nextBackupSub = `A cada ${value} ${getFreqLabel(config.frequency, value)}(s)`;
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div className="oraculo-header">
        <div>
          <div className="oraculo-title">BACKUPS DO BANCO</div>
          <div className="oraculo-subtitle">Gerencie backups automáticos, faça downloads e restaure o banco de dados PostgreSQL.</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 16px' }}>
        
        {/* Cards de Status (Último, Próximo e Retenção) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          {/* Card 1: Último Backup */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Último Backup</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', wordBreak: 'break-all' }}>{lastBackupFilename}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{lastBackupTime}</div>
            </div>
          </div>

          {/* Card 2: Próximo Backup */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Próximo Backup</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>{nextBackupTime}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{nextBackupSub}</div>
            </div>
          </div>

          {/* Card 3: Retenção */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#8b5cf6', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Retenção</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)' }}>{config.retention}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>backups mantidos no S3</div>
            </div>
          </div>

        </div>
        
        {/* Painel 1: Backup Manual */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.2 15a8.85 8.85 0 0 0-1.75-4.58c-.1-.13-.25-.23-.41-.3M12 13v8M9 16l3-3 3 3"/></svg>
              Backup Manual
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Clique para criar um backup imediato do banco de dados e enviar ao Backblaze S3.</div>
          </div>
          <button className="btn btn-gold" onClick={handleManualBackup} disabled={actionLoading}>
            <svg style={{ marginRight: '6px' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.2 15a8.85 8.85 0 0 0-1.75-4.58c-.1-.13-.25-.23-.41-.3M12 13v8M9 16l3-3 3 3"/></svg>
            Fazer Backup Agora
          </button>
        </div>

        {/* Painel 2: Importar Backup Externo */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              Importar Backup Externo
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Envie um arquivo de backup (.dump ou .dump.gz) de outro servidor para salvá-lo no S3 e restaurar quando desejar.</div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept=".dump,.dump.gz" 
          />
          <button className="btn btn-outline" onClick={handleUploadClick} disabled={actionLoading} style={{ borderColor: 'var(--orange)', color: 'var(--orange)' }}>
            <svg style={{ marginRight: '6px' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            Fazer Upload de Backup
          </button>
        </div>

        {/* Painel 3: Agendamento Automático */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Agendamento Automático
          </div>

          {loadingConfig ? (
            <div className="spinner"></div>
          ) : (
            <>
              {/* Toggle Switch */}
              <div style={{ background: 'var(--surface-d)', border: '1px solid var(--border2)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Agendamento Ativado</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Backups serão realizados automaticamente de forma cíclica.</div>
                </div>
                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span className="slider round" style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: config.enabled ? 'var(--gold)' : '#3f3f46',
                    transition: '.3s', borderRadius: '34px'
                  }}></span>
                  <span style={{
                    position: 'absolute', content: '""', height: '16px', width: '16px', left: config.enabled ? '20px' : '4px', bottom: '3px',
                    backgroundColor: '#000', transition: '.3s', borderRadius: '50%'
                  }}></span>
                </label>
              </div>

              {/* Parametrizações */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: '600' }}>Frequência</label>
                  <select
                    className="key-input"
                    value={config.frequency}
                    onChange={(e) => setConfig(prev => ({ ...prev, frequency: e.target.value }))}
                    style={{ width: '100%', cursor: 'pointer', appearance: 'auto' }}
                  >
                    <option value="minutes">A cada X minutos</option>
                    <option value="hours">A cada X horas</option>
                    <option value="days">A cada X dias</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: '600' }}>Valor do Intervalo</label>
                  <input
                    className="key-input"
                    type="number"
                    min={1}
                    value={config.interval_val}
                    onChange={(e) => setConfig(prev => ({ ...prev, interval_val: parseInt(e.target.value) || 1 }))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                    Backup a cada {config.interval_val} {getFreqLabel(config.frequency, config.interval_val)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: '600' }}>Pasta do Backup no S3</label>
                <input
                  className="key-input"
                  type="text"
                  value={config.s3_folder}
                  onChange={(e) => setConfig(prev => ({ ...prev, s3_folder: e.target.value }))}
                  style={{ width: '100%' }}
                  placeholder="Ex: backups/"
                />
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Subpasta onde os backups serão salvos no bucket do Backblaze S3. Ex: backups/ ou backups/cliente1/.</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: '600' }}>Retenção — Máximo de Backups no S3</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      className="key-input"
                      type="number"
                      min={1}
                      value={config.retention}
                      onChange={(e) => setConfig(prev => ({ ...prev, retention: parseInt(e.target.value) || 1 }))}
                      style={{ width: '80px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>backups — os mais antigos serão excluídos automaticamente.</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button className="btn btn-gold" onClick={handleSaveConfig} disabled={actionLoading} style={{ background: 'var(--purple-d)', borderColor: 'var(--purple)', color: 'var(--purple)' }}>
                  <svg style={{ marginRight: '6px' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  Salvar Configuração
                </button>
              </div>
            </>
          )}
        </div>

        {/* Painel 4: Lista de Backups */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {backups.length > 0 && (
                <input 
                  type="checkbox"
                  checked={paginatedBackups.length > 0 && paginatedBackups.every(b => selectedBackups.includes(b.filename))}
                  onChange={handleSelectAllToggle}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: 'var(--gold)',
                    margin: 0
                  }}
                />
              )}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Backups no S3 ({backups.length})
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {selectedBackups.length > 0 && (
                <button
                  onClick={() => setBulkDeleteModalOpen(true)}
                  className="btn"
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'opacity 0.2s'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  Excluir Selecionados ({selectedBackups.length})
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-3)' }}>
                <span>Exibir:</span>
                <select
                  value={displayCount}
                  onChange={(e) => {
                    setDisplayCount(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    background: 'var(--surface-d)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-2)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              
              <button 
                onClick={loadBackups} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }}
                title="Atualizar lista"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              </button>
            </div>
          </div>

          {loadingList ? (
            <div className="spinner"></div>
          ) : backups.length === 0 ? (
            <div className="empty" style={{ padding: '30px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>💾</div>
              <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>Nenhum backup encontrado no repositório.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {paginatedBackups.map(log => (
                <div 
                  key={log.id} 
                  style={{ 
                    background: 'var(--surface-d)', 
                    border: '1px solid var(--border2)', 
                    borderRadius: '8px', 
                    padding: '14px 16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.15s'
                  }}
                  className="backup-row"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <input 
                      type="checkbox"
                      checked={selectedBackups.includes(log.filename)}
                      onChange={() => handleSelectToggle(log.filename)}
                      style={{
                        width: '15px',
                        height: '15px',
                        cursor: 'pointer',
                        accentColor: 'var(--gold)',
                        flexShrink: 0
                      }}
                    />
                    <span 
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: log.status === 'success' ? '#22c55e' : '#f43f5e',
                        flexShrink: 0
                      }}
                      title={log.status === 'success' ? 'Sucesso' : 'Falhou'}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div 
                        style={{ 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          color: 'var(--text)', 
                          wordBreak: 'break-all',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={log.filename}
                      >
                        {log.filename}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                        {new Date(log.created_at).toLocaleString('pt-BR')} · {formatSize(log.size_bytes)}
                      </div>
                      {log.status === 'failed' && log.error_message && (
                        <div style={{ fontSize: '10px', color: '#f43f5e', marginTop: '4px', fontStyle: 'italic' }}>
                          Erro: {log.error_message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {log.status === 'success' && (
                      <>
                        <a 
                          href={`/api/backups/download/${log.filename}`} 
                          className="btn btn-outline btn-sm" 
                          style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)', padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                          title="Baixar Backup"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        </a>
                        <button 
                          className="btn btn-outline btn-sm" 
                          style={{ borderColor: 'var(--gold)', color: 'var(--gold)', padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                          onClick={() => confirmRestore(log.filename)}
                          title="Restaurar Banco de Dados"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                        </button>
                      </>
                    )}
                    <button 
                      className="btn-danger btn-sm" 
                      style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                      onClick={() => confirmDelete(log.filename)}
                      title="Deletar Backup"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* Paginação */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '16px' }}>
                  <button
                    className="page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`page-btn ${currentPage === p ? 'active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                      style={{
                        backgroundColor: currentPage === p ? 'var(--gold)' : '',
                        borderColor: currentPage === p ? 'var(--gold)' : '',
                        color: currentPage === p ? '#000' : ''
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Próximo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Modal: Confirmar Restauração */}
      {restoreModalOpen && (
        <div className="form-modal open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)' }}>
          <div className="form-box" style={{ maxWidth: '450px', width: '100%', textAlign: 'center', padding: '30px' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
            <div className="form-title" style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', letterSpacing: '0.05em' }}>CONFIRMAR RESTAURAÇÃO</div>
            <div className="settings-group-sub" style={{ marginBottom: '24px', fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.6' }}>
              Esta ação irá substituir todos os dados atuais do banco de dados PostgreSQL pelas informações contidas no arquivo <strong style={{ color: 'var(--text)' }}>{restoreFilename}</strong>.<br/>
              Isso pode causar perda de dados inseridos após a criação deste backup. Deseja continuar?
            </div>
            <div className="form-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setRestoreModalOpen(false)} style={{ flex: 1 }}>
                Cancelar
              </button>
              <button className="btn btn-gold" onClick={handleRestore} disabled={actionLoading} style={{ flex: 1, backgroundColor: 'var(--gold)', borderColor: 'var(--gold)', color: '#000', fontWeight: '600' }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão */}
      {deleteModalOpen && (
        <div className="form-modal open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)' }}>
          <div className="form-box" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '30px' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🗑️</div>
            <div className="form-title" style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', letterSpacing: '0.05em' }}>CONFIRMAR EXCLUSÃO</div>
            <div className="settings-group-sub" style={{ marginBottom: '24px', fontSize: '13px', color: 'var(--text-3)' }}>
              Tem certeza que deseja excluir permanentemente o arquivo <strong style={{ color: 'var(--text)' }}>{deleteFilename}</strong> do armazenamento Backblaze S3?
            </div>
            <div className="form-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setDeleteModalOpen(false)} style={{ flex: 1 }}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={actionLoading} style={{ flex: 1, fontWeight: '600' }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal: Confirmar Exclusão em Massa */}
      {bulkDeleteModalOpen && (
        <div className="form-modal open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)' }}>
          <div className="form-box" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '30px' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🗑️</div>
            <div className="form-title" style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', letterSpacing: '0.05em' }}>CONFIRMAR EXCLUSÃO</div>
            <div className="settings-group-sub" style={{ marginBottom: '24px', fontSize: '13px', color: 'var(--text-3)' }}>
              Tem certeza que deseja excluir permanentemente os <strong style={{ color: 'var(--text)' }}>{selectedBackups.length}</strong> backups selecionados do armazenamento Backblaze S3?
            </div>
            <div className="form-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setBulkDeleteModalOpen(false)} style={{ flex: 1 }}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleBulkDelete} disabled={actionLoading} style={{ flex: 1, fontWeight: '600' }}>
                Excluir todos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
