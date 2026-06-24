import React from 'react';

export default function BrandingTab({
  brandingData,
  setBrandingData
}) {
  return (
    <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="key-group">
        <div className="key-group-title">Logomarca & Cabeçalho</div>

        <div className="key-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
          <div className="key-label" style={{ marginBottom: '4px' }}>Nome da Empresa (Título da Aba & Sidebar)</div>
          <input
            className="key-input"
            type="text"
            value={brandingData.companyName || ''}
            onChange={(e) => setBrandingData(prev => ({ ...prev, companyName: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px' }}
            placeholder="Ex: FONTE OCULTA"
          />
        </div>
        
        <div className="key-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
          <div className="key-label" style={{ marginBottom: '4px' }}>Texto da Logomarca</div>
          <input
            className="key-input"
            type="text"
            value={brandingData.logoText}
            onChange={(e) => setBrandingData(prev => ({ ...prev, logoText: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px' }}
            placeholder="Ex: FONTE OCULTA"
          />
        </div>

        <div className="key-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
          <div className="key-label" style={{ marginBottom: '4px' }}>Subtítulo da Logomarca</div>
          <input
            className="key-input"
            type="text"
            value={brandingData.logoSub}
            onChange={(e) => setBrandingData(prev => ({ ...prev, logoSub: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px' }}
            placeholder="Ex: Produção"
          />
        </div>

        <div className="key-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="key-label">Tamanho da Fonte (Logo)</div>
            <input
              className="key-input"
              type="text"
              value={brandingData.logoSize}
              onChange={(e) => setBrandingData(prev => ({ ...prev, logoSize: e.target.value }))}
              placeholder="Ex: 16px"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="key-label">Cor do Texto (Logo)</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={brandingData.logoColor && brandingData.logoColor.startsWith('#') ? brandingData.logoColor : '#ffffff'}
                onChange={(e) => setBrandingData(prev => ({ ...prev, logoColor: e.target.value }))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  padding: 0
                }}
              />
              <input
                className="key-input"
                type="text"
                value={brandingData.logoColor}
                onChange={(e) => setBrandingData(prev => ({ ...prev, logoColor: e.target.value }))}
                style={{ flex: 1 }}
                placeholder="Ex: #ffffff"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="key-group">
        <div className="key-group-title">Textos do Carrossel (Slides & Visualização)</div>

        <div className="key-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="key-label">Tamanho do Texto (Carrossel)</div>
            <input
              className="key-input"
              type="text"
              value={brandingData.carouselTextSize}
              onChange={(e) => setBrandingData(prev => ({ ...prev, carouselTextSize: e.target.value }))}
              placeholder="Ex: 14px"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="key-label">Cor do Texto (Carrossel)</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={brandingData.carouselTextColor && brandingData.carouselTextColor.startsWith('#') ? brandingData.carouselTextColor : '#ffffff'}
                onChange={(e) => setBrandingData(prev => ({ ...prev, carouselTextColor: e.target.value }))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  padding: 0
                }}
              />
              <input
                className="key-input"
                type="text"
                value={brandingData.carouselTextColor}
                onChange={(e) => setBrandingData(prev => ({ ...prev, carouselTextColor: e.target.value }))}
                style={{ flex: 1 }}
                placeholder="Ex: #ffffff"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="key-group">
        <div className="key-group-title">Painel de Demonstração (Fundo Branco)</div>
        <div className="settings-group-sub">Visualize em tempo real como o texto do carrossel e o título ficarão aplicados sobre uma imagem ou slide de fundo branco</div>
        <div style={{
          background: '#ffffff',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          marginTop: '10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '140px',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{
            fontSize: brandingData.logoSize ? (brandingData.logoSize.trim().match(/^\d+$/) ? `${brandingData.logoSize.trim()}px` : brandingData.logoSize) : '13px',
            color: brandingData.logoColor,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.85)',
            borderRadius: '4px'
          }}>
            {brandingData.companyName || brandingData.logoText || 'LOGOMARCA'}
          </div>
          <div style={{
            fontSize: brandingData.carouselTextSize ? (brandingData.carouselTextSize.trim().match(/^\d+$/) ? `${brandingData.carouselTextSize.trim()}px` : brandingData.carouselTextSize) : '15px',
            color: brandingData.carouselTextColor,
            fontWeight: '500',
            textAlign: 'center',
            maxWidth: '80%',
            lineHeight: '1.5',
            wordBreak: 'break-word',
            padding: '8px',
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '6px'
          }}>
            Este é um texto de exemplo do Carrossel para você validar o contraste e o tamanho da fonte sobre o fundo branco.
          </div>
        </div>
      </div>
    </div>
  );
}
