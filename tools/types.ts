// /tools/types.ts

/**
 * A single calculator field: either boolean, numeric, or select options.
 */
export interface ScoreField {
  label: string;
  type: 'number' | 'boolean' | 'select';
  key: string;
  options?: string[]; // used if type === 'select'
}

/**
 * Optional "next steps" block for each calculator:
 * - management: string describing recommended management steps
 * - criticalActions: string describing important actions to take
 * - resultSpecificAdvice?: a map from a numeric score to specific advice
 */
export interface NextStepsBlock {
  management: string;
  criticalActions: string;
  resultSpecificAdvice?: Record<number, string>;
}

/**
 * Optional references/evidence block:
 * - references: an array of reference strings
 * - commentary: optional commentary text block
 */
export interface EvidenceBlock {
  references: string[];
  commentary?: string;
}

/**
 * The main interface for each calculator tool.
 *
 * A new optional property 'calcType' is added to classify the calculator
 * (e.g., 'Diagnostic', 'Prognostic', etc.).
 */
export interface ScoreDefinition {
  name: string;
  description: string;
  fields: ScoreField[];
  /**
   * A function that takes user-entered values and returns:
   *   - score: numeric result
   *   - interpretation: textual meaning
   */
  computeScore: (values: Record<string, any>) => {
    score: number;
    interpretation: string;
  };
  /**
   * Classify the calculator's type or usage (e.g., 'Diagnostic').
   */
  calcType?: string;
  /**
   * Optional guidance on next steps or management based on the score.
   */
  nextSteps?: NextStepsBlock;
  /**
   * Optional references or commentary for the tool.
   */
  evidence?: EvidenceBlock;
}
