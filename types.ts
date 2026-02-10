
export enum ConflictStatus {
  ESCALATING = 'ESCALATING',
  STABLE = 'STABLE',
  DECLINING = 'DECLINING',
  RESOLVED = 'RESOLVED'
}

export enum ConflictType {
  ARMED_CONFLICT = 'Armed Conflict',
  CIVIL_WAR = 'Civil War',
  POLITICAL_VIOLENCE = 'Political Violence',
  TERRORISM = 'Terrorism',
  CIVIL_UNREST = 'Civil Unrest'
}

export enum ConnectionType {
  PROXY_WAR = 'PROXY_WAR',
  ARMS_FLOW = 'ARMS_FLOW',
  ALLIANCE = 'ALLIANCE',
  CYBER = 'CYBER',
  SPILLOVER = 'SPILLOVER'
}

export interface Hotspot {
  id: string;
  name: string;
  coordinates: [number, number];
  intensity: number; // 1-10
  description: string;
}

export interface Connection {
  id: string;
  source: string; // ISO Code
  target: string; // ISO Code
  type: ConnectionType;
  description: string;
}

export interface ConflictEvent {
  id: string;
  date: string;
  type: ConflictType;
  description: string;
  fatalities: number;
}

export interface ConflictDeepDetail {
  name: string;
  startDate: string;
  causes: string[];
  type: ConflictType;
  actors: string[];
  casualties: {
    civilian: number;
    military: number;
    total: number;
  };
  displacement: number;
  wikipediaContext: string;
  status: ConflictStatus;
}

export interface CountryIntelligence {
  isoCode: string;
  name: string;
  currentRuler: string;
  governmentType: string;
  severityScore: number;
  status: ConflictStatus;
  brief: string;
  activeConflicts: string[];
  keyActors: string[];
  totalFatalities: number;
  displacementData: string;
  timeline: ConflictEvent[];
  deepDetails: ConflictDeepDetail[];
  hotspots: Hotspot[];
}

export interface GlobalMetrics {
  activeConflicts: number;
  criticalConflicts: number;
  peopleDisplaced: string;
  totalFatalities: string;
}

export type ViewMode = 'simple' | 'analyst';
