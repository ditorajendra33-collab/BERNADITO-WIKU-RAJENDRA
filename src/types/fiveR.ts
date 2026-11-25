export type TabKey = 'sender' | 'hse' | 'dashboard';

export type FiveRAspectKey = 'ringkas' | 'rapi' | 'resik' | 'rawat' | 'rajin';

export type ReportStatus = 'pending' | 'reviewed';

export type HseGradeFilter = 'all' | 'good' | 'fair' | 'poor';

export type StatusFilter = 'all' | ReportStatus;

export interface AreaItem {
  code: string;
  name: string;
  dept: string;
  isCustomUser?: boolean;
}

export type FiveRPhotos = Record<FiveRAspectKey, string[]>;

export type FiveRScores = Record<FiveRAspectKey, number>;

export interface FiveRAspectMeta {
  key: FiveRAspectKey;
  code: string;
  shortTitle: string;
  title: string;
  desc: string;
}

export interface FiveRReport {
  id: string;
  status: ReportStatus;
  timestamp: string;
  branch: string;
  areaCode: string;
  areaName: string;
  dept: string;
  senderName: string;
  senderNotes: string;
  photos: FiveRPhotos;
  scores: FiveRScores | null;
  totalScore: number | null;
  avgScore: number | null;
  hseEvaluator: string;
  hseNotes: string;
  reviewedAt: string | null;
}

export interface AreaStat {
  branch: string;
  areaCode: string;
  areaName: string;
  dept: string;
  count: number;
  avg: number;
  pct: number;
  rAvgs: Record<FiveRAspectKey, string>;
  rPcts: Record<FiveRAspectKey, number>;
}
