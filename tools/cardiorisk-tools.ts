// /tools/cardiorisk-tools.ts

import { ScoreDefinition } from './types'; // Correct relative path

/**
 * Comprehensive Cardiology/CV Calculators
 * 
 * Each calculator is defined as a ScoreDefinition object.
 */
export const cardioRiskTools: ScoreDefinition[] = [
  {
    name: "Wells' Score for DVT",
    calcType: 'Diagnostic',
    description: "Estimates the clinical probability of deep vein thrombosis in the lower extremity.",
    fields: [
      { label: 'Active cancer (treatment within last 6 months)', type: 'boolean', key: 'cancer' },
      { label: 'Paralysis, paresis, or recent cast immobilization of lower extremities', type: 'boolean', key: 'paralysis' },
      { label: 'Bedridden ≥3 days or major surgery <12 weeks', type: 'boolean', key: 'bedridden' },
      { label: 'Localized tenderness along the deep venous system', type: 'boolean', key: 'tenderness' },
      { label: 'Entire leg swollen', type: 'boolean', key: 'entireSwollen' },
      { label: 'Calf swelling ≥3 cm compared with asymptomatic leg', type: 'boolean', key: 'calfSwelling' },
      { label: 'Pitting edema (confined to symptomatic leg)', type: 'boolean', key: 'edema' },
      { label: 'Collateral superficial veins (non-varicose)', type: 'boolean', key: 'collateralVeins' },
      { label: 'Alternative diagnosis at least as likely as DVT?', type: 'boolean', key: 'altLikely' },
    ],
    computeScore(values: Record<string, any>) {
      let score = 0;
      if (values.cancer) score += 1;
      if (values.paralysis) score += 1;
      if (values.bedridden) score += 1;
      if (values.tenderness) score += 1;
      if (values.entireSwollen) score += 1;
      if (values.calfSwelling) score += 1;
      if (values.edema) score += 1;
      if (values.collateralVeins) score += 1;
      if (values.altLikely) score -= 2;

      let interpretation = '';
      if (score <= 0) interpretation = 'Low probability (score ≤0).';
      else if (score >= 1 && score <= 2) interpretation = 'Moderate probability (score 1–2).';
      else if (score >= 3) interpretation = 'High probability (score ≥3).';

      return { score, interpretation };
    },
    nextSteps: {
      management: `If the probability is low, a d-dimer test can safely rule out DVT when negative. If the probability is moderate or high, proceed with venous ultrasound. A positive ultrasound confirms DVT, and anticoagulation therapy should be considered.`,
      criticalActions: `Always consider alternative diagnoses such as superficial thrombophlebitis, cellulitis, or muscle injury. Repeat ultrasound if negative but clinical suspicion remains high.`
    },
    evidence: {
      references: [
        'Wells PS, et al. Lancet. 1997;350:1795–1798.',
        'MDCalc: Wells’ Criteria for DVT.'
      ],
      commentary: `Wells’ Score for DVT is a well-validated clinical decision rule that helps categorize patients into low, moderate, or high probability.`
    }
  },

  // Add additional calculator definitions as needed...
];
