
import { ConflictStatus, ConflictType } from './types';

export const INITIAL_STATS = {
  activeConflicts: 42,
  totalFatalities24h: 128,
  highRiskRegions: 8
};

export const SEVERITY_COLORS: Record<string, string> = {
  low: '#10b981', // Emerald 500
  medium: '#f59e0b', // Amber 500
  high: '#ef4444', // Red 500
  critical: '#7f1d1d' // Red 900
};

export const MOCK_COUNTRY_DATA: Record<string, any> = {
  "UKR": {
    name: "Ukraine",
    severityScore: 94,
    status: ConflictStatus.ESCALATING,
    activeConflicts: ["Russo-Ukrainian War"],
    keyActors: ["Armed Forces of Ukraine", "Russian Armed Forces", "Wagner Group"],
    totalFatalities: 500000,
    displacementData: "6.3 million refugees, 5 million IDPs",
    timeline: [
      { id: '1', date: '2024-03-15', type: ConflictType.ARMED_CONFLICT, description: 'Major offensive in Kharkiv region', fatalities: 450 },
      { id: '2', date: '2024-02-24', type: ConflictType.ARMED_CONFLICT, description: 'Anniversary of full-scale invasion escalation', fatalities: 120 }
    ]
  },
  "SDN": {
    name: "Sudan",
    severityScore: 88,
    status: ConflictStatus.ESCALATING,
    activeConflicts: ["Sudanese Civil War"],
    keyActors: ["Sudanese Armed Forces (SAF)", "Rapid Support Forces (RSF)"],
    totalFatalities: 15000,
    displacementData: "8.1 million newly displaced",
    timeline: [
      { id: '1', date: '2024-04-10', type: ConflictType.CIVIL_WAR, description: 'Intense fighting in El Fasher', fatalities: 200 }
    ]
  }
};
