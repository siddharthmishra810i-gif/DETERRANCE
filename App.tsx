
import React, { useState, useEffect } from 'react';
import MapContainer from './components/MapContainer';
import IntelligencePanel from './components/IntelligencePanel';
import GlobalSummaryBar from './components/GlobalSummaryBar';
import { ViewMode, Connection, GlobalMetrics } from './types';
import { fetchGlobalConflictUpdates, fetchIntelligenceConnections } from './services/geminiService';

const App: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<{ code: string; name: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [globalAlerts, setGlobalAlerts] = useState<string>('Initializing global monitors...');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [showConnections, setShowConnections] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<GlobalMetrics>({
    activeConflicts: 42,
    criticalConflicts: 12,
    peopleDisplaced: '114.2M',
    totalFatalities: '842K'
  });

  useEffect(() => {
    const loadData = async () => {
      const [updates, connData] = await Promise.all([
        fetchGlobalConflictUpdates(),
        fetchIntelligenceConnections()
      ]);
      setGlobalAlerts(updates);
      setConnections(connData);
    };
    loadData();
  }, []);

  const handleCountryClick = (code: string, name: string) => {
    setSelectedCountry({ code, name });
  };

  const handleConnectionClick = (conn: Connection) => {
    setNotification(`Decrypted Source: ${conn.description}`);
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden flex flex-col bg-[#020617] font-sans selection:bg-sky-500/30">
      {/* Notification Toast */}
      {notification && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] glass border-sky-500/40 text-sky-400 px-6 py-3 rounded-full text-xs font-bold mono animate-bounce shadow-2xl">
          SIGNAL_DECRYPTED: {notification}
        </div>
      )}

      {/* Header & Controls Overlay */}
      <header className="absolute top-0 left-0 w-full z-40 px-6 py-6 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-4 pointer-events-auto">
          {/* Logo Section */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-2 text-white">
              <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-xs italic shadow-lg shadow-sky-900/40">A</div>
              Aegis Intelligence
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 mono tracking-widest uppercase">Palantir-Class System v4.9.0</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            </div>
          </div>

          {/* Search & Summary Bar Container */}
          <div className="flex flex-col gap-2">
            <div className="w-80 glass p-1 rounded-xl flex items-center border border-white/10 shadow-xl">
              <svg className="w-4 h-4 ml-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Query Coordinates / Entity ID..." 
                className="bg-transparent border-none focus:ring-0 text-xs text-white placeholder-slate-600 w-full mono px-3 py-2"
              />
            </div>
            
            <GlobalSummaryBar metrics={metrics} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          {/* Main Controls */}
          <div className="glass flex p-1 rounded-xl border border-white/10 shadow-2xl">
            <button 
              onClick={() => setViewMode('simple')}
              className={`px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'simple' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}
            >
              Simple
            </button>
            <button 
              onClick={() => setViewMode('analyst')}
              className={`px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'analyst' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}
            >
              Analyst
            </button>
          </div>

          <div className="flex gap-2">
             <button 
              onClick={() => setShowConnections(!showConnections)}
              className={`glass px-4 py-2 rounded-lg border border-white/10 text-[10px] font-bold uppercase transition-all flex items-center gap-2 hover:bg-white/5 ${showConnections ? 'text-sky-400 border-sky-500/30' : 'text-slate-500'}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {showConnections ? 'Connections On' : 'Connections Off'}
            </button>
            
            <button 
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className="glass px-4 py-2 rounded-lg border border-white/10 text-[10px] font-bold uppercase text-amber-500 flex items-center gap-2 hover:bg-white/5 transition-all"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Intel Stream
            </button>
          </div>
        </div>
      </header>

      {/* Global Alerts Feed Overlay */}
      {isAlertsOpen && (
        <div className="absolute top-24 right-6 w-96 glass z-40 rounded-2xl border border-white/10 p-6 shadow-2xl backdrop-blur-3xl">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
            <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
            Satellite Comms // Alpha Feed
          </h3>
          <div className="text-[11px] leading-relaxed text-slate-300 max-h-[500px] overflow-y-auto whitespace-pre-wrap mono pr-2 scrollbar-thin scrollbar-thumb-slate-800">
            {globalAlerts}
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-600 mono">
            <span>T-Sigma: {new Date().toLocaleTimeString()}</span>
            <button onClick={() => setIsAlertsOpen(false)} className="hover:text-white uppercase font-bold tracking-widest">Close Channel</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative">
        <MapContainer 
          onCountryClick={handleCountryClick} 
          onConnectionClick={handleConnectionClick}
          connections={connections}
          showConnections={showConnections}
        />
        <IntelligencePanel 
          countryCode={selectedCountry?.code || null} 
          countryName={selectedCountry?.name || null}
          viewMode={viewMode}
          onClose={() => setSelectedCountry(null)}
        />
      </main>

      {/* Analyst Overlay Metrics */}
      {viewMode === 'analyst' && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 glass px-10 py-5 rounded-2xl flex items-center gap-16 border border-white/10 z-30 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-500 uppercase mono tracking-[0.2em] mb-1">Risk Entropy</span>
            <span className="text-2xl font-black text-white">42.8<span className="text-[10px] text-red-500 ml-1 font-bold">+1.2%</span></span>
          </div>
          <div className="w-px h-10 bg-white/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-500 uppercase mono tracking-[0.2em] mb-1">Proxy Nodes</span>
            <span className="text-2xl font-black text-sky-400">{connections.length}</span>
          </div>
          <div className="w-px h-10 bg-white/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-500 uppercase mono tracking-[0.2em] mb-1">Processing Load</span>
            <span className="text-2xl font-black text-emerald-500">14.2 TF</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
