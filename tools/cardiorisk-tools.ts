// /tools/cardiorisk-tools.ts

import { ScoreDefinition } from '../types';

/**
 * Comprehensive Cardiology/CV Calculators
 * 
 * Each calculator has calcType: 'Diagnostic' by default here, so that it appears
 * under the "Diagnostic" filter in your advanced UI. In the future, you can update
 * these to 'Prognostic' or another type if appropriate for your usage.
 */

export const cardioRiskTools: ScoreDefinition[] = [
  // 1) Wells' Score for DVT
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
    computeScore(values: { cancer: any; paralysis: any; bedridden: any; tenderness: any; entireSwollen: any; calfSwelling: any; edema: any; collateralVeins: any; altLikely: any; }) {
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

  // 2) Wells' Score for PE
  {
    name: "Wells' Score for PE",
    calcType: 'Diagnostic',
    description: "Estimates clinical probability of pulmonary embolism through a seven-factor sum.",
    fields: [
      { label: 'Clinical signs/symptoms of DVT (3 pts)', type: 'boolean', key: 'dvtSigns' },
      { label: 'PE is #1 diagnosis or equally likely (3 pts)', type: 'boolean', key: 'peLikely' },
      { label: 'Heart rate > 100 bpm (1.5 pts)', type: 'boolean', key: 'hrOver100' },
      { label: 'Immobilization or surgery in the past 4 weeks (1.5 pts)', type: 'boolean', key: 'immobilization' },
      { label: 'Previous DVT/PE (1.5 pts)', type: 'boolean', key: 'priorDvtPe' },
      { label: 'Hemoptysis (1 pt)', type: 'boolean', key: 'hemoptysis' },
      { label: 'Malignancy (1 pt)', type: 'boolean', key: 'malignancy' },
    ],
    computeScore(values: { dvtSigns: any; peLikely: any; hrOver100: any; immobilization: any; priorDvtPe: any; hemoptysis: any; malignancy: any; }) {
      let score = 0;
      if (values.dvtSigns) score += 3;
      if (values.peLikely) score += 3;
      if (values.hrOver100) score += 1.5;
      if (values.immobilization) score += 1.5;
      if (values.priorDvtPe) score += 1.5;
      if (values.hemoptysis) score += 1;
      if (values.malignancy) score += 1;

      let interpretation = '';
      if (score < 2) interpretation = 'Low probability (<2).';
      else if (score >= 2 && score <= 6) interpretation = 'Moderate probability (2–6).';
      else interpretation = 'High probability (>6).';

      return { score, interpretation };
    },
    nextSteps: {
      management: `For low-probability patients, a d-dimer test can rule out PE if negative. For moderate or high probability, imaging (CT pulmonary angiogram or V/Q scan) is typically indicated. Treatment with anticoagulation is guided by clinical suspicion plus objective testing.`,
      criticalActions: `No decision rule overrides strong clinical suspicion. If suspicion for PE is high, proceed with imaging even if the Wells Score suggests moderate or low.`
    },
    evidence: {
      references: [
        'Wells PS, et al. Ann Intern Med. 2001;135:98–107.',
        'MDCalc: Wells’ Criteria for Pulmonary Embolism.'
      ],
      commentary: `Wells' Score for PE helps stratify patients for further testing with d-dimer or imaging.`
    }
  },

  // 3) CHADS₂ Score for Atrial Fibrillation Stroke Risk
  {
    name: 'CHADS₂ Score',
    calcType: 'Diagnostic',
    description: 'Predicts stroke risk in non-valvular atrial fibrillation using simple point sums.',
    fields: [
      { label: 'Congestive Heart Failure (1 pt)', type: 'boolean', key: 'chf' },
      { label: 'Hypertension (1 pt)', type: 'boolean', key: 'htn' },
      { label: 'Age ≥75 (1 pt)', type: 'boolean', key: 'age75' },
      { label: 'Diabetes Mellitus (1 pt)', type: 'boolean', key: 'diabetes' },
      { label: 'Stroke/TIA/thromboembolism (2 pts)', type: 'boolean', key: 'strokeTia' },
    ],
    computeScore(values: { chf: any; htn: any; age75: any; diabetes: any; strokeTia: any; }) {
      let s = 0;
      if (values.chf) s += 1;
      if (values.htn) s += 1;
      if (values.age75) s += 1;
      if (values.diabetes) s += 1;
      if (values.strokeTia) s += 2;

      const interpretation = `CHADS₂ = ${s}. A score of 2 or more typically indicates a need for anticoagulation.`;
      return { score: s, interpretation };
    },
    nextSteps: {
      management: `Patients with CHADS₂ ≥2 are generally recommended for warfarin or a DOAC to reduce stroke risk, unless contraindications exist. Lower scores may be managed with aspirin or possibly no therapy, depending on additional risk factors.`,
      criticalActions: `CHADS₂ is a simpler alternative to CHA₂DS₂-VASc, which may refine stroke risk further. Clinical judgment should always guide final therapy decisions.`
    },
    evidence: {
      references: [
        'Gage BF, et al. JAMA. 2001;285(22):2864–2870.',
        'MDCalc: CHADS₂ Score.'
      ],
      commentary: `CHADS₂ is an older but still common scoring system for AF stroke risk, though CHA₂DS₂-VASc is now more widely adopted.`
    }
  },

  // 4) CHA₂DS₂-VASc Score
  {
    name: 'CHA₂DS₂-VASc Score',
    calcType: 'Diagnostic',
    description: 'Refines stroke risk assessment in atrial fibrillation, adding vascular disease and female sex.',
    fields: [
      { label: 'Congestive Heart Failure (1 pt)', type: 'boolean', key: 'chf' },
      { label: 'Hypertension (1 pt)', type: 'boolean', key: 'htn' },
      { label: 'Age ≥75 (2 pts)', type: 'boolean', key: 'age75' },
      { label: 'Diabetes Mellitus (1 pt)', type: 'boolean', key: 'diabetes' },
      { label: 'Stroke/TIA/thromboembolism (2 pts)', type: 'boolean', key: 'strokeTia' },
      { label: 'Vascular disease (1 pt)', type: 'boolean', key: 'vascular' },
      { label: 'Age 65–74 (1 pt)', type: 'boolean', key: 'age65to74' },
      { label: 'Female sex (1 pt)', type: 'boolean', key: 'female' },
    ],
    computeScore(values: { chf: any; htn: any; age75: any; diabetes: any; strokeTia: any; vascular: any; age65to74: any; female: any; }) {
      let s = 0;
      if (values.chf) s++;
      if (values.htn) s++;
      if (values.age75) s += 2;
      if (values.diabetes) s++;
      if (values.strokeTia) s += 2;
      if (values.vascular) s++;
      if (values.age65to74 && !values.age75) s++;
      if (values.female) s++;
      const interpretation = `CHA₂DS₂-VASc = ${s}. A score of 2 or more in men, or ≥3 in women, usually indicates a need for anticoagulation.`;
      return { score: s, interpretation };
    },
    nextSteps: {
      management: `Use CHA₂DS₂-VASc to refine stroke risk in AF. For score ≥2 in men or ≥3 in women, anticoagulation is recommended unless contraindicated. For lower scores, consider lifestyle and risk factor modification or additional clinical judgment.`,
      criticalActions: `Always evaluate bleeding risk, e.g., via HAS-BLED. Continually re-assess stroke risk over time as patient factors change.`
    },
    evidence: {
      references: [
        'Lip GY, et al. Chest. 2010;137(2):263–272.',
        'MDCalc: CHA₂DS₂-VASc Score.'
      ],
      commentary: `CHA₂DS₂-VASc is the preferred scoring system for stroke risk stratification in contemporary AF guidelines.`
    }
  },

  // 5) TIMI Score for UA/NSTEMI
  {
    name: 'TIMI Score (UA/NSTEMI)',
    calcType: 'Diagnostic',
    description: "Stratifies risk of death, new/recurrent MI, or severe ischemia in unstable angina/NSTEMI.",
    fields: [
      { label: 'Age ≥65 (1 pt)', type: 'boolean', key: 'ageOver65' },
      { label: '≥3 CAD risk factors (1 pt)', type: 'boolean', key: 'riskFactors' },
      { label: 'Known CAD (≥50% stenosis) (1 pt)', type: 'boolean', key: 'knownCad' },
      { label: 'Aspirin use in past 7 days (1 pt)', type: 'boolean', key: 'asaUse' },
      { label: '≥2 anginal episodes in 24h (1 pt)', type: 'boolean', key: 'anginaEpisodes' },
      { label: 'ST changes ≥0.5 mm (1 pt)', type: 'boolean', key: 'stChanges' },
      { label: 'Positive cardiac biomarkers (1 pt)', type: 'boolean', key: 'biomarkers' },
    ],
    computeScore(values: { ageOver65: any; riskFactors: any; knownCad: any; asaUse: any; anginaEpisodes: any; stChanges: any; biomarkers: any; }) {
      let s = 0;
      if (values.ageOver65) s++;
      if (values.riskFactors) s++;
      if (values.knownCad) s++;
      if (values.asaUse) s++;
      if (values.anginaEpisodes) s++;
      if (values.stChanges) s++;
      if (values.biomarkers) s++;
      const interpretation = `TIMI = ${s}/7. Higher scores correlate with increased adverse events. Score ≥5 indicates high risk.`;
      return { score: s, interpretation };
    },
    nextSteps: {
      management: `Patients with higher TIMI scores benefit from early invasive strategies (angiography) and more aggressive medical therapy (e.g. GP IIb/IIIa inhibitors, high-intensity statins). Lower scores may be managed more conservatively, though clinical judgment is key.`,
      criticalActions: `Monitor for recurrent chest pain or dynamic ECG changes in all risk groups. TIMI is a guide; clinical context is paramount.`
    },
    evidence: {
      references: [
        'Antman EM, Cohen M, et al. JAMA. 2000;284:835–842.',
        'MDCalc: TIMI Score for UA/NSTEMI.'
      ],
      commentary: `TIMI Score helps identify high-risk UA/NSTEMI patients who may benefit from early invasive approaches.`
    }
  },

  // 6) TIMI Risk Score for STEMI
  {
    name: 'TIMI Score (STEMI)',
    calcType: 'Diagnostic',
    description: "Evaluates 30-day mortality risk in ST-elevation MI using age, SBP, Killip class, HR, location, etc.",
    fields: [
      { label: 'Age (<65=0, 65–74=2, ≥75=3)', type: 'select', key: 'age', options: ['<65', '65–74', '≥75'] },
      { label: 'SBP <100 mmHg?', type: 'boolean', key: 'lowSBP' },  // +3
      { label: 'Killip Class II–IV?', type: 'boolean', key: 'killip' }, // +2
      { label: 'Heart rate >100 bpm?', type: 'boolean', key: 'hrOver100' }, // +2
      { label: 'Anterior ST-elevation or LBBB?', type: 'boolean', key: 'antOrLBBB' }, // +1
      { label: 'Time to treatment >4h?', type: 'boolean', key: 'delayedTx' }, // +1
      { label: 'Weight <67 kg?', type: 'boolean', key: 'lowWeight' }, // +1
    ],
    computeScore(values: { age: string; lowSBP: any; killip: any; hrOver100: any; antOrLBBB: any; delayedTx: any; lowWeight: any; }) {
      let s = 0;
      if (values.age === '65–74') s += 2;
      else if (values.age === '≥75') s += 3;
      if (values.lowSBP) s += 3;
      if (values.killip) s += 2;
      if (values.hrOver100) s += 2;
      if (values.antOrLBBB) s += 1;
      if (values.delayedTx) s += 1;
      if (values.lowWeight) s += 1;
      const interpretation = `TIMI (STEMI) = ${s}/14. Higher values indicate increased mortality risk. Score ≥8 suggests very high risk.`;
      return { score: s, interpretation };
    },
    nextSteps: {
      management: `High TIMI STEMI scores call for urgent reperfusion therapy (primary PCI or fibrinolysis if PCI is unavailable) and intensive supportive measures. Monitor for cardiogenic shock, arrhythmias, or mechanical complications.`,
      criticalActions: `Rapid diagnosis and transfer to a PCI center is paramount. This score highlights high-risk cases, guiding ICU care and potential mechanical support.`
    },
    evidence: {
      references: [
        'Morrow DA, Antman EM, et al. JAMA. 2000;284(7):874–882.',
        'MDCalc: TIMI Risk Score for STEMI.'
      ],
      commentary: `The TIMI STEMI risk score estimates short-term mortality and helps triage patients for more aggressive therapies.`
    }
  },

  // 7) HEART Score
  {
    name: 'HEART Score',
    calcType: 'Diagnostic',
    description: "Stratifies chest pain patients for risk of major adverse cardiac events (MACE).",
    fields: [
      { label: 'History: 0 (slight), 1 (moderate), 2 (highly suspicious)', type: 'select', key: 'history', options: ['0 - Slight', '1 - Moderate', '2 - High'] },
      { label: 'ECG: 0 (normal), 1 (non-specific changes), 2 (significant ST-depression)', type: 'select', key: 'ecg', options: ['0 - Normal', '1 - Non-specific', '2 - ST-depression'] },
      { label: 'Age: 0 (<45), 1 (45–64), 2 (≥65)', type: 'select', key: 'age', options: ['0 - <45', '1 - 45–64', '2 - ≥65'] },
      { label: 'Risk Factors: 0 (none), 1 (1–2), 2 (≥3 or known CAD)', type: 'select', key: 'riskFactors', options: ['0 - None', '1 - 1–2', '2 - ≥3 or CAD'] },
      { label: 'Troponin: 0 (normal), 1 (1–2x normal), 2 (>2x normal)', type: 'select', key: 'troponin', options: ['0 - Normal', '1 - 1–2x normal', '2 - >2x normal'] },
    ],
    computeScore(values: { history: any; ecg: any; age: any; riskFactors: any; troponin: any; }) {
      const parseVal = (str: string) => parseInt(str.split(' ')[0], 10) || 0;
      let s = 0;
      s += parseVal(values.history || '0');
      s += parseVal(values.ecg || '0');
      s += parseVal(values.age || '0');
      s += parseVal(values.riskFactors || '0');
      s += parseVal(values.troponin || '0');
      let interpretation = '';
      if (s <= 3) interpretation = 'Low risk (≤3). MACE ~2%. Early discharge possible.';
      else if (s <= 6) interpretation = 'Moderate risk (4–6). MACE ~12–16%. Further testing or observation.';
      else interpretation = 'High risk (≥7). MACE ~50–70%. Early invasive management recommended.';
      return { score: s, interpretation };
    },
    nextSteps: {
      management: `Low HEART scores (≤3) often allow early discharge or outpatient testing if troponins remain negative. Scores 4–6 justify admission for serial troponins and possibly stress testing or imaging. Scores ≥7 call for urgent in-hospital evaluation and potential invasive strategies.`,
      criticalActions: `The HEART Score does not replace clinical judgment; always integrate with serial troponin measurements and ECG changes.`
    },
    evidence: {
      references: [
        'Six AJ, Backus BE, Kelder JC. Crit Pathw Cardiol. 2008;7(1):6–10.',
        'MDCalc: HEART Score.'
      ],
      commentary: `The HEART Score is validated for risk stratifying chest pain patients in the ED to estimate MACE risk.`
    }
  },

  // 8) CRUSADE Bleeding Score
  {
    name: 'CRUSADE Bleeding Score',
    calcType: 'Diagnostic',
    description: 'Predicts in-hospital major bleeding risk in ACS patients, using labs and clinical variables.',
    fields: [
      { label: 'Hematocrit (%)', type: 'number', key: 'hct' },
      { label: 'Creatinine Clearance (mL/min)', type: 'number', key: 'crcl' },
      { label: 'Heart Rate (bpm)', type: 'number', key: 'hr' },
      { label: 'Systolic Blood Pressure (mmHg)', type: 'number', key: 'sbp' },
      { label: 'Female Sex?', type: 'boolean', key: 'female' },
      { label: 'Diabetes History?', type: 'boolean', key: 'diabetes' },
      { label: 'Vascular Disease History?', type: 'boolean', key: 'vascular' },
      { label: 'Signs of CHF on presentation?', type: 'boolean', key: 'chf' },
    ],
    computeScore(values: { hct: any; crcl: any; hr: any; sbp: any; female: any; diabetes: any; vascular: any; chf: any; }) {
      let totalPoints = 0;
      // For brevity, we show the abbreviated approach:
      const hctVal = Number(values.hct) || 0;
      if (hctVal < 31) totalPoints += 30;
      else if (hctVal < 34) totalPoints += 23;
      else if (hctVal < 37) totalPoints += 17;
      else if (hctVal < 40) totalPoints += 11;
      else if (hctVal < 44) totalPoints += 6;

      const crclVal = Number(values.crcl) || 0;
      if (crclVal < 15) totalPoints += 39;
      else if (crclVal < 30) totalPoints += 35;
      else if (crclVal < 51) totalPoints += 28;
      else if (crclVal < 61) totalPoints += 23;
      else if (crclVal < 76) totalPoints += 17;
      else if (crclVal < 91) totalPoints += 11;
      else if (crclVal < 121) totalPoints += 6;

      const hrVal = Number(values.hr) || 0;
      if (hrVal >= 110) totalPoints += 15;
      else if (hrVal >= 100) totalPoints += 10;
      else if (hrVal >= 90) totalPoints += 5;

      const sbpVal = Number(values.sbp) || 0;
      if (sbpVal < 90) totalPoints += 26;
      else if (sbpVal < 100) totalPoints += 21;
      else if (sbpVal < 120) totalPoints += 13;
      else if (sbpVal < 130) totalPoints += 8;
      else if (sbpVal < 140) totalPoints += 4;

      if (values.female) totalPoints += 8;
      if (values.diabetes) totalPoints += 6;
      if (values.vascular) totalPoints += 6;
      if (values.chf) totalPoints += 7;

      let interpretation = `${totalPoints} points. Refer to CRUSADE tables for major bleeding risk (e.g., <20 => ~3%, 20–30 => ~5%, etc.).`;
      return { score: totalPoints, interpretation };
    },
    nextSteps: {
      management: `Use the CRUSADE Bleeding Score to evaluate ACS patients' risk of in-hospital major bleeding. High scores (≥30) may prompt more careful selection/dosing of antithrombotic therapies, frequent hemoglobin checks, and readiness for transfusion if needed.`,
      criticalActions: `Ensure lab values (hematocrit, creatinine) and vitals are accurate. The CRUSADE Score complements—but doesn’t replace—clinical judgment.`
    },
    evidence: {
      references: [
        'Subherwal S, Bach RG, et al. Circulation. 2009;119:1873–1882.',
        'MDCalc: CRUSADE Bleeding Score.'
      ],
      commentary: `The CRUSADE Score helps tailor antithrombotic therapy in ACS patients by identifying those at higher bleeding risk.`
    }
  },

  // 9) Revised Cardiac Risk Index (RCRI)
  {
    name: 'Revised Cardiac Risk Index (RCRI)',
    calcType: 'Diagnostic',
    description: "Predicts major cardiac complications for patients undergoing noncardiac surgery.",
    fields: [
      { label: 'High-risk surgery (intraperitoneal, intrathoracic, or vascular)?', type: 'boolean', key: 'highRiskSurg' },
      { label: 'History of ischemic heart disease?', type: 'boolean', key: 'ihd' },
      { label: 'History of congestive heart failure?', type: 'boolean', key: 'chf' },
      { label: 'History of cerebrovascular disease?', type: 'boolean', key: 'cva' },
      { label: 'Diabetes requiring insulin?', type: 'boolean', key: 'insulinDiabetes' },
      { label: 'Preoperative serum creatinine >2.0 mg/dL?', type: 'boolean', key: 'renal' },
    ],
    computeScore(values: { highRiskSurg: any; ihd: any; chf: any; cva: any; insulinDiabetes: any; renal: any; }) {
      let s = 0;
      if (values.highRiskSurg) s++;
      if (values.ihd) s++;
      if (values.chf) s++;
      if (values.cva) s++;
      if (values.insulinDiabetes) s++;
      if (values.renal) s++;
      const interpretation = `RCRI = ${s} risk factors. 0 => ~0.4% risk; 1 => ~1%; 2 => ~2.4%; ≥3 => ~5.4%.`;
      return { score: s, interpretation };
    },
    nextSteps: {
      management: `Patients with RCRI ≥2 may warrant further cardiac evaluation, possibly noninvasive stress testing or cardiology consult prior to surgery. Low scores (0–1) indicate lower risk, usually suitable for standard perioperative management.`,
      criticalActions: `RCRI is an adjunct to, not a replacement for, thorough cardiac assessment. Always integrate with functional capacity and overall clinical scenario.`
    },
    evidence: {
      references: [
        'Lee TH, et al. Circulation. 1999;100(10):1043–1049.',
        'MDCalc: Revised Cardiac Risk Index.'
      ],
      commentary: `RCRI is widely used for preoperative cardiac risk stratification in noncardiac surgery, guiding whether additional testing is needed.`
    }
  },
];

