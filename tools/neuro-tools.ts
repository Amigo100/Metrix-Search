// /tools/neuro-tools.ts

import { ScoreDefinition } from './types';

export const neuroTools: ScoreDefinition[] = [
  // 1) Glasgow Coma Scale (GCS)
  {
    name: 'Glasgow Coma Scale (GCS)',
    calcType: 'Diagnostic',
    description: 'Assesses the level of consciousness by summing scores for eye, verbal, and motor responses.',
    fields: [
      { label: 'Eye Response (1–4)', type: 'number', key: 'eye' },
      { label: 'Verbal Response (1–5)', type: 'number', key: 'verbal' },
      { label: 'Motor Response (1–6)', type: 'number', key: 'motor' },
    ],
    computeScore(values) {
      const eye = Number(values.eye) || 1;
      const verbal = Number(values.verbal) || 1;
      const motor = Number(values.motor) || 1;
      const total = eye + verbal + motor;
      let interpretation = '';
      if (total <= 8) interpretation = 'Severe brain injury (GCS ≤8).';
      else if (total <= 12) interpretation = 'Moderate brain injury (GCS 9–12).';
      else interpretation = 'Mild brain injury (GCS 13–15).';
      return { score: total, interpretation };
    },
    nextSteps: {
      management: `For GCS:
• ≤8: Consider airway protection, ICU admission, and neurosurgical consultation.
• 9–12: Monitor closely; consider imaging if deterioration occurs.
• 13–15: Outpatient management may be possible if stable.`,
      criticalActions: `Reassess frequently and always use GCS in conjunction with a full clinical evaluation.`
    },
    evidence: {
      references: [
        'Teasdale G, Jennett B. Lancet. 1974;304(7872):81–84.'
      ],
      commentary: 'The Glasgow Coma Scale is the most widely used tool to assess consciousness in patients with brain injury.'
    }
  },

  // 2) FOUR Score (Full Outline of UnResponsiveness)
  {
    name: 'FOUR Score',
    calcType: 'Diagnostic',
    description: 'Evaluates coma using eye response, motor response, brainstem reflexes, and respiratory pattern. Especially useful for intubated patients.',
    fields: [
      { label: 'Eye Response (0–4)', type: 'number', key: 'eye' },
      { label: 'Motor Response (0–4)', type: 'number', key: 'motor' },
      { label: 'Brainstem Reflexes (0–4)', type: 'number', key: 'brainstem' },
      { label: 'Respiration (0–4)', type: 'number', key: 'respiration' },
    ],
    computeScore(values) {
      const eye = Math.min(Math.max(Number(values.eye) || 0, 0), 4);
      const motor = Math.min(Math.max(Number(values.motor) || 0, 0), 4);
      const brainstem = Math.min(Math.max(Number(values.brainstem) || 0, 0), 4);
      const respiration = Math.min(Math.max(Number(values.respiration) || 0, 0), 4);
      const total = eye + motor + brainstem + respiration;
      let interpretation = '';
      if (total <= 7) interpretation = 'Severe impairment; high mortality risk.';
      else if (total <= 11) interpretation = 'Moderate impairment; intermediate prognosis.';
      else interpretation = 'Mild impairment; relatively favorable prognosis.';
      return { score: total, interpretation };
    },
    nextSteps: {
      management: `FOUR Score:
• ≤7: Immediate ICU care, consider advanced airway management.
• 8–11: Intensive monitoring with repeated assessments.
• 12–16: Relatively preserved function; standard care is usually sufficient.`,
      criticalActions: `Use FOUR Score in tandem with other clinical data—especially in non-verbal or intubated patients.`
    },
    evidence: {
      references: [
        'Wijdicks EF, Bamlet WR, et al. Ann Neurol. 2005;57(3):470–477.'
      ],
      commentary: 'The FOUR Score adds brainstem and respiratory assessments to complement the GCS.'
    }
  },

  // 3) ICH Score for Intracerebral Hemorrhage
  {
    name: 'ICH Score',
    calcType: 'Diagnostic',
    description: 'Predicts 30-day mortality in intracerebral hemorrhage using GCS, hemorrhage volume, intraventricular extension, hemorrhage location, and age.',
    fields: [
      { label: 'Glasgow Coma Scale (3–15)', type: 'number', key: 'gcs' },
      { label: 'Hemorrhage Volume (mL)', type: 'number', key: 'volume' },
      { label: 'Intraventricular hemorrhage present?', type: 'boolean', key: 'ivt' },
      { label: 'Infratentorial origin?', type: 'boolean', key: 'infratentorial' },
      { label: 'Age >80 years?', type: 'boolean', key: 'ageOver80' },
    ],
    computeScore(values) {
      let score = 0;
      const gcs = Number(values.gcs) || 15;
      if (gcs >= 3 && gcs <= 4) score += 2;
      else if (gcs >= 5 && gcs <= 12) score += 1;
      const volume = Number(values.volume) || 0;
      if (volume > 30) score += 1;
      if (values.ivt) score += 1;
      if (values.infratentorial) score += 1;
      if (values.ageOver80) score += 1;
      
      let interpretation = '';
      if (score === 0) interpretation = 'Very low 30-day mortality (<10%).';
      else if (score === 1) interpretation = 'Low risk (~13% mortality).';
      else if (score === 2) interpretation = 'Moderate risk (~26% mortality).';
      else if (score === 3) interpretation = 'High risk (~72% mortality).';
      else if (score === 4) interpretation = 'Very high risk (~90% mortality).';
      else interpretation = 'Extremely high risk (approaching 100% mortality).';
      
      return { score, interpretation };
    },
    nextSteps: {
      management: `For ICH Score:
• 0–1: Conservative management with close monitoring.
• 2: Aggressive medical management and evaluation for potential surgical intervention.
• ≥3: Intensive care is indicated; discuss prognosis and advanced management options.`,
      criticalActions: `Accurate assessment of GCS and imaging for hemorrhage volume and extension are essential. Reassess frequently as clinical status can change rapidly.`
    },
    evidence: {
      references: [
        'Hemphill JC, et al. Stroke. 2001;32(4):891–897.'
      ],
      commentary: 'The ICH Score is a widely validated prognostic tool for intracerebral hemorrhage.'
    }
  },

  // 4) Hunt & Hess Scale for Subarachnoid Hemorrhage
  {
    name: 'Hunt & Hess Scale',
    calcType: 'Diagnostic',
    description: 'Grades the severity of subarachnoid hemorrhage (SAH) based on clinical presentation.',
    fields: [
      {
        label: 'Hunt & Hess Grade',
        type: 'select',
        key: 'grade',
        options: [
          'I - Asymptomatic or mild headache, alert',
          'II - Moderate to severe headache with nuchal rigidity, no neurological deficit',
          'III - Drowsy or confused with mild focal deficit',
          'IV - Stuporous with moderate to severe focal deficit',
          'V - Comatose with decerebrate posturing'
        ]
      },
    ],
    computeScore(values) {
      const gradeStr = values.grade || '';
      const match = gradeStr.match(/(\d)/);
      const grade = match ? Number(match[1]) : 0;
      let interpretation = '';
      if (grade <= 2) interpretation = 'Low to moderate severity; generally favorable prognosis.';
      else if (grade === 3) interpretation = 'Moderate severity; increased risk of complications.';
      else interpretation = 'High severity; poor prognosis with high mortality risk.';
      return { score: grade, interpretation };
    },
    nextSteps: {
      management: `For Hunt & Hess:
Grades I–II: Recommend early transfer to a neurosurgical center and close monitoring.
Grade III: Admit to ICU for intensive management and possible surgical intervention.
Grades IV–V: Aggressive critical care management is required; discuss prognosis with family.`,
      criticalActions: `Perform a thorough neurological examination and correlate with imaging findings. Use this scale as part of an overall assessment.`
    },
    evidence: {
      references: [
        'Hunt W, Hess R. Surg Gynecol Obstet. 1968;127:102–105.'
      ],
      commentary: 'The Hunt & Hess Scale remains a classic tool for grading SAH severity and guiding management decisions.'
    }
  },

  // 5) Spetzler-Martin Grading System for AVMs
  {
    name: 'Spetzler-Martin Grading System',
    calcType: 'Diagnostic',
    description: 'Assesses surgical risk for brain arteriovenous malformations (AVMs) based on size, eloquence of brain tissue, and venous drainage.',
    fields: [
      { label: 'AVM Size', type: 'select', key: 'size', options: ['Small (<3 cm) - 1 point', 'Medium (3–6 cm) - 2 points', 'Large (>6 cm) - 3 points'] },
      { label: 'Eloquent brain location?', type: 'boolean', key: 'eloquent' },
      { label: 'Deep venous drainage?', type: 'boolean', key: 'deepDrainage' },
    ],
    computeScore(values) {
      let score = 0;
      const sizeStr = values.size || '';
      if (sizeStr.includes('1 point')) score += 1;
      else if (sizeStr.includes('2 points')) score += 2;
      else if (sizeStr.includes('3 points')) score += 3;
      if (values.eloquent) score += 1;
      if (values.deepDrainage) score += 1;
      let interpretation = '';
      if (score <= 2) interpretation = 'Low surgical risk.';
      else if (score <= 4) interpretation = 'Intermediate risk; careful evaluation required.';
      else interpretation = 'High surgical risk; consider non-surgical or multimodal treatment.';
      return { score, interpretation };
    },
    nextSteps: {
      management: `Use the Spetzler-Martin Grading System to determine AVM surgical risk:
Grades I–II: Generally favorable for surgery.
Grades III–IV: Increased risk; multidisciplinary evaluation is advised.
Grade V: Very high risk; non-surgical management is often recommended.`,
      criticalActions: `Accurate imaging is required to assess AVM size and drainage. Use this grading system as part of a comprehensive evaluation of treatment options.`
    },
    evidence: {
      references: [
        'Spetzler RF, Martin NA. J Neurosurg. 1986;65(4):476–483.'
      ],
      commentary: 'The Spetzler-Martin Grading System is a standard for assessing surgical risk in AVMs.'
    }
  },

  // 6) NIH Stroke Scale (NIHSS) – Simplified Version
  {
    name: 'NIH Stroke Scale (Simplified)',
    calcType: 'Diagnostic',
    description: 'A simplified version of the NIH Stroke Scale to assess stroke severity. Higher scores indicate more severe deficits.',
    fields: [
      { label: 'Level of Consciousness (0-3)', type: 'select', key: 'loc', options: ['0 - Alert', '1 - Not alert but responsive', '2 - Minimal response', '3 - No response'] },
      { label: 'Best Gaze (0-2)', type: 'select', key: 'gaze', options: ['0 - Normal', '1 - Partial gaze palsy', '2 - Forced deviation'] },
      { label: 'Visual Fields (0-3)', type: 'select', key: 'visual', options: ['0 - Normal', '1 - Partial hemianopia', '2 - Complete hemianopia', '3 - Bilateral hemianopia'] },
      { label: 'Facial Palsy (0-3)', type: 'select', key: 'facial', options: ['0 - Normal', '1 - Minor paralysis', '2 - Partial paralysis', '3 - Complete paralysis'] },
      { label: 'Motor Arm (0-4)', type: 'select', key: 'motorArm', options: ['0 - No drift', '1 - Drift', '2 - Some effort against gravity', '3 - No effort against gravity', '4 - No movement'] },
      { label: 'Motor Leg (0-4)', type: 'select', key: 'motorLeg', options: ['0 - No drift', '1 - Drift', '2 - Some effort against gravity', '3 - No effort against gravity', '4 - No movement'] },
      { label: 'Limb Ataxia (0-2)', type: 'select', key: 'ataxia', options: ['0 - None', '1 - Present', '2 - Unable to test'] },
      { label: 'Sensory (0-2)', type: 'select', key: 'sensory', options: ['0 - Normal', '1 - Mild to moderate deficit', '2 - Severe deficit'] },
      { label: 'Language (0-3)', type: 'select', key: 'language', options: ['0 - No aphasia', '1 - Mild aphasia', '2 - Severe aphasia', '3 - Mute'] },
      { label: 'Dysarthria (0-2)', type: 'select', key: 'dysarthria', options: ['0 - Normal', '1 - Mild dysarthria', '2 - Severe dysarthria'] },
      { label: 'Extinction/Inattention (0-2)', type: 'select', key: 'neglect', options: ['0 - No neglect', '1 - Partial neglect', '2 - Complete neglect'] },
    ],
    computeScore(values) {
      const parseScore = (key: string) => {
        const val = values[key];
        if (!val) return 0;
        const num = parseInt(val.split(' ')[0], 10);
        return isNaN(num) ? 0 : num;
      };
      const loc = parseScore('loc');
      const gaze = parseScore('gaze');
      const visual = parseScore('visual');
      const facial = parseScore('facial');
      const motorArm = parseScore('motorArm');
      const motorLeg = parseScore('motorLeg');
      const ataxia = parseScore('ataxia');
      const sensory = parseScore('sensory');
      const language = parseScore('language');
      const dysarthria = parseScore('dysarthria');
      const neglect = parseScore('neglect');
      
      const total = loc + gaze + visual + facial + motorArm + motorLeg + ataxia + sensory + language + dysarthria + neglect;
      
      let interpretation = '';
      if (total <= 4) interpretation = 'Minor stroke; likely to recover with minimal deficits.';
      else if (total <= 15) interpretation = 'Moderate stroke; consider hospital admission and potential intervention.';
      else if (total <= 20) interpretation = 'Moderate to severe stroke; high risk of significant deficits.';
      else interpretation = 'Severe stroke; high risk for poor outcome and increased mortality.';
      
      return { score: total, interpretation };
    },
    nextSteps: {
      management: `Use the NIH Stroke Scale to assess stroke severity:
• Low scores (0–4) often indicate minor stroke; consider outpatient management if stable.
• Scores 5–15 suggest moderate stroke; hospital admission and possible reperfusion therapy are warranted.
• Scores 16–20 indicate moderate to severe stroke; consider aggressive intervention and intensive care.
• Scores above 20 suggest severe stroke; urgent intervention and ICU management are required.`,
      criticalActions: `Perform serial assessments to monitor neurological changes. NIHSS is a guide; always combine with imaging and clinical evaluation.`
    },
    evidence: {
      references: [
        'Brott T, Adams HP Jr, et al. Stroke. 1989;20(7):864–870.',
        'MDCalc: NIH Stroke Scale.'
      ],
      commentary: 'The NIH Stroke Scale is a well-validated tool for quantifying stroke severity and guiding treatment decisions.'
    }
  },

  // 7) ASPECTS Score for Ischemic Stroke
  {
    name: 'ASPECTS Score',
    calcType: 'Diagnostic',
    description: 'Assesses early ischemic changes on non-contrast CT in middle cerebral artery stroke. The score is calculated as 10 minus the number of regions with ischemic changes.',
    fields: [
      { label: 'Number of affected regions (0-10)', type: 'number', key: 'affectedRegions' },
    ],
    computeScore(values) {
      const affected = Number(values.affectedRegions) || 0;
      const aspects = 10 - affected;
      const interpretation = `ASPECTS Score = ${aspects}. Higher scores (closer to 10) indicate less extensive ischemic change and a more favorable prognosis.`;
      return { score: aspects, interpretation };
    },
    nextSteps: {
      management: `An ASPECTS score close to 10 suggests minimal ischemic change, supporting the use of reperfusion therapy. Lower scores indicate more extensive ischemia, which may limit the benefit of aggressive interventions.`,
      criticalActions: `Ensure CT images are reviewed by experienced radiologists. ASPECTS should be used in conjunction with clinical and other imaging findings.`
    },
    evidence: {
      references: [
        'Barber PA, et al. Lancet. 2000;355(9216):1670–1674.',
        'MDCalc: ASPECTS Score.'
      ],
      commentary: 'ASPECTS is a valuable tool for evaluating the extent of early ischemic changes in acute stroke, guiding decisions regarding reperfusion therapy.'
    }
  },
];
