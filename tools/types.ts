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
   * A new optional property 'calcType' is added to classify the calculator (e.g., 'Diagnostic', 'Prognostic', etc.).
   */
  export interface ScoreDefinition {
    name: string;
    description: string;
    fields: ScoreField[];
    computeScore: (values: Record<string, any>) => { score: number; interpretation: string };
    calcType?: string; // e.g., 'Diagnostic', 'Prognostic', 'Rule Out', 'Treatment', 'Drug Conversion'
    nextSteps?: NextStepsBlock;
    evidence?: EvidenceBlock;
  }
  