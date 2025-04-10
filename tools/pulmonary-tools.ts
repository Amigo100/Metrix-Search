// /tools/pulmonary-tools.ts

import { ScoreDefinition } from './types';

export const pulmonaryTools: ScoreDefinition[] = [
  {
    name: 'PERC Rule (Pulmonary Embolism Rule-out Criteria)',
    calcType: 'Diagnostic',
    description: 'Rules out PE in low-risk patients using eight clinical criteria. If all are negative, further testing may be unnecessary.',
    fields: [
      { label: 'Age <50 years?', type: 'boolean', key: 'ageUnder50' },
      { label: 'Heart rate <100 bpm?', type: 'boolean', key: 'hrUnder100' },
      { label: 'O₂ saturation ≥95%?', type: 'boolean', key: 'satOver95' },
      { label: 'No hemoptysis?', type: 'boolean', key: 'noHemoptysis' },
      { label: 'No estrogen use?', type: 'boolean', key: 'noEstrogen' },
      { label: 'No prior DVT/PE?', type: 'boolean', key: 'noPriorDvtPe' },
      { label: 'No unilateral leg swelling?', type: 'boolean', key: 'noLegSwelling' },
      { label: 'No recent surgery/trauma requiring hospitalization ≥4 days?', type: 'boolean', key: 'noRecentSurgery' },
    ],
    computeScore(values) {
      // The PERC is “negative” only if all 8 criteria are true.
      // We define a "score" as the count of missed criteria for clarity.
      let missedCount = 0;
      const keys = [
        'ageUnder50',
        'hrUnder100',
        'satOver95',
        'noHemoptysis',
        'noEstrogen',
        'noPriorDvtPe',
        'noLegSwelling',
        'noRecentSurgery',
      ];
      keys.forEach((k) => {
        if (!values[k]) missedCount++;
      });

      const interpretation =
        missedCount === 0
          ? 'PERC negative: PE risk very low in a low-clinical-probability patient.'
          : `PERC positive: ${missedCount} criterion(ia) not met; consider d-dimer or imaging.`;

      return { score: missedCount, interpretation };
    },
    nextSteps: {
      management: `If PERC is negative in a patient with low clinical suspicion, further testing for PE is often unnecessary. If PERC is positive or suspicion is moderate/high, proceed with d-dimer testing or imaging (CT-angiography or V/Q scan).`,
      criticalActions: `Apply the PERC rule only when pre-test probability is truly low. No decision tool overrides strong clinical suspicion; if suspicion for PE remains high, imaging is warranted regardless of PERC.`
    },
    evidence: {
      references: [
        'Kline JA, et al. J Thromb Haemost. 2004;2(8):1247–1255.',
        'MDCalc: PERC Rule for Pulmonary Embolism.'
      ],
      commentary: `The PERC rule is validated for ruling out PE in low-risk patients, reducing unnecessary imaging.`
    }
  },

  {
    name: 'Revised Geneva Score (for Pulmonary Embolism)',
    calcType: 'Diagnostic',
    description: 'An entirely objective scoring system for assessing the probability of pulmonary embolism.',
    fields: [
      { label: 'Age >65 years?', type: 'boolean', key: 'ageOver65' },  // +1
      { label: 'Previous DVT/PE?', type: 'boolean', key: 'priorDvtPe' }, // +3
      { label: 'Recent surgery/fracture (<1 month)?', type: 'boolean', key: 'recentSurgFrac' }, // +2
      { label: 'Active malignancy?', type: 'boolean', key: 'malignancy' }, // +2
      { label: 'Unilateral lower limb pain?', type: 'boolean', key: 'unilatPain' }, // +3
      { label: 'Pain on deep venous palpation & unilateral edema?', type: 'boolean', key: 'deepVenousSign' }, // +4
      { label: 'Heart rate (select range)', type: 'select', key: 'hrRange', options: ['<75', '75–94', '≥95'] },
    ],
    computeScore(values) {
      let score = 0;
      if (values.ageOver65) score += 1;
      if (values.priorDvtPe) score += 3;
      if (values.recentSurgFrac) score += 2;
      if (values.malignancy) score += 2;
      if (values.unilatPain) score += 3;
      if (values.deepVenousSign) score += 4;

      // Heart Rate
      if (values.hrRange === '75–94') score += 3;
      else if (values.hrRange === '≥95') score += 5;

      let interpretation = '';
      if (score <= 3) interpretation = 'Low probability (score ≤3).';
      else if (score <= 10) interpretation = 'Intermediate probability (4–10).';
      else interpretation = 'High probability (≥11).';

      return { score, interpretation };
    },
    nextSteps: {
      management: `Use d-dimer testing to rule out PE in low or intermediate probability if negative. In high probability or positive d-dimer, proceed with imaging. The Revised Geneva Score is fully objective (no subjective “PE is #1 diagnosis”).`,
      criticalActions: `Regardless of score, if clinical suspicion differs significantly, rely on imaging. The Revised Geneva Score is intended to reduce unnecessary imaging in low- to intermediate-risk patients.`
    },
    evidence: {
      references: [
        'Le Gal G, et al. Ann Intern Med. 2006;144(3):165–171.',
        'MDCalc: Revised Geneva Score.'
      ],
      commentary: `The Revised Geneva Score replaces subjective criteria with purely objective variables for PE risk stratification.`
    }
  },

  {
    name: 'PESI (Pulmonary Embolism Severity Index)',
    calcType: 'Diagnostic',
    description: 'Predicts 30-day mortality in acute PE using demographics, comorbidities, and vital signs. Higher risk classes correlate with higher mortality.',
    fields: [
      { label: 'Age (in years)', type: 'number', key: 'age' },
      { label: 'Male sex?', type: 'boolean', key: 'male' }, // +10
      { label: 'Cancer?', type: 'boolean', key: 'cancer' }, // +30
      { label: 'Chronic heart failure?', type: 'boolean', key: 'chf' }, // +10
      { label: 'Chronic lung disease?', type: 'boolean', key: 'cld' }, // +10
      { label: 'Pulse ≥110 bpm?', type: 'boolean', key: 'hrOver110' }, // +20
      { label: 'Systolic BP <100 mmHg?', type: 'boolean', key: 'sbpUnder100' }, // +30
      { label: 'Respiratory rate ≥30/min?', type: 'boolean', key: 'rrOver30' }, // +20
      { label: 'Temperature <36°C?', type: 'boolean', key: 'tempUnder36' }, // +20
      { label: 'O₂ sat <90%?', type: 'boolean', key: 'satUnder90' }, // +20
    ],
    computeScore(values) {
      let s = 0;
      s += Number(values.age) || 0; // age in years
      if (values.male) s += 10;
      if (values.cancer) s += 30;
      if (values.chf) s += 10;
      if (values.cld) s += 10;
      if (values.hrOver110) s += 20;
      if (values.sbpUnder100) s += 30;
      if (values.rrOver30) s += 20;
      if (values.tempUnder36) s += 20;
      if (values.satUnder90) s += 20;

      let interpretation = '';
      // Class determination:
      // I: ≤65, II: 66–85, III: 86–105, IV: 106–125, V: >125
      if (s <= 65) interpretation = `Class I (≤65): Very low 30-day mortality. Score = ${s}.`;
      else if (s <= 85) interpretation = `Class II (66–85): Low mortality. Score = ${s}.`;
      else if (s <= 105) interpretation = `Class III (86–105): Intermediate risk. Score = ${s}.`;
      else if (s <= 125) interpretation = `Class IV (106–125): High risk. Score = ${s}.`;
      else interpretation = `Class V (>125): Very high risk. Score = ${s}.`;

      return { score: s, interpretation };
    },
    nextSteps: {
      management: `Low PESI classes (I–II) may be candidates for outpatient management if otherwise stable. Intermediate and higher classes (III–V) generally benefit from hospital admission, and higher classes (≥IV) may require ICU-level care.`,
      criticalActions: `PESI is a prognostic tool that guides site-of-care decisions for acute PE. Do not rely solely on PESI for discharge if other clinical factors suggest caution.`
    },
    evidence: {
      references: [
        'Aujesky D, Obrosky DS, et al. Lancet. 2005;365(9454): 1363–1369.',
        'MDCalc: PESI.'
      ],
      commentary: `PESI classifies PE patients into risk tiers for short-term mortality, helping clinicians determine outpatient vs inpatient care.`
    }
  },

  {
    name: 'sPESI (Simplified PESI)',
    calcType: 'Diagnostic',
    description: 'A simplified version of PESI that uses six binary variables to predict 30-day mortality in PE.',
    fields: [
      { label: 'Age >80 years?', type: 'boolean', key: 'ageOver80' },
      { label: 'History of cancer?', type: 'boolean', key: 'cancer' },
      { label: 'Chronic cardiopulmonary disease?', type: 'boolean', key: 'cardiopulm' },
      { label: 'Heart rate ≥110 bpm?', type: 'boolean', key: 'hrOver110' },
      { label: 'Systolic BP <100 mmHg?', type: 'boolean', key: 'sbpUnder100' },
      { label: 'O₂ sat <90%?', type: 'boolean', key: 'satUnder90' },
    ],
    computeScore(values) {
      let s = 0;
      if (values.ageOver80) s++;
      if (values.cancer) s++;
      if (values.cardiopulm) s++;
      if (values.hrOver110) s++;
      if (values.sbpUnder100) s++;
      if (values.satUnder90) s++;

      let interpretation = '';
      if (s === 0) interpretation = 'Low risk (sPESI = 0). 30-day mortality is very low. Possibly outpatient care.';
      else interpretation = `High risk (sPESI ≥1). Score = ${s}. 30-day mortality is increased, consider hospital admission.`;

      return { score: s, interpretation };
    },
    nextSteps: {
      management: `sPESI = 0 often indicates low enough risk to consider outpatient management if stable. sPESI ≥1 suggests in-hospital treatment and closer monitoring. Always consider comorbidities and social factors.`,
      criticalActions: `Simplified PESI is easy to calculate and well validated. Do not discharge patients solely on sPESI = 0 if other unstable features are present.`
    },
    evidence: {
      references: [
        'Aujesky D, et al. J Thromb Haemost. 2011;9(10):1853–1858.',
        'MDCalc: Simplified PESI.'
      ],
      commentary: `The sPESI requires fewer variables than the original PESI and is favored for quick risk stratification in PE.`
    }
  },

  {
    name: 'BAP-65 Score (COPD Exacerbation)',
    calcType: 'Diagnostic',
    description: 'Predicts in-hospital mortality and need for mechanical ventilation in acute COPD exacerbations.',
    fields: [
      { label: 'B: Elevated BUN (>25 mg/dL)?', type: 'boolean', key: 'elevatedBUN' },
      { label: 'A: Altered mental status?', type: 'boolean', key: 'alteredMental' },
      { label: 'P: Pulse ≥109 bpm?', type: 'boolean', key: 'pulseOver109' },
      { label: '65: Age ≥65 years?', type: 'boolean', key: 'ageOver65' },
    ],
    computeScore(values) {
      let s = 0;
      if (values.elevatedBUN) s++;
      if (values.alteredMental) s++;
      if (values.pulseOver109) s++;
      if (values.ageOver65) s++;

      let interpretation = '';
      // BAP-65 categories: 0 => low risk, 1 => moderate, 2 => high, etc.
      if (s === 0) interpretation = 'Low risk (score 0). Low mortality, outpatient mgmt possible.';
      else if (s === 1) interpretation = 'Moderate risk (score 1). Consider admission.';
      else if (s >= 2) interpretation = `High risk (score ${s}). Elevated mortality, ICU or close monitoring.`;

      return { score: s, interpretation };
    },
    nextSteps: {
      management: `Patients with BAP-65 of 0 may be suitable for outpatient or observational care if stable. Higher scores suggest in-hospital management, aggressive therapy, and possible ICU-level care if severe.`,
      criticalActions: `Ensure that mental status changes are accurately assessed. BUN measurement must be available. Evaluate other clinical factors (comorbidities, oxygen requirement) prior to deciding disposition.`
    },
    evidence: {
      references: [
        'Shorr AF, et al. Crit Care Med. 2011;39(6):1434–1440.',
        'MDCalc: BAP-65 Score.'
      ],
      commentary: `BAP-65 is a simple tool for risk stratification in acute COPD exacerbations, guiding site-of-care decisions and resource allocation.`
    }
  },

  {
    name: 'BODE Index for COPD',
    calcType: 'Diagnostic',
    description: 'Predicts mortality risk in chronic COPD based on BMI, Obstruction (FEV1), Dyspnea, and Exercise capacity.',
    fields: [
      { label: 'Body Mass Index (BMI)', type: 'number', key: 'bmi' },
      { label: 'FEV1 (% predicted)', type: 'number', key: 'fev1Perc' },
      { label: 'Dyspnea grade (MMRC scale: 0–4)', type: 'number', key: 'mmrcDyspnea' },
      { label: '6-minute walk distance (meters)', type: 'number', key: 'walkDist' },
    ],
    computeScore(values) {
      let s = 0;
      const bmiVal = Number(values.bmi) || 0;
      const fev1Val = Number(values.fev1Perc) || 0;
      const mmrcVal = Number(values.mmrcDyspnea) || 0;
      const walkVal = Number(values.walkDist) || 0;

      // BMI: ≥21 => 0 pts, <21 => 1 pt
      if (bmiVal < 21) s += 1;

      // FEV1: >65% => 0, 50–64% => 1, 36–49% => 2, ≤35% => 3
      if (fev1Val <= 35) s += 3;
      else if (fev1Val < 50) s += 2;
      else if (fev1Val < 65) s += 1;

      // MMRC: 0–4 => add that many points, but typically BODE uses discrete cutoffs:
      // 0 => 0, 1 => 0, 2 => 1, 3 => 2, 4 => 3
      if (mmrcVal === 2) s += 1;
      else if (mmrcVal === 3) s += 2;
      else if (mmrcVal === 4) s += 3;

      // 6MWD: ≥350m => 0, 250–349 => 1, 150–249 => 2, <149 => 3
      if (walkVal < 150) s += 3;
      else if (walkVal < 250) s += 2;
      else if (walkVal < 350) s += 1;

      let interpretation = `BODE Index = ${s} (0–10). Higher scores correlate with higher mortality in COPD.`;
      return { score: s, interpretation };
    },
    nextSteps: {
      management: `Use the BODE Index to guide prognosis discussions and intensity of therapy in COPD. Scores 0–2 suggest lower mortality, while scores ≥7 indicate significant 52-month mortality risk.`,
      criticalActions: `Ensure accurate measurements (spirometry, 6MWT) performed under standard guidelines. Use BODE along with exacerbation history to tailor management plans (e.g. oxygen therapy, pulmonary rehab).`
    },
    evidence: {
      references: [
        'Celli BR, et al. N Engl J Med. 2004;350:1005–1012.',
        'MDCalc: BODE Index for COPD.'
      ],
      commentary: `The BODE Index is a multi-dimensional grading tool that predicts risk of death from COPD better than FEV1 alone.`
    }
  },
];
