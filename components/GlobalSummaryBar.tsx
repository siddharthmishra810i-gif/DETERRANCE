
import React from 'react';
import { GlobalMetrics } from '../types';

interface Props {
  metrics: GlobalMetrics;
}

const GlobalSummaryBar: React.FC<Props> = ({ metrics }) => {
  return (
    <div className="flex items-center gap-6 px-4 py-2 glass rounded-lg border border-white/10 pointer-events-auto select-none">
      <div className="flex flex-col border-r border-white/10 pr-6">
        <span className="text-[9px] text-slate-500 uppercase mono tracking-tighter">Active Conflicts</span>
        <span className="text-sm font-bold text-white tracking-tight">{metrics.activeConflicts}</span>
      </div>
      <div className="flex flex-col border-r border-white/10 pr-6">
        <span className="text-[9px] text-slate-500 uppercase mono tracking-tighter">Critical Threshold</span>
        <span className="text-sm font-bold text-red-500 tracking-tight">{metrics.criticalConflicts}</span>
      </div>
      <div className="flex flex-col border-r border-white/10 pr-6">
        <span className="text-[9px] text-slate-500 uppercase mono tracking-tighter">Total Displaced</span>
        <span className="text-sm font-bold text-sky-400 tracking-tight">{metrics.peopleDisplaced}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] text-slate-500 uppercase mono tracking-tighter">Global Fatalities (Est)</span>
        <span className="text-sm font-bold text-white tracking-tight">{metrics.totalFatalities}</span>
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="text-[8px] mono text-emerald-500/80 uppercase">Satellite Link Stable</span>
      </div>
    </div>
  );
};

export default GlobalSummaryBar;
