
import React, { useState, useEffect } from 'react';
import { CountryIntelligence, ViewMode, ConflictDeepDetail, ConflictStatus, ConflictType } from '../types';
import { fetchConflictBriefing, fetchMapsIntelligence } from '../services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface IntelligencePanelProps {
  countryCode: string | null;
  countryName: string | null;
  viewMode: ViewMode;
  onClose: () => void;
}

const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ countryCode, countryName, viewMode, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [mapsIntel, setMapsIntel] = useState<any>(null);
  const [mapsLoading, setMapsLoading] = useState(false);
  
  // Filtering states
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    if (countryName) {
      loadIntelligence();
    }
  }, [countryName]);

  const loadIntelligence = async () => {
    setLoading(true);
    const brief = await fetchConflictBriefing(countryName!);
    setData(brief);
    setLoading(false);
    
    if (brief?.hotspots?.length > 0) {
      const mainSpot = brief.hotspots[0];
      handleFetchMaps(mainSpot.name, mainSpot.coordinates[1], mainSpot.coordinates[0]);
    }
  };

  const handleFetchMaps = async (query: string, lat: number, lng: number) => {
    setMapsLoading(true);
    const intel = await fetchMapsIntelligence(query, lat, lng);
    setMapsIntel(intel);
    setMapsLoading(false);
  };

  const getTrend = () => {
    if (!data?.historicalTrends || data.historicalTrends.length < 2) return null;
    const current = data.historicalTrends[data.historicalTrends.length - 1].severity;
    const previous = data.historicalTrends[data.historicalTrends.length - 2].severity;
    const diff = current - previous;
    const percent = previous !== 0 ? (diff / previous) * 100 : 0;
    return { diff, percent: percent.toFixed(1) };
  };

  const exportToCSV = () => {
    if (!data?.deepDetails) return;
    const headers = ["Name", "Start Date", "Type", "Status", "Actors", "Total Casualties"];
    const rows = data.deepDetails.map((d: any) => [
      `"${d.name}"`,
      d.startDate,
      d.type,
      d.status,
      `"${d.actors?.join('; ')}"`,
      d.casualties?.total || 0
    ]);
    
    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Aegis_Intel_${countryCode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredConflicts = data?.deepDetails?.filter((c: any) => {
    const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const trend = getTrend();

  if (!countryCode) return null;

  return (
    <div className={`fixed top-0 right-0 h-full w-full md:w-[580px] glass z-50 transform transition-transform duration-500 ease-in-out border-l border-white/10 shadow-2xl flex flex-col`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/40">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">{countryName}</h2>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-[10px] text-slate-400 uppercase tracking-widest mono">{countryCode} // STRAT_ASSET_INTEL</p>
             <div className="w-1 h-1 rounded-full bg-sky-500"></div>
             <p className="text-[10px] text-sky-500 uppercase tracking-widest mono">{data?.governmentType || 'IDENTIFYING...'}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-32 bg-white/5 rounded-2xl w-full"></div>
            <div className="h-4 bg-white/5 rounded w-3/4"></div>
            <div className="h-48 bg-white/5 rounded-2xl w-full"></div>
          </div>
        ) : (
          <>
            {/* Leadership & High Level Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                   <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <p className="text-[9px] text-slate-500 uppercase mono mb-1 tracking-widest">Head of State</p>
                <p className="text-lg font-bold text-white leading-tight">{data?.currentRuler || 'Fetching...'}</p>
                <p className="text-[8px] text-sky-400 uppercase mt-1 mono">Verified Political Leader</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-[9px] text-slate-500 uppercase mono mb-1 tracking-widest">Risk Severity</p>
                <div className="flex items-end gap-2">
                  <span className={`text-3xl font-black ${data?.severityScore > 75 ? 'text-red-500' : 'text-amber-500'}`}>
                    {data?.severityScore || '--'}
                  </span>
                  {trend && (
                    <div className={`flex items-center gap-0.5 mb-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${trend.diff > 0 ? 'text-red-400 bg-red-900/20' : trend.diff < 0 ? 'text-emerald-400 bg-emerald-900/20' : 'text-slate-400 bg-slate-800'}`}>
                      {trend.diff > 0 ? '▲' : trend.diff < 0 ? '▼' : '●'}
                      {trend.percent}%
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                   <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${data?.status === 'ESCALATING' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                   <span className="text-[9px] font-bold text-slate-400 uppercase">{data?.status || 'STABLE'}</span>
                </div>
              </div>
            </div>

            {/* AI Summary Section */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-sky-400 rounded-full"></div>
                Integrated Situation Report
              </h3>
              <div className="text-sm leading-relaxed text-slate-300 bg-white/5 p-5 rounded-2xl border border-white/5 shadow-inner">
                {data?.brief}
              </div>
            </section>

            {/* Historical Trend Visualization */}
            {data?.historicalTrends && data.historicalTrends.length > 0 && (
              <section className="space-y-5">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                  Temporal Entropy Analysis // 5-Year Drift
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  {/* Severity Line Chart */}
                  <div className="bg-black/30 p-5 rounded-2xl border border-white/5 h-[220px]">
                    <p className="text-[9px] text-slate-500 uppercase mono mb-4 tracking-widest">Severity Score Trend</p>
                    <ResponsiveContainer width="100%" height="80%">
                      <AreaChart data={data.historicalTrends}>
                        <defs>
                          <linearGradient id="colorSev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                        <XAxis 
                          dataKey="year" 
                          stroke="#475569" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#475569" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                          domain={[0, 100]}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                          itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="severity" 
                          stroke="#ef4444" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#colorSev)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Conflict Count Line Chart */}
                  <div className="bg-black/30 p-5 rounded-2xl border border-white/5 h-[220px]">
                    <p className="text-[9px] text-slate-500 uppercase mono mb-4 tracking-widest">Active Conflict Density</p>
                    <ResponsiveContainer width="100%" height="80%">
                      <LineChart data={data.historicalTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                        <XAxis 
                          dataKey="year" 
                          stroke="#475569" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#475569" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                          itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
                        />
                        <Line 
                          type="stepAfter" 
                          dataKey="conflicts" 
                          stroke="#0ea5e9" 
                          strokeWidth={2} 
                          dot={{ fill: '#0ea5e9', r: 3 }}
                          activeDot={{ r: 5, stroke: '#fff', strokeWidth: 1 }}
                          animationDuration={2000}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}

            {/* Filtering Controls */}
            {data?.deepDetails && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    Dossier Filters
                  </h3>
                  <button 
                    onClick={() => { setTypeFilter('ALL'); setStatusFilter('ALL'); }}
                    className="text-[8px] text-sky-400 hover:text-white mono uppercase transition-colors"
                  >
                    Reset All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={typeFilter} 
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-slate-300 mono focus:ring-1 focus:ring-sky-500 outline-none"
                  >
                    <option value="ALL">ALL TYPES</option>
                    {Object.values(ConflictType).map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-slate-300 mono focus:ring-1 focus:ring-sky-500 outline-none"
                  >
                    <option value="ALL">ALL STATUS</option>
                    {Object.values(ConflictStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                </div>
              </section>
            )}

            {/* Conflict Dossier Cards */}
            {filteredConflicts && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></div>
                    Theater Intelligence ({filteredConflicts.length})
                  </h3>
                  <button 
                    onClick={exportToCSV}
                    className="text-[8px] flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-slate-400 hover:text-white transition-all mono uppercase"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    CSV Export
                  </button>
                </div>
                {filteredConflicts.length > 0 ? filteredConflicts.map((conflict: ConflictDeepDetail, idx: number) => (
                  <div key={idx} className="bg-slate-900/80 rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all hover:border-white/20 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="px-5 py-3 bg-white/5 flex justify-between items-center border-b border-white/5">
                      <div className="flex flex-col">
                         <h4 className="font-black text-slate-100 text-xs uppercase tracking-wider">{conflict.name}</h4>
                         <span className="text-[8px] text-slate-500 mono">UID: #{idx + 8800}</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${conflict.status === ConflictStatus.ESCALATING ? 'bg-red-500/20 text-red-500' : 'bg-sky-500/20 text-sky-500'}`}>
                        {conflict.status}
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                            <p className="text-[8px] text-slate-500 uppercase mono mb-0.5">Primary Actors</p>
                            <div className="flex flex-wrap gap-1">
                               {conflict.actors?.map((a, i) => <span key={i} className="text-[9px] text-slate-300 font-bold">{a}{i < conflict.actors.length-1 ? ',' : ''}</span>)}
                            </div>
                         </div>
                         <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                            <p className="text-[8px] text-slate-500 uppercase mono mb-0.5">Casualties (Aggregated)</p>
                            <p className="text-xs font-black text-red-500">{conflict.casualties?.total?.toLocaleString() || 'UNK'}</p>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <p className="text-[8px] text-slate-500 uppercase mono">Geopolitical Root Causes</p>
                         <div className="flex flex-wrap gap-1.5">
                           {conflict.causes.map((cause, i) => (
                             <span key={i} className="px-2 py-0.5 bg-white/5 text-slate-400 text-[9px] rounded-full border border-white/5">{cause}</span>
                           ))}
                         </div>
                      </div>

                      <div className="text-[11px] text-slate-400 leading-relaxed border-l-2 border-sky-500/30 pl-4 py-1 italic">
                        {conflict.wikipediaContext}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-10 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-[10px] text-slate-500 uppercase mono tracking-widest text-center">No dossier entries matching current filter set.</p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-slate-900/60 border-t border-white/10 flex gap-4">
        <button onClick={exportToCSV} className="flex-1 bg-white hover:bg-slate-200 text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-xl">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export Full Signal
        </button>
      </div>
    </div>
  );
};

export default IntelligencePanel;
