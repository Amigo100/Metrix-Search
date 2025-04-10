// /tools/endocrinology-tools.ts

import { ScoreDefinition } from './types';

export const endocrinologyTools: ScoreDefinition[] = [
  // 1) FINDRISC Score for Diabetes Risk
  {
    name: 'FINDRISC Score',
    calcType: 'Diagnostic',
    description:
      'Estimates the 10-year risk of developing type 2 diabetes using factors such as age, BMI, waist circumference, physical activity, diet, history of high blood glucose, and family history.',
    fields: [
      { label: 'Age', type: 'select', key: 'age', options: ['<45', '45–54', '55–64', '>64'] },
      { label: 'Body Mass Index (BMI)', type: 'number', key: 'bmi' },
      { label: 'Waist Circumference (cm)', type: 'number', key: 'waist' },
      { label: 'Sex', type: 'select', key: 'sex', options: ['Male', 'Female'] },
      { label: 'Physical Activity (≥30 min/day)?', type: 'boolean', key: 'active' },
      { label: 'Daily consumption of fruits/vegetables?', type: 'boolean', key: 'fruitsVeg' },
      { label: 'History of high blood glucose?', type: 'boolean', key: 'highGlucose' },
      { label: 'Family history of diabetes', type: 'select', key: 'familyHistory', options: ['None', 'One relative', 'Two or more relatives'] },
    ],
    computeScore(values) {
      let score = 0;
      // Age points: <45 = 0, 45–54 = 2, 55–64 = 3, >64 = 4
      const age = values.age;
      if (age === '<45') score += 0;
      else if (age === '45–54') score += 2;
      else if (age === '55–64') score += 3;
      else if (age === '>64') score += 4;
      
      // BMI points: <25 = 0, 25–30 = 1, >30 = 3
      const bmi = Number(values.bmi) || 0;
      if (bmi < 25) score += 0;
      else if (bmi >= 25 && bmi <= 30) score += 1;
      else if (bmi > 30) score += 3;
      
      // Waist circumference: For Men: <94 = 0, 94–102 = 3, >102 = 4; For Women: <80 = 0, 80–88 = 3, >88 = 4.
      const waist = Number(values.waist) || 0;
      const sex = values.sex;
      if (sex === 'Male') {
        if (waist < 94) score += 0;
        else if (waist >= 94 && waist <= 102) score += 3;
        else if (waist > 102) score += 4;
      } else if (sex === 'Female') {
        if (waist < 80) score += 0;
        else if (waist >= 80 && waist <= 88) score += 3;
        else if (waist > 88) score += 4;
      }
      
      // Physical activity: Yes = 0, No = 2
      if (!values.active) score += 2;
      
      // Fruits/Vegetables: Yes = 0, No = 1
      if (!values.fruitsVeg) score += 1;
      
      // History of high blood glucose: Yes = 5, No = 0
      if (values.highGlucose) score += 5;
      
      // Family history: None = 0, One relative = 3, Two or more relatives = 5
      const family = values.familyHistory;
      if (family === 'None') score += 0;
      else if (family === 'One relative') score += 3;
      else if (family === 'Two or more relatives') score += 5;
      
      let interpretation = '';
      if (score < 7) interpretation = 'Low risk: The 10-year risk is very low.';
      else if (score >= 7 && score <= 11) interpretation = 'Slightly elevated risk: Lifestyle modifications are recommended.';
      else if (score >= 12 && score <= 14) interpretation = 'Moderate risk: Intensive lifestyle changes should be considered.';
      else if (score >= 15 && score <= 20) interpretation = 'High risk: Further evaluation and intervention are recommended.';
      else if (score > 20) interpretation = 'Very high risk: Immediate intervention is warranted.';
      
      return { score, interpretation };
    },
    nextSteps: {
      management: `Use the FINDRISC Score to determine the patient's risk of developing type 2 diabetes. For low risk, encourage healthy lifestyle habits and periodic screening. For intermediate risk, structured lifestyle intervention programs are recommended. High or very high risk should prompt further metabolic evaluation and consideration of pharmacologic intervention.`,
      criticalActions: `Ensure accurate anthropometric measurements (BMI and waist circumference) and review the patient's personal and family history thoroughly.`
    },
    evidence: {
      references: [
        'Lindström J, Tuomilehto J. Diabetes Care. 2003;26(3):725–731.',
        'MDCalc: FINDRISC Score.'
      ],
      commentary: `FINDRISC is a validated, non-invasive tool for predicting the 10-year risk of type 2 diabetes.`
    }
  },

  // 2) HOMA-IR Calculator for Insulin Resistance
  {
    name: 'HOMA-IR Calculator',
    calcType: 'Diagnostic',
    description:
      'Calculates insulin resistance using fasting insulin and fasting glucose values. Formula: HOMA-IR = (Fasting Insulin (µU/mL) × Fasting Glucose (mg/dL)) / 405.',
    fields: [
      { label: 'Fasting Insulin (µU/mL)', type: 'number', key: 'insulin' },
      { label: 'Fasting Glucose (mg/dL)', type: 'number', key: 'glucose' },
    ],
    computeScore(values) {
      const insulin = Number(values.insulin) || 0;
      const glucose = Number(values.glucose) || 0;
      const homaIR = (insulin * glucose) / 405;
      const interpretation =
        homaIR < 2.5
          ? 'Normal insulin sensitivity.'
          : 'Elevated HOMA-IR indicates insulin resistance.';
      return { score: parseFloat(homaIR.toFixed(2)), interpretation };
    },
    nextSteps: {
      management: `A HOMA-IR value below 2.5 is generally considered normal. Elevated values indicate insulin resistance and should prompt lifestyle interventions (diet and exercise) and, if necessary, pharmacologic treatment.`,
      criticalActions: `Ensure the patient fasts for at least 8 hours before testing. Interpret results in the context of other metabolic parameters.`
    },
    evidence: {
      references: [
        'Matthews DR, Hosker JP, et al. Diabetologia. 1985;28(7):412–419.',
        'MDCalc: HOMA-IR Calculator.'
      ],
      commentary: `HOMA-IR is a simple and widely used method for estimating insulin resistance.`
    }
  },

  // 3) QUICKI Calculator for Insulin Sensitivity
  {
    name: 'QUICKI Calculator',
    calcType: 'Diagnostic',
    description:
      'Calculates the Quantitative Insulin Sensitivity Check Index (QUICKI) using fasting insulin and fasting glucose levels. Formula: QUICKI = 1 / (log(fasting insulin) + log(fasting glucose)).',
    fields: [
      { label: 'Fasting Insulin (µU/mL)', type: 'number', key: 'insulin' },
      { label: 'Fasting Glucose (mg/dL)', type: 'number', key: 'glucose' },
    ],
    computeScore(values) {
      const insulin = Number(values.insulin) || 0;
      const glucose = Number(values.glucose) || 0;
      if (insulin <= 0 || glucose <= 0) {
        return { score: 0, interpretation: 'Invalid input: values must be greater than zero.' };
      }
      const quicki = 1 / (Math.log(insulin) + Math.log(glucose));
      let interpretation = '';
      if (quicki >= 0.45) interpretation = 'Normal insulin sensitivity.';
      else if (quicki >= 0.35) interpretation = 'Mild insulin resistance.';
      else interpretation = 'Significant insulin resistance.';
      return { score: parseFloat(quicki.toFixed(3)), interpretation };
    },
    nextSteps: {
      management: `Interpret the QUICKI value together with clinical findings. Values near 0.45 are generally normal, while lower values indicate increasing insulin resistance.`,
      criticalActions: `Ensure proper fasting (at least 8 hours) and valid laboratory measurements for both insulin and glucose.`
    },
    evidence: {
      references: [
        'Katz A, Nambi SS, et al. Diabetes Care. 2000;23(7):943–949.',
        'MDCalc: QUICKI Calculator (concept based on published formulas).'
      ],
      commentary: `QUICKI is a validated and simple method for estimating insulin sensitivity that correlates with more complex tests.`
    }
  },

  // 4) HOMA-B Calculator for Beta-cell Function
  {
    name: 'HOMA-B Calculator',
    calcType: 'Diagnostic',
    description:
      'Estimates pancreatic beta-cell function using fasting insulin and fasting glucose. Formula: HOMA-B = (20 × fasting insulin) / ((fasting glucose / 18) - 3.5).',
    fields: [
      { label: 'Fasting Insulin (µU/mL)', type: 'number', key: 'insulin' },
      { label: 'Fasting Glucose (mg/dL)', type: 'number', key: 'glucose' },
    ],
    computeScore(values) {
      const insulin = Number(values.insulin) || 0;
      const glucoseMg = Number(values.glucose) || 0;
      if (insulin <= 0 || glucoseMg <= 0) {
        return { score: 0, interpretation: 'Invalid input: values must be greater than zero.' };
      }
      const glucoseMmol = glucoseMg / 18;
      if (glucoseMmol <= 3.5) {
        return { score: 0, interpretation: 'Fasting glucose is too low for a reliable HOMA-B calculation.' };
      }
      const homaB = (20 * insulin) / (glucoseMmol - 3.5);
      const interpretation = `Estimated beta-cell function is ${parseFloat(homaB.toFixed(2))}. Higher values suggest better beta-cell function.`;
      return { score: homaB, interpretation };
    },
    nextSteps: {
      management: `Use the HOMA-B value to assess beta-cell function. Low values may indicate beta-cell dysfunction, prompting further evaluation for diabetes or other metabolic disorders.`,
      criticalActions: `Ensure the patient has been fasting for at least 8 hours and that laboratory measurements are accurate.`
    },
    evidence: {
      references: [
        'Matthews DR, Hosker JP, et al. Diabetologia. 1985;28(7):412–419.',
        'MDCalc: HOMA-B Calculator (concept based on published formulas).'
      ],
      commentary: `HOMA-B is commonly used to estimate pancreatic beta-cell function in the assessment of glucose homeostasis.`
    }
  },

  // 5) TyG Index for Insulin Resistance
  {
    name: 'TyG Index',
    calcType: 'Diagnostic',
    description:
      'Calculates the triglyceride-glucose (TyG) index as a surrogate marker for insulin resistance. Formula: TyG = ln((Fasting Triglycerides (mg/dL) × Fasting Glucose (mg/dL)) / 2).',
    fields: [
      { label: 'Fasting Triglycerides (mg/dL)', type: 'number', key: 'triglycerides' },
      { label: 'Fasting Glucose (mg/dL)', type: 'number', key: 'glucose' },
    ],
    computeScore(values) {
      const triglycerides = Number(values.triglycerides) || 0;
      const glucose = Number(values.glucose) || 0;
      if (triglycerides <= 0 || glucose <= 0) {
        return { score: 0, interpretation: 'Invalid input: values must be greater than zero.' };
      }
      const tyg = Math.log((triglycerides * glucose) / 2);
      let interpretation = '';
      if (tyg < 8.5) interpretation = 'Normal insulin sensitivity.';
      else if (tyg >= 8.5 && tyg < 8.8) interpretation = 'Borderline; possible mild insulin resistance.';
      else interpretation = 'Elevated TyG indicates insulin resistance.';
      return { score: parseFloat(tyg.toFixed(3)), interpretation };
    },
    nextSteps: {
      management: `The TyG index can be used as an additional marker of insulin resistance. In patients with elevated TyG, consider further evaluation and lifestyle modifications aimed at reducing insulin resistance.`,
      criticalActions: `Ensure accurate fasting measurements of both triglycerides and glucose. Interpret the TyG index alongside other metabolic assessments.`
    },
    evidence: {
      references: [
        'Guerrero-Romero F, et al. Diabetes Metab Res Rev. 2010;26(3):189–197.',
        'MDCalc: TyG Index (concept based on published formulas).'
      ],
      commentary: `The TyG Index is a validated surrogate marker for insulin resistance that correlates well with more complex measurements.`
    }
  },

  // 6) Burch-Wartofsky Score for Thyroid Storm
  {
    name: 'Burch-Wartofsky Score',
    calcType: 'Diagnostic',
    description:
      'Assesses the likelihood and severity of thyroid storm based on temperature, CNS effects, gastrointestinal-hepatic dysfunction, cardiovascular dysfunction, and presence of a precipitating event.',
    fields: [
      { label: 'Temperature (°C)', type: 'number', key: 'temperature' },
      {
        label: 'CNS Effects',
        type: 'select',
        key: 'cns',
        options: ['0 - None', '10 - Mild (agitation)', '20 - Moderate (confusion)', '30 - Severe (coma)']
      },
      {
        label: 'Gastrointestinal-hepatic dysfunction',
        type: 'select',
        key: 'gi',
        options: ['0 - None', '10 - Moderate (nausea/vomiting)', '20 - Severe (jaundice)']
      },
      { label: 'Heart Rate (bpm)', type: 'number', key: 'hr' },
      { label: 'Atrial Fibrillation?', type: 'boolean', key: 'afib' },
      { label: 'Congestive Heart Failure?', type: 'boolean', key: 'chf' },
      { label: 'Precipitating Event present?', type: 'boolean', key: 'precipitating' },
    ],
    computeScore(values) {
      let score = 0;
      // Temperature scoring: each degree above 37°C gives 5 points; for simplicity, use: (temperature - 37) * 5 if >37
      const temp = Number(values.temperature) || 37;
      if (temp > 37) score += (temp - 37) * 5;

      // CNS Effects: extract the numeric part from the selection
      const cnsPoints = Number(values.cns.split(' ')[0]) || 0;
      score += cnsPoints;

      // GI dysfunction: similarly extract points
      const giPoints = Number(values.gi.split(' ')[0]) || 0;
      score += giPoints;

      // Heart rate: thresholds: 90–109 = 5 pts; 110–129 = 10 pts; 130–149 = 15 pts; ≥150 = 20 pts.
      const hr = Number(values.hr) || 0;
      if (hr >= 150) score += 20;
      else if (hr >= 130) score += 15;
      else if (hr >= 110) score += 10;
      else if (hr >= 90) score += 5;

      // Atrial fibrillation: add 10 points if yes
      if (values.afib) score += 10;
      // CHF: add 10 points if yes
      if (values.chf) score += 10;
      // Precipitating event: add 10 points if yes
      if (values.precipitating) score += 10;

      let interpretation = '';
      if (score < 25) interpretation = 'Thyroid storm unlikely.';
      else if (score < 45) interpretation = 'Impending thyroid storm.';
      else interpretation = 'Thyroid storm is likely.';
      return { score, interpretation };
    },
    nextSteps: {
      management: `A Burch-Wartofsky Score <25 makes thyroid storm unlikely. Scores between 25 and 44 indicate an impending storm and warrant close monitoring and preparation for intervention, while scores ≥45 are highly suggestive of thyroid storm, requiring immediate, aggressive treatment (e.g., beta-blockers, antithyroid medications, corticosteroids, supportive care, and ICU admission).`,
      criticalActions: `Ensure accurate measurement of temperature and assessment of clinical findings. Thyroid storm is a clinical emergency; treatment decisions should be made in conjunction with endocrinology consultation.`
    },
    evidence: {
      references: [
        'Burch HB, Wartofsky L. JAMA. 1993;270(12):1483–1486.',
        'MDCalc: Burch-Wartofsky Score.'
      ],
      commentary: `The Burch-Wartofsky Score is widely used to assess the probability of thyroid storm and guide urgent management decisions.`
    }
  },
];
