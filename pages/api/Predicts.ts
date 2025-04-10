// /pages/api/predicts.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface BreachModelData {
  intercept: number;
  coefficients: {
    age?: number;
    triageCode?: number;
    patientsAhead?: number;
    occupancy_high?: number;
    occupancy_critical?: number;
    alteredMentalStatus?: number;
    // ... any other feature coefficients ...
  };
  admission_intercept?: number;
  admission_coefficients?: { [key: string]: number };
  wait_time_intercept?: number;
  wait_time_coefficients?: { [key: string]: number };
}

interface PredictionResult {
  wait3h: number;
  wait4h: number;
  wait5h: number;
  wait6h: number;
  admissionLikelihood: number;
  predictedWaitMinutes: number;
}

function runInference(inputs: any, modelData: BreachModelData): PredictionResult {
  console.log('Running inference with inputs:', inputs);
  console.log('Using model data:', modelData);

  // Start with intercepts
  let breachScore = modelData.intercept ?? 0;
  let admissionScore = modelData.admission_intercept ?? 0;
  let waitScore = modelData.wait_time_intercept ?? 30;

  // Model coefficients
  const coeffs = modelData.coefficients ?? {};
  const admissionCoeffs = modelData.admission_coefficients ?? {};
  const waitCoeffs = modelData.wait_time_coefficients ?? {};

  // --- Example calculation for breachScore ---
  breachScore += (inputs.age ?? 0) * (coeffs.age ?? 0);
  breachScore += (inputs.triageCode ?? 3) * (coeffs.triageCode ?? 0);
  breachScore += (inputs.patientsAhead ?? 0) * (coeffs.patientsAhead ?? 0);

  if (inputs.occupancy === 'high' && coeffs.occupancy_high) {
    breachScore += coeffs.occupancy_high;
  }
  if (inputs.occupancy === 'critical' && coeffs.occupancy_critical) {
    breachScore += coeffs.occupancy_critical;
  }
  if (inputs.alteredMentalStatus && coeffs.alteredMentalStatus) {
    breachScore += coeffs.alteredMentalStatus;
  }

  // --- Example calculation for admissionScore ---
  admissionScore += (inputs.age ?? 0) * (admissionCoeffs.age ?? 0);
  if (inputs.alteredMentalStatus && admissionCoeffs.alteredMentalStatus) {
    admissionScore += admissionCoeffs.alteredMentalStatus;
  }

  // --- Example calculation for waitScore ---
  waitScore += (inputs.patientsAhead ?? 0) * (waitCoeffs.patientsAhead ?? 10);
  if (inputs.occupancy === 'high' && waitCoeffs.occupancy_high) {
    waitScore += waitCoeffs.occupancy_high;
  }
  if (inputs.occupancy === 'critical' && waitCoeffs.occupancy_critical) {
    waitScore += waitCoeffs.occupancy_critical;
  }

  // Simple sigmoid for demonstration, returning a 0-100 scale
  const sigmoid = (score: number) => 100 / (1 + Math.exp(-score));
  const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

  const baseLikelihood = sigmoid(breachScore);

  return {
    wait3h: clamp(baseLikelihood * 0.8, 5, 98),
    wait4h: clamp(baseLikelihood * 0.9, 5, 98),
    wait5h: clamp(baseLikelihood * 1.0, 5, 98),
    wait6h: clamp(baseLikelihood * 1.1, 5, 98),
    admissionLikelihood: clamp(sigmoid(admissionScore), 2, 95),
    predictedWaitMinutes: Math.max(10, Math.round(waitScore)),
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<PredictionResult | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res
      .status(405)
      .json({ error: `Method ${req.method} Not Allowed` });
  }

  let modelData: BreachModelData;
  try {
    const filePath = path.join(process.cwd(), 'public', 'models', 'Breach.JSON');
    console.log(`Attempting to load model from: ${filePath}`);

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    modelData = JSON.parse(fileContent);
  } catch (error: any) {
    console.error('Error loading or parsing Breach.JSON:', error);
    return res
      .status(500)
      .json({ error: 'Failed to load prediction model data.' });
  }

  const inputs = req.body;
  if (!inputs || typeof inputs !== 'object') {
    return res.status(400).json({ error: 'Invalid input data provided.' });
  }
  if (typeof inputs.age === 'undefined') {
    return res
      .status(400)
      .json({ error: 'Missing required field: age' });
  }

  try {
    const results = runInference(inputs, modelData);
    return res.status(200).json(results);
  } catch (error: any) {
    console.error('Error during model inference:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred during prediction.' });
  }
}
