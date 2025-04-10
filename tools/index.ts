import { ScoreDefinition } from './types';

// Import each category file
import { cardioRiskTools } from './cardiorisk-tools';
import { pulmonaryTools } from './pulmonary-tools';
import { giTools } from './gi-tools';
import { neuroTools } from './neuro-tools';
import { endocrinologyTools } from './endocrinology-tools';
import { obgynTools } from './obgyn-tools';

// Potential placeholders for additional categories
export const urologyTools: ScoreDefinition[] = [];
export const hematologyTools: ScoreDefinition[] = [];
export const infectiousDiseaseTools: ScoreDefinition[] = [];
export const psychiatryTools: ScoreDefinition[] = [];
export const orthopedicTraumaTools: ScoreDefinition[] = [];
export const criticalCareTools: ScoreDefinition[] = [];
export const nephrologyTools: ScoreDefinition[] = [];
export const nutritionMetabolismTools: ScoreDefinition[] = [];
export const miscellaneousTools: ScoreDefinition[] = [];

// Merge them all into one big array
export const ALL_TOOLS: ScoreDefinition[] = [
  ...cardioRiskTools,
  ...pulmonaryTools,
  ...giTools,
  ...neuroTools,
  ...endocrinologyTools,
  ...obgynTools,
  ...urologyTools,
  ...hematologyTools,
  ...infectiousDiseaseTools,
  ...psychiatryTools,
  ...orthopedicTraumaTools,
  ...criticalCareTools,
  ...nephrologyTools,
  ...nutritionMetabolismTools,
  ...miscellaneousTools,
];
