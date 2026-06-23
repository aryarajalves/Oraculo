import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Oraculo from './components/Oraculo';
import Criador from './components/Criador';
import ReelsCloner from './components/ReelsCloner';
import Calendar from './components/Calendar';
import Settings from './components/Settings';
import VideoFactory from './components/VideoFactory';
import Radar from './components/Radar';
import Lightbox from './components/Lightbox';
import NewCarouselModal from './components/NewCarouselModal';
import EditSlideModal from './components/EditSlideModal';
import LiveGenPanel from './components/LiveGenPanel';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'carrosseis';
  });

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);
  const [allCarousels, setAllCarousels] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Modais
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newModalDefaults, setNewModalDefaults] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCarouselId, setEditCarouselId] = useState('');
  const [editFilename, setEditFilename] = useState('');

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxCarouselId, setLightboxCarouselId] = useState('');
  const [lightboxSlides, setLightboxSlides] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Live Session Panel
  const [liveSession, setLiveSession] = useState(null);

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastShow, setToastShow] = useState(false);

  useEffect(() => {
    loadCarousels();
    loadStats();
    setupSSE();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastShow(true);
    setTimeout(() => setToastShow(false), 2500);
  };

  const loadCarousels = async () => {
    try {
      const res = await fetch('/api/carousels');
      const data = await res.json();
      setAllCarousels(data);
    } catch (e) {
      showToast('Erro ao carregar carrosséis.');
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      showToast('Erro ao carregar estatísticas.');
    }
  };

  const setupSSE = () => {
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = function(event) {
      try {
        const obj = JSON.parse(event.data);
        if (obj.type === 'start') {
          setLiveSession({
            carouselId: obj.carouselId,
            total: obj.total,
            slides: [],
            visible: true,
            expanded: false
          });
        } else if (obj.type === 'slide') {
          setLiveSession(prev => {
            if (!prev) return prev;
            // update or add slide
            const slides = [...prev.slides];
            const idx = slides.findIndex(s => s.num === obj.num);
            const slideData = {
              num: obj.num,
              estado: obj.estado,
              filename: obj.filename,
              title_text: obj.title_text,
              status: obj.status === 'ok' ? 'ok' : obj.status === 'erro' ? 'error' : 'loading',
              timestamp: Date.now()
            };
            if (idx >= 0) slides[idx] = slideData;
            else slides.push(slideData);
            return { ...prev, slides };
          });
        } else if (obj.type === 'done' || obj.type === 'registered') {
          // reload carousels on completion
          loadCarousels();
          loadStats();
        }
      } catch (e) {}
    };
    return () => eventSource.close();
  };

  const handleCreateCarousel = async (payload) => {
    try {
      const res = await fetch('/api/carousels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Carrossel criado com sucesso!');
        loadCarousels();
        loadStats();
      }
    } catch (e) {
      showToast('Erro ao criar carrossel.');
    }
  };

  const handleStartGeneration = async (carouselText) => {
    // Parse output
    const parser = (text) => {
      const t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const temaMatch = t.match(/TEMA:\s*(.+)/i);
      const pracaMatch = t.match(/PRA[ÇC]A:\s*(.+)/i);
      const bigIdea = t.match(/BIG IDEA:\s*(.+)/i);
      const revisorMatch = t.match(/TOTAL:\s*([\d]+\/15)/i);
      const captionMatch = t.match(/CAPTION[^:\n]*:\s*\n([\s\S]+?)(?=\nCTA TRIBAL|━)/i);
      const ctaMatch = t.match(/CTA TRIBAL:\s*"([^"\n]+)"/i);
      const title = temaMatch ? temaMatch[1].trim().slice(0, 80) : 'Carrossel Fonte Oculta';
      const caption = (captionMatch?.[1] || bigIdea?.[1] || '').trim().slice(0, 800);

      const slides = [];
      const lines = t.split('\n');
      const slideHeader = /^\[S(\d+)\s*[—–\-]+\s*([^\]|]+?)(?:\s*\|\s*layout:\s*(\w+))?\s*\]/i;
      let current = null;
      let field = null;

      const flush = () => {
        if (current && current.title) {
          slides.push({
            num: current.num,
            estado: current.estado,
            layout: current.layout,
            title: current.title.trim(),
            body: current.body.trim(),
            prompt: current.prompt.trim(),
          });
        }
      };

      for (const raw of lines) {
        const line = raw.trim();
        const hm = line.match(slideHeader);
        if (hm) {
          flush();
          current = {
            num: hm[1].padStart(2, '0'),
            estado: hm[2].trim().replace(/[^\w\s]/g, '').trim().toUpperCase(),
            layout: (hm[3] || 'fullbleed').trim(),
            title: '', body: '', prompt: '',
          };
          field = null;
          continue;
        }
        if (!current) continue;
        if (/^T[IÍ]TULO:\s*/i.test(line)) {
          field = 'title';
          current.title = line.replace(/^T[IÍ]TULO:\s*/i, '');
          continue;
        }
        if (/^CORPO:\s*/i.test(line)) {
          field = 'body';
          current.body = line.replace(/^CORPO:\s*/i, '');
          continue;
        }
        if (/^VISUAL:\s*/i.test(line)) {
          field = 'prompt';
          current.prompt = line.replace(/^VISUAL:\s*/i, '');
          continue;
        }
        if (line === '') {
          if (field === 'prompt') field = null;
          continue;
        }
        if (field === 'title') current.title += '\n' + line;
        if (field === 'body') current.body += '\n' + line;
        if (field === 'prompt') current.prompt += ' ' + line;
      }
      flush();

      return {
        title,
        theme: title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-').slice(0, 48),
        format: pracaMatch?.[1]?.trim().slice(0, 20) || 'B',
        caption,
        notes: ctaMatch?.[1]?.trim() || '',
        revisor_score: revisorMatch?.[1] || '',
        slides,
      };
    };

    const payload = parser(carouselText);
    if (payload.slides.length === 0) {
      alert('Não consegui extrair slides do carrossel!');
      return;
    }

    try {
      const res = await fetch('/api/criador/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('✦ Pipeline de geração iniciado!');
      }
    } catch (e) {
      showToast('Erro ao iniciar pipeline.');
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewCarousel={() => { setNewModalDefaults(null); setNewModalOpen(true); }}
      />

      <div className="main-area">
        <header className="main-header">
          <div className="page-title" style={{ textTransform: 'capitalize' }}>
            {activeTab === 'configuracoes' ? 'Configurações' : activeTab === 'fabrica' ? 'Fábrica de Vídeos' : activeTab}
          </div>
          <div className="header-actions">
            <button className="btn btn-ghost" onClick={() => window.location.reload()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              Atualizar
            </button>
          </div>
        </header>

        {activeTab === 'carrosseis' && (
          <Dashboard
            allCarousels={allCarousels}
            stats={stats}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onOpenLightbox={(id, slides, idx) => {
              setLightboxCarouselId(id);
              setLightboxSlides(slides);
              setLightboxIndex(idx);
              setLightboxOpen(true);
            }}
            onOpenEditModal={(id, filename) => {
              setEditCarouselId(id);
              setEditFilename(filename);
              setEditModalOpen(true);
            }}
            onLoadCarousels={loadCarousels}
            showToast={showToast}
          />
        )}

        {activeTab === 'calendario' && (
          <Calendar
            allCarousels={allCarousels}
            onLoadCarousels={loadCarousels}
            showToast={showToast}
          />
        )}

        {activeTab === 'reels' && (
          <ReelsCloner
            onOpenNewModal={(defaults) => {
              setNewModalDefaults(defaults);
              setNewModalOpen(true);
            }}
            showToast={showToast}
          />
        )}

        {activeTab === 'oraculo' && <Oraculo showToast={showToast} />}
        {activeTab === 'radar' && <Radar showToast={showToast} />}
        {activeTab === 'fabrica' && <VideoFactory />}
        {activeTab === 'criador' && <Criador onStartGeneration={handleStartGeneration} showToast={showToast} />}
        {activeTab === 'configuracoes' && <Settings showToast={showToast} />}
      </div>

      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => { setLightboxOpen(false); loadCarousels(); }}
        carouselId={lightboxCarouselId}
        slides={lightboxSlides}
        initialIndex={lightboxIndex}
        onOpenEditModal={(id, filename) => {
          setEditCarouselId(id);
          setEditFilename(filename);
          setEditModalOpen(true);
        }}
        showToast={showToast}
      />

      <NewCarouselModal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onCreate={handleCreateCarousel}
        defaults={newModalDefaults}
      />

      <EditSlideModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); loadCarousels(); }}
        carouselId={editCarouselId}
        filename={editFilename}
        showToast={showToast}
      />

      <LiveGenPanel
        liveSession={liveSession}
        setLiveSession={setLiveSession}
        onOpenLightbox={(id, slides, idx) => {
          setLightboxCarouselId(id);
          setLightboxSlides(slides);
          setLightboxIndex(idx);
          setLightboxOpen(true);
        }}
      />

      <div className={`toast ${toastShow ? 'show' : ''}`} id="toast">
        {toastMessage}
      </div>
    </div>
  );
}
