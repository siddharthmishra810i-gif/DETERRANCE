
import React, { useState, useEffect } from 'react';
import { CountryIntelligence, ViewMode, ConflictDeepDetail, ConflictStatus } from '../types';
import { fetchConflictBriefing, fetchMapsIntelligence } from '../services/geminiService';

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
    
    // Auto-fetch maps intel for the capital or active hotspots
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
                  <span className="text-xs text-slate-600 mb-1 font-bold">/ 100</span>
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

            {/* Geospatial Grounding (Google Maps Tool) */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                Geospatial Grounding // Maps Signal
              </h3>
              {mapsLoading ? (
                <div className="h-20 glass rounded-xl flex items-center justify-center animate-pulse">
                  <span className="text-[10px] text-slate-500 mono">QUERYING GOOGLE MAPS NODE...</span>
                </div>
              ) : mapsIntel ? (
                <div className="bg-sky-950/20 border border-sky-500/20 rounded-2xl p-4 space-y-4">
                  <div className="text-[11px] text-sky-200 leading-relaxed italic mono">
                    {mapsIntel.text}
                  </div>
                  {mapsIntel.groundingChunks?.length > 0 && (
                    <div className="flex flex-col gap-2 border-t border-sky-500/10 pt-3">
                      <p className="text-[8px] text-slate-500 uppercase mono">Verified Tactical Locations</p>
                      {mapsIntel.groundingChunks.map((chunk: any, i: number) => {
                        if (chunk.maps) {
                          return (
                            <a 
                              key={i} 
                              href={chunk.maps.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-sky-400 hover:text-sky-300 underline flex items-center gap-2 bg-sky-900/20 p-2 rounded-lg transition-colors border border-sky-500/10"
                            >
                              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                              <span className="truncate">{chunk.maps.title}</span>
                            </a>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[9px] text-slate-600 mono italic">No tactical place data available for this sector.</div>
              )}
            </section>

            {/* Conflict Dossier Cards */}
            {data?.deepDetails && (
              <section className="space-y-5">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></div>
                  Theater Intelligence (Conflict Dossiers)
                </h3>
                {data.deepDetails.map((conflict: ConflictDeepDetail, idx: number) => (
                  <div key={idx} className="bg-slate-900/80 rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all hover:border-white/20">
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
                ))}
              </section>
            )}
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-slate-900/60 border-t border-white/10 flex gap-4">
        <button className="flex-1 bg-white hover:bg-slate-200 text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-xl">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export Full Signal
        </button>
      </div>
    </div>
  );
};

export default IntelligencePanel;
