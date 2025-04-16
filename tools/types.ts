// file: /tools/types.ts

/**
 * Base interface for common properties of all score fields.
 */
interface ScoreFieldBase {
  label: string;
  key: string;
  type: 'number' | 'boolean' | 'select';
}

/**
 * Interface for a numeric input field, extending the base.
 * Includes optional properties for step, min, and max values.
 */
interface ScoreFieldNumber extends ScoreFieldBase {
  type: 'number';
  step?: number | string; // step can be a number or 'any'
  min?: number;
  max?: number;
}

/**
 * Interface for a boolean (checkbox) input field.
 */
interface ScoreFieldBoolean extends ScoreFieldBase {
  type: 'boolean';
}

/**
 * Interface for a select (dropdown) input field.
 * Includes optional 'options' array.
 */
interface ScoreFieldSelect extends ScoreFieldBase {
  type: 'select';
  options?: string[];
}

/**
 * A union type representing any possible score field.
 * This is the type used in ScoreDefinition.fields.
 */
export type ScoreField = ScoreFieldNumber | ScoreFieldBoolean | ScoreFieldSelect;

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
  fields: ScoreField[]; // Uses the updated union type
  /**
   * A function that takes user-entered values and returns:
   * - score: numeric result
   * - interpretation: textual meaning
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

