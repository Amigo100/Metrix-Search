// /tools/obgyn-tools.ts

import { ScoreDefinition } from './types';

export const obgynTools: ScoreDefinition[] = [
  // 1) Apgar Score
  {
    name: 'Apgar Score',
    calcType: 'Diagnostic',
    description:
      'Assesses the newborn’s condition at 1 and 5 minutes after birth using five criteria: appearance, pulse, grimace, activity, and respiration. Total score ranges from 0 to 10.',
    fields: [
      { label: 'Appearance (0 = blue/pale, 1 = body pink, extremities blue, 2 = completely pink)', type: 'number', key: 'appearance' },
      { label: 'Pulse (0 = absent, 1 = <100 bpm, 2 = ≥100 bpm)', type: 'number', key: 'pulse' },
      { label: 'Grimace (0 = no response, 1 = grimace, 2 = cough or sneeze)', type: 'number', key: 'grimace' },
      { label: 'Activity (0 = none, 1 = some flexion, 2 = active motion)', type: 'number', key: 'activity' },
      { label: 'Respiration (0 = absent, 1 = weak/irregular, 2 = good, crying)', type: 'number', key: 'respiration' },
    ],
    computeScore(values) {
      const appearance = Number(values.appearance) || 0;
      const pulse = Number(values.pulse) || 0;
      const grimace = Number(values.grimace) || 0;
      const activity = Number(values.activity) || 0;
      const respiration = Number(values.respiration) || 0;
      const total = appearance + pulse + grimace + activity + respiration;
      let interpretation = '';
      if (total >= 7) interpretation = 'Normal (7–10): Newborn is in good condition.';
      else if (total >= 4) interpretation = 'Intermediate (4–6): May require additional resuscitative measures.';
      else interpretation = 'Low (0–3): Immediate resuscitation is indicated.';
      return { score: total, interpretation };
    },
    nextSteps: {
      management: `For an Apgar score of 7–10, provide routine postnatal care and monitoring. Scores between 4 and 6 require supportive interventions (e.g., oxygen, stimulation) and close monitoring. Scores of 0–3 demand immediate neonatal resuscitation.`,
      criticalActions: `Reassess the newborn at 1 and 5 minutes; always integrate Apgar scores with a full clinical examination.`
    },
    evidence: {
      references: [
        'Apgar V. Pediatrics. 1953;12(1):9–15.'
      ],
      commentary: 'The Apgar Score is the standard tool for immediate postnatal assessment of newborns.'
    }
  },

  // 2) Bishop Score for Labor Induction
  {
    name: 'Bishop Score',
    calcType: 'Diagnostic',
    description: 'Evaluates cervical favorability for induction of labor based on dilation, effacement, consistency, position, and fetal station.',
    fields: [
      { label: 'Cervical Dilation (cm)', type: 'number', key: 'dilation' },
      { label: 'Cervical Effacement (%)', type: 'number', key: 'effacement' },
      { label: 'Cervical Consistency (0 = firm, 1 = medium, 2 = soft)', type: 'select', key: 'consistency', options: ['0 - Firm', '1 - Medium', '2 - Soft'] },
      { label: 'Cervical Position (0 = posterior, 1 = mid-position, 2 = anterior)', type: 'select', key: 'position', options: ['0 - Posterior', '1 - Mid-position', '2 - Anterior'] },
      { label: 'Fetal Station (0 = -3 to -2, 1 = -1 to 0, 2 = +1 to +2, 3 = +3)', type: 'select', key: 'station', options: ['0 - -3 to -2', '1 - -1 to 0', '2 - +1 to +2', '3 - +3'] },
    ],
    computeScore(values) {
      let dilationPoints = 0;
      const dilation = Number(values.dilation) || 0;
      if (dilation < 1) dilationPoints = 0;
      else if (dilation < 3) dilationPoints = 1;
      else dilationPoints = 2;
      
      let effacementPoints = 0;
      const effacement = Number(values.effacement) || 0;
      if (effacement < 40) effacementPoints = 0;
      else if (effacement < 70) effacementPoints = 1;
      else effacementPoints = 2;
      
      const consistencyPoints = Number(values.consistency.split(' ')[0]) || 0;
      const positionPoints = Number(values.position.split(' ')[0]) || 0;
      const stationPoints = Number(values.station.split(' ')[0]) || 0;
      
      const total = dilationPoints + effacementPoints + consistencyPoints + positionPoints + stationPoints;
      let interpretation = '';
      if (total < 5) interpretation = 'Unfavorable cervix; low likelihood of successful induction.';
      else if (total <= 7) interpretation = 'Intermediate favorability; induction may require cervical ripening.';
      else interpretation = 'Favorable cervix; high likelihood of successful induction.';
      return { score: total, interpretation };
    },
    nextSteps: {
      management: `A Bishop Score less than 5 suggests that cervical ripening may be necessary before induction. A score between 5 and 7 indicates moderate favorability, while a score greater than 7 suggests a high likelihood of successful induction.`,
      criticalActions: `Accurate assessment of cervical parameters is essential; combine the score with a complete maternal evaluation before making induction decisions.`
    },
    evidence: {
      references: [
        'Bishop EH. Am J Obstet Gynecol. 1964;88:835–843.'
      ],
      commentary: 'The Bishop Score is an established tool for predicting the success of labor induction.'
    }
  },

  // 3) Estimated Fetal Weight (Hadlock Formula)
  {
    name: 'Estimated Fetal Weight (Hadlock)',
    calcType: 'Diagnostic',
    description: 'Estimates fetal weight using ultrasound measurements such as Biparietal Diameter (BPD), Abdominal Circumference (AC), and Femur Length (FL).',
    fields: [
      { label: 'Biparietal Diameter (cm)', type: 'number', key: 'bpd' },
      { label: 'Abdominal Circumference (cm)', type: 'number', key: 'ac' },
      { label: 'Femur Length (cm)', type: 'number', key: 'fl' },
    ],
    computeScore(values) {
      const bpd = Number(values.bpd) || 0;
      const ac = Number(values.ac) || 0;
      const fl = Number(values.fl) || 0;
      // Simplified Hadlock formula variant:
      const logEFW = 1.326 - 0.00326 * ac * fl + 0.0107 * bpd + 0.0438 * ac + 0.158 * fl;
      const efw = Math.pow(10, logEFW);
      const interpretation = `Estimated fetal weight is approximately ${Math.round(efw)} grams.`;
      return { score: efw, interpretation };
    },
    nextSteps: {
      management: `Use the estimated fetal weight to assess fetal growth. Values outside the expected range warrant further evaluation with serial ultrasound examinations and possible referral to maternal-fetal medicine.`,
      criticalActions: `Ensure ultrasound measurements are obtained by experienced personnel under standardized conditions.`
    },
    evidence: {
      references: [
        'Hadlock FP, Harrist RB, et al. Radiology. 1985;156(2):367–373.'
      ],
      commentary: 'The Hadlock formula is the most widely used method for estimating fetal weight from ultrasound measurements.'
    }
  },

  // 4) VBAC Success Calculator
  {
    name: 'VBAC Success Calculator',
    calcType: 'Diagnostic',
    description: 'Estimates the likelihood of a successful vaginal birth after cesarean (VBAC) based on maternal age, BMI, prior vaginal delivery, and indication for previous cesarean.',
    fields: [
      { label: 'Maternal Age (years)', type: 'number', key: 'age' },
      { label: 'BMI (kg/m²)', type: 'number', key: 'bmi' },
      { label: 'Prior Vaginal Delivery?', type: 'boolean', key: 'priorVaginal' },
      { label: 'Previous Cesarean Indication', type: 'select', key: 'cesareanIndication', options: ['Non-recurring', 'Recurring'] },
      { label: 'Race/Ethnicity', type: 'select', key: 'race', options: ['White', 'Black', 'Hispanic', 'Other'] },
    ],
    computeScore(values) {
      let score = 0;
      const age = Number(values.age) || 0;
      const bmi = Number(values.bmi) || 0;
      
      if (age < 35) score += 2;
      else if (age < 40) score += 1;
      
      if (bmi < 25) score += 2;
      else if (bmi < 30) score += 1;
      
      if (values.priorVaginal) score += 2;
      if (values.cesareanIndication === 'Non-recurring') score += 1;
      if (values.race === 'White') score += 1;
      
      let interpretation = '';
      if (score >= 7) interpretation = 'High likelihood of successful VBAC.';
      else if (score >= 4) interpretation = 'Moderate likelihood of VBAC success.';
      else interpretation = 'Low likelihood of successful VBAC; consider repeat cesarean delivery.';
      return { score, interpretation };
    },
    nextSteps: {
      management: `Use the VBAC Success Calculator as one component in counseling. High scores support a trial of labor, whereas low scores indicate that repeat cesarean delivery may be safer.`,
      criticalActions: `Always incorporate a full obstetrical history and discuss risks and benefits with the patient.`
    },
    evidence: {
      references: [
        'Grobman WA, et al. Obstet Gynecol. 2007;110(5):1100–1107.'
      ],
      commentary: 'The VBAC Success Calculator uses key maternal factors to estimate the likelihood of a successful trial of labor after cesarean.'
    }
  },

  // 5) GDM Risk Calculator
  {
    name: 'GDM Risk Calculator',
    calcType: 'Diagnostic',
    description: 'Estimates the risk of gestational diabetes mellitus (GDM) based on maternal age, BMI, previous GDM, family history, and polycystic ovary syndrome (PCOS).',
    fields: [
      { label: 'Maternal Age (years)', type: 'number', key: 'age' },
      { label: 'BMI (kg/m²)', type: 'number', key: 'bmi' },
      { label: 'Previous GDM?', type: 'boolean', key: 'prevGdm' },
      { label: 'Family History of Diabetes?', type: 'boolean', key: 'famDiabetes' },
      { label: 'PCOS?', type: 'boolean', key: 'pcos' },
    ],
    computeScore(values) {
      let score = 0;
      const age = Number(values.age) || 0;
      const bmi = Number(values.bmi) || 0;
      
      if (age > 35) score += 1;
      if (bmi >= 30) score += 2;
      else if (bmi >= 25) score += 1;
      if (values.prevGdm) score += 3;
      if (values.famDiabetes) score += 2;
      if (values.pcos) score += 2;
      
      let interpretation = '';
      if (score <= 2) interpretation = 'Low risk for GDM.';
      else if (score <= 5) interpretation = 'Moderate risk for GDM; consider early screening.';
      else interpretation = 'High risk for GDM; close monitoring and early intervention are recommended.';
      return { score, interpretation };
    },
    nextSteps: {
      management: `For patients at moderate to high risk of GDM, recommend early glucose tolerance testing and nutritional counseling. Lifestyle interventions may reduce progression to GDM.`,
      criticalActions: `Confirm risk factors accurately. Use this tool in conjunction with clinical judgment and laboratory screening.`
    },
    evidence: {
      references: [
        'Ben-Haroush A, Yogev Y, Hod M. Diabetes Care. 2004;27(3):713–720.'
      ],
      commentary: 'This risk calculator is based on established risk factors for gestational diabetes and helps identify patients who would benefit from early screening.'
    }
  },

  // 6) Simplified FullPIERS Score for Preeclampsia
  {
    name: 'Simplified FullPIERS Score',
    calcType: 'Diagnostic',
    description: 'Estimates the risk of adverse maternal outcomes in preeclampsia using key clinical and laboratory parameters.',
    fields: [
      { label: 'Gestational Age (weeks)', type: 'number', key: 'gestAge' },
      { label: 'Systolic BP (mmHg)', type: 'number', key: 'sbp' },
      { label: 'Serum Creatinine (mg/dL)', type: 'number', key: 'creatinine' },
      { label: 'Platelet Count (×10⁹/L)', type: 'number', key: 'platelets' },
      { label: 'AST (IU/L)', type: 'number', key: 'ast' },
      { label: 'Headache present?', type: 'boolean', key: 'headache' },
    ],
    computeScore(values) {
      let score = 0;
      const gestAge = Number(values.gestAge) || 0;
      if (gestAge < 34) score += 2;
      else if (gestAge < 37) score += 1;
      
      const sbp = Number(values.sbp) || 0;
      if (sbp >= 160) score += 2;
      else if (sbp >= 140) score += 1;
      
      const creatinine = Number(values.creatinine) || 0;
      if (creatinine > 1.2) score += 2;
      else if (creatinine >= 0.8) score += 1;
      
      const platelets = Number(values.platelets) || 0;
      if (platelets < 100) score += 2;
      else if (platelets < 150) score += 1;
      
      const ast = Number(values.ast) || 0;
      if (ast > 70) score += 1;
      
      if (values.headache) score += 1;
      
      let interpretation = '';
      if (score <= 2) interpretation = 'Low risk of adverse outcomes.';
      else if (score <= 5) interpretation = 'Moderate risk; consider close maternal-fetal monitoring.';
      else interpretation = 'High risk; prompt intervention and ICU-level care are advised.';
      
      return { score, interpretation };
    },
    nextSteps: {
      management: `For preeclamptic patients, use this score to guide the level of care:
• Low scores suggest outpatient management with close follow-up.
• Moderate scores indicate the need for hospitalization and intensive monitoring.
• High scores require ICU admission and aggressive management.`,
      criticalActions: `Ensure lab values and clinical findings are up to date. This score is only one component of overall risk assessment in preeclampsia.`
    },
    evidence: {
      references: [
        'von Dadelszen P, Magee LA, et al. BJOG. 2011;118(2):212–218.'
      ],
      commentary: 'The simplified FullPIERS Score is designed to predict adverse maternal outcomes in preeclampsia and assist in triaging patient care.'
    }
  },

  // 7) Preterm Delivery Risk Calculator
  {
    name: 'Preterm Delivery Risk Calculator',
    calcType: 'Diagnostic',
    description: 'Estimates the risk of preterm delivery based on previous preterm birth, cervical length, smoking status, and uterine anomalies.',
    fields: [
      { label: 'Previous Preterm Delivery?', type: 'boolean', key: 'prevPreterm' },
      { label: 'Cervical Length (mm)', type: 'number', key: 'cervicalLength' },
      { label: 'Maternal Smoking?', type: 'boolean', key: 'smoking' },
      { label: 'Uterine Anomaly?', type: 'boolean', key: 'uterineAnomaly' },
    ],
    computeScore(values) {
      let score = 0;
      if (values.prevPreterm) score += 3;
      const length = Number(values.cervicalLength) || 0;
      if (length < 25) score += 3;
      else if (length < 30) score += 2;
      else if (length < 35) score += 1;
      if (values.smoking) score += 1;
      if (values.uterineAnomaly) score += 1;
      
      let interpretation = '';
      if (score <= 2) interpretation = 'Low risk for preterm delivery.';
      else if (score <= 5) interpretation = 'Moderate risk; consider preventive measures.';
      else interpretation = 'High risk; intensive monitoring and possible interventions are recommended.';
      
      return { score, interpretation };
    },
    nextSteps: {
      management: `For patients at moderate to high risk of preterm delivery, consider interventions such as progesterone supplementation, cervical cerclage if indicated, and increased surveillance with serial ultrasound.`,
      criticalActions: `Obtain accurate cervical length measurements and confirm obstetric history. Use this calculator as part of a broader assessment for preterm labor risk.`
    },
    evidence: {
      references: [
        'Iams JD, Goldenberg RL, et al. N Engl J Med. 1996;334(13):845–850.'
      ],
      commentary: 'This risk calculator integrates key factors that influence the likelihood of preterm delivery.'
    }
  },

  // 8) Postpartum Hemorrhage (PPH) Risk Calculator
  {
    name: 'PPH Risk Calculator',
    calcType: 'Diagnostic',
    description: 'Estimates the risk of postpartum hemorrhage based on antepartum anemia, multiple gestation, polyhydramnios, prolonged labor, uterine fibroids, and history of PPH.',
    fields: [
      { label: 'Antepartum Anemia?', type: 'boolean', key: 'anemia' },
      { label: 'Multiple Gestation?', type: 'boolean', key: 'multipleGestation' },
      { label: 'Polyhydramnios?', type: 'boolean', key: 'polyhydramnios' },
      { label: 'Prolonged Labor?', type: 'boolean', key: 'prolongedLabor' },
      { label: 'Uterine Fibroids?', type: 'boolean', key: 'fibroids' },
      { label: 'History of PPH?', type: 'boolean', key: 'historyPPH' },
    ],
    computeScore(values) {
      let score = 0;
      if (values.anemia) score += 2;
      if (values.multipleGestation) score += 1;
      if (values.polyhydramnios) score += 1;
      if (values.prolongedLabor) score += 1;
      if (values.fibroids) score += 1;
      if (values.historyPPH) score += 2;
      
      let interpretation = '';
      if (score <= 2) interpretation = 'Low risk of postpartum hemorrhage.';
      else if (score <= 4) interpretation = 'Moderate risk; consider additional monitoring and prophylactic measures.';
      else interpretation = 'High risk; prepare for possible transfusion and aggressive management of hemorrhage.';
      
      return { score, interpretation };
    },
    nextSteps: {
      management: `For low-risk patients, standard postpartum care is appropriate. Moderate-risk patients may require active management of the third stage of labor and availability of blood products. High-risk patients should have a detailed management plan including uterotonic agents and readiness for transfusion.`,
      criticalActions: `Accurately document obstetrical history and risk factors. Ensure that blood products and uterotonic agents are readily available in high-risk cases.`
    },
    evidence: {
      references: [
        'American College of Obstetricians and Gynecologists. Practice Bulletin No. 183: Postpartum Hemorrhage. Obstet Gynecol. 2017;130(4):e168–e186.'
      ],
      commentary: 'The PPH Risk Calculator aids in early identification of patients at risk for postpartum hemorrhage, allowing for proactive management.'
    }
  },
];
