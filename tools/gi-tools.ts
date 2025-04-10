import { ScoreDefinition } from './types';

export const giTools: ScoreDefinition[] = [
  // 1) Child-Pugh Score for Cirrhosis
  {
    name: "Child-Pugh Score",
    calcType: "Diagnostic",
    description:
      "Assesses the severity of chronic liver disease by scoring total bilirubin, serum albumin, INR, ascites, and hepatic encephalopathy.",
    fields: [
      { label: "Total Bilirubin (mg/dL)", type: "number", key: "bilirubin" },
      { label: "Serum Albumin (g/dL)", type: "number", key: "albumin" },
      { label: "INR", type: "number", key: "inr" },
      { label: "Ascites", type: "select", key: "ascites", options: ["None", "Mild", "Moderate-Severe"] },
      { label: "Hepatic Encephalopathy", type: "select", key: "encephalopathy", options: ["None", "Grade I-II", "Grade III-IV"] },
    ],
    computeScore(values) {
      let score = 0;
      const bilirubin = Number(values.bilirubin) || 0;
      if (bilirubin < 2) score += 1;
      else if (bilirubin < 3) score += 2;
      else score += 3;
      
      const albumin = Number(values.albumin) || 0;
      if (albumin > 3.5) score += 1;
      else if (albumin >= 2.8) score += 2;
      else score += 3;
      
      const inr = Number(values.inr) || 0;
      if (inr < 1.7) score += 1;
      else if (inr <= 2.3) score += 2;
      else score += 3;
      
      const ascites = values.ascites;
      if (ascites === "None") score += 1;
      else if (ascites === "Mild") score += 2;
      else if (ascites === "Moderate-Severe") score += 3;
      
      const enceph = values.encephalopathy;
      if (enceph === "None") score += 1;
      else if (enceph === "Grade I-II") score += 2;
      else if (enceph === "Grade III-IV") score += 3;
      
      let interpretation = "";
      if (score <= 6) interpretation = "Class A (well-compensated; low 1-year mortality).";
      else if (score <= 9) interpretation = "Class B (significant compromise; moderate 1-year mortality).";
      else interpretation = "Class C (decompensated; high 1-year mortality).";
      
      return { score, interpretation };
    },
    nextSteps: {
      management: `Use the Child-Pugh Score to classify cirrhosis severity:
• Class A (5–6 points): Routine monitoring and lifestyle advice.
• Class B (7–9 points): Closer surveillance and management of complications (e.g., variceal screening).
• Class C (10–15 points): High risk; consider evaluation for liver transplantation.`,
      criticalActions: `Ensure laboratory and clinical assessments (ascites, encephalopathy) are performed accurately. Use the score together with other clinical evaluations for transplant candidacy.`
    },
    evidence: {
      references: [
        "Pugh RN, et al. Br J Surg. 1973;60(8):646–649.",
        "MDCalc: Child-Pugh Score."
      ],
      commentary: `The Child-Pugh Score is a longstanding and widely accepted tool for assessing the prognosis of chronic liver disease.`
    }
  },

  // 2) MELD Score for End-Stage Liver Disease
  {
    name: "MELD Score",
    calcType: "Diagnostic",
    description:
      "Predicts 3‑month mortality in patients with end‑stage liver disease using total bilirubin, INR, and serum creatinine.",
    fields: [
      { label: "Total Bilirubin (mg/dL)", type: "number", key: "bilirubin" },
      { label: "INR", type: "number", key: "inr" },
      { label: "Serum Creatinine (mg/dL)", type: "number", key: "creatinine" },
    ],
    computeScore(values) {
      const bilirubin = Math.max(Number(values.bilirubin) || 1, 1);
      const inr = Math.max(Number(values.inr) || 1, 1);
      const creatinine = Math.max(Number(values.creatinine) || 1, 1);
      const meld = Math.round(
        3.78 * Math.log(bilirubin) +
        11.2 * Math.log(inr) +
        9.57 * Math.log(creatinine) +
        6.43
      );
      const interpretation = `MELD Score = ${meld}. Lower scores indicate better liver function; scores above 20 suggest high short-term mortality.`;
      return { score: meld, interpretation };
    },
    nextSteps: {
      management: `Use the MELD Score to evaluate the urgency for liver transplantation:
• MELD <10: Relatively low risk.
• MELD 10–19: Intermediate risk; consider medical management.
• MELD ≥20: High risk; prompt transplant evaluation is warranted.`,
      criticalActions: `Ensure that laboratory values are current and accurate, and recalculate frequently as the patient's condition evolves.`
    },
    evidence: {
      references: [
        "Kamath PS, et al. Hepatology. 2001;33(2):464–470.",
        "MDCalc: MELD Score."
      ],
      commentary: `The MELD Score is integral for liver transplant prioritization and predicting short-term mortality in end-stage liver disease.`
    }
  },

  // 3) Ranson's Criteria for Acute Pancreatitis (Admission)
  {
    name: "Ranson's Criteria (Admission)",
    calcType: "Diagnostic",
    description:
      "Assesses the severity of acute pancreatitis on admission using five criteria: age >55, WBC >16,000/mm³, blood glucose >200 mg/dL, AST >250 IU/L, and LDH >350 IU/L.",
    fields: [
      { label: "Age >55 years", type: "boolean", key: "ageOver55" },
      { label: "WBC >16,000/mm³", type: "boolean", key: "wbcHigh" },
      { label: "Blood Glucose >200 mg/dL", type: "boolean", key: "glucoseHigh" },
      { label: "AST >250 IU/L", type: "boolean", key: "astHigh" },
      { label: "LDH >350 IU/L", type: "boolean", key: "ldhHigh" },
    ],
    computeScore(values) {
      let score = 0;
      if (values.ageOver55) score++;
      if (values.wbcHigh) score++;
      if (values.glucoseHigh) score++;
      if (values.astHigh) score++;
      if (values.ldhHigh) score++;
      
      let interpretation = "";
      if (score <= 2) interpretation = "Low risk of mortality (approx. 2%).";
      else if (score <= 4) interpretation = "Moderate risk of mortality (approx. 15%).";
      else interpretation = "High risk of mortality (approx. 40%).";
      
      return { score, interpretation };
    },
    nextSteps: {
      management: `For Ranson's admission criteria:
• Score 0–2: Conservative management with supportive care.
• Score 3–4: Admit for intensive monitoring, aggressive fluid resuscitation, and early nutritional support.
• Score 5: High risk; consider ICU admission and early intervention for complications.`,
      criticalActions: `Repeat laboratory assessments at 48 hours to complete the full Ranson's criteria. Use these findings in conjunction with clinical judgment to determine the need for ICU care.`
    },
    evidence: {
      references: [
        "Ranson JH, et al. Surg Gynecol Obstet. 1974;139(1):69–81.",
        "MDCalc: Ranson’s Criteria for Acute Pancreatitis."
      ],
      commentary: `Ranson's Criteria provide an early prognostic assessment for acute pancreatitis and guide decisions regarding the level of care required.`
    }
  },

  // 4) BISAP Score for Acute Pancreatitis
  {
    name: "BISAP Score",
    calcType: "Diagnostic",
    description:
      "A simplified score to predict 30-day mortality in acute pancreatitis using BUN >25 mg/dL, impaired mental status, SIRS, age >60, and presence of pleural effusion.",
    fields: [
      { label: "BUN >25 mg/dL", type: "boolean", key: "bunHigh" },
      { label: "Impaired mental status", type: "boolean", key: "mentalStatus" },
      { label: "SIRS present", type: "boolean", key: "sirs" },
      { label: "Age >60 years", type: "boolean", key: "ageOver60" },
      { label: "Pleural effusion on imaging", type: "boolean", key: "pleuralEffusion" },
    ],
    computeScore(values) {
      let score = 0;
      if (values.bunHigh) score++;
      if (values.mentalStatus) score++;
      if (values.sirs) score++;
      if (values.ageOver60) score++;
      if (values.pleuralEffusion) score++;
      
      let interpretation = score === 0 
        ? "Low risk of 30-day mortality." 
        : `BISAP Score = ${score}. A score of 2 or more is associated with increased mortality risk.`;
      
      return { score, interpretation };
    },
    nextSteps: {
      management: `For BISAP:
• Score 0–1: Consider outpatient management if the patient is clinically stable.
• Score ≥2: Admit for intensive monitoring, aggressive supportive care, and early nutritional support.`,
      criticalActions: `Reassess the patient if clinical status changes; BISAP is an early indicator and should be used with a complete clinical evaluation.`
    },
    evidence: {
      references: [
        "Aujesky D, et al. JAMA. 2008;299(3):289–296.",
        "MDCalc: BISAP Score."
      ],
      commentary: "BISAP is a validated, simplified tool for predicting 30-day mortality in acute pancreatitis."
    }
  },

  // 5) Glasgow-Blatchford Bleeding Score for Upper GI Bleeding
  {
    name: "Glasgow-Blatchford Bleeding Score",
    calcType: "Diagnostic",
    description:
      "Assesses the need for intervention in upper gastrointestinal bleeding based on blood urea, hemoglobin, systolic BP, heart rate, and clinical presentation.",
    fields: [
      { label: "Blood Urea (mmol/L)", type: "number", key: "urea" },
      { label: "Hemoglobin (g/dL)", type: "number", key: "hb" },
      { label: "Systolic BP (mmHg)", type: "number", key: "sbp" },
      { label: "Heart Rate (bpm)", type: "number", key: "hr" },
      { label: "Melena present?", type: "boolean", key: "melena" },
      { label: "Syncope?", type: "boolean", key: "syncope" },
      { label: "Hepatic disease?", type: "boolean", key: "hepatic" },
      { label: "Cardiac failure?", type: "boolean", key: "cardiac" },
    ],
    computeScore(values) {
      let score = 0;
      const urea = Number(values.urea) || 0;
      if (urea >= 6.5) score += 2;
      else if (urea >= 3.5) score += 1;
      
      const hb = Number(values.hb) || 0;
      if (hb < 10) score += 3;
      else if (hb < 12) score += 1;
      
      const sbp = Number(values.sbp) || 0;
      if (sbp < 90) score += 2;
      else if (sbp < 100) score += 1;
      
      const hr = Number(values.hr) || 0;
      if (hr >= 100) score += 1;
      
      if (values.melena) score += 1;
      if (values.syncope) score += 1;
      if (values.hepatic) score += 1;
      if (values.cardiac) score += 1;
      
      let interpretation = '';
      if (score === 0) interpretation = "Low risk: outpatient management may be appropriate.";
      else if (score <= 2) interpretation = `Moderate risk: Score = ${score}. Consider in-hospital evaluation and possible endoscopic intervention.`;
      else interpretation = `High risk: Score = ${score}. Urgent intervention and hospitalization are likely required.`;
      
      return { score, interpretation };
    },
    nextSteps: {
      management: `A low Glasgow-Blatchford score supports outpatient management, while moderate to high scores require hospital admission, close monitoring, and possible endoscopic or interventional therapy.`,
      criticalActions: `Ensure timely laboratory evaluation. Clinical judgment must complement the score, especially if the patient’s presentation is concerning.`
    },
    evidence: {
      references: [
        "Blatchford O, et al. Lancet. 2000;356(9238):1318–1323.",
        "MDCalc: Glasgow-Blatchford Bleeding Score."
      ],
      commentary: "The Glasgow-Blatchford Bleeding Score is an important tool for stratifying risk in upper GI bleeding."
    }
  },
];

