import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Calculator,
  HelpCircle,
  FileText,
} from 'lucide-react';                       // Using Lucide icons

import Link from 'next/link';
import PageHeader from '@/components/PageHeader'; // ⭐ NEW – canonical header
import { Label } from '@/components/ui/label';

// Scoring‑tool definitions
import { cardioRiskTools }       from '@/tools/cardiorisk-tools';
import { pulmonaryTools }        from '@/tools/pulmonary-tools';
import { giTools }               from '@/tools/gi-tools';
import { neuroTools }            from '@/tools/neuro-tools';
import { endocrinologyTools }    from '@/tools/endocrinology-tools';
import { obgynTools }            from '@/tools/obgyn-tools';
import { ScoreDefinition }       from '@/tools/types';

/* -------------------------------------------------------------------------- */
/*  Local constants – unchanged                                               */
/* -------------------------------------------------------------------------- */

const categorizedTools: { [key: string]: ScoreDefinition[] } = {
  Cardiology: cardioRiskTools,
  Pulmonology: pulmonaryTools,
  Gastroenterology: giTools,
  Neurology: neuroTools,
  Endocrinology: endocrinologyTools,
  'OB/GYN': obgynTools,
};

const calcTypeOptions = [
  'All',
  'Diagnostic',
  'Prognostic',
  'Rule Out',
  'Treatment',
  'Drug Conversion',
];

const DISCLAIMER_TEXT =
  `Metrix AI enhances clinical decision‑making with risk and scoring tools. ` +
  `These tools are intended for reference and informational purposes only ` +
  `and do not substitute for professional clinical judgment. ` +
  `Always verify results and consult relevant guidelines.`;

/*  Re‑usable Tailwind snippets (as before) */
const formInputStyles      = 'block w-full rounded-lg border border-gray-300 py-2 px-3 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-sm';
const formSelectStyles     = `${formInputStyles} appearance-none pr-8`;
const formCheckboxStyles   = 'h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-1';

const primaryButtonStyles  = 'inline-flex items-center justify-center px-6 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-md disabled:opacity-70 disabled:cursor-not-allowed';
const secondaryButtonStyles= 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed';

const filterButtonBase     = 'px-3 py-1.5 text-sm font-medium rounded-full border transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500';
const filterButtonSelected = 'bg-teal-600 text-white border-teal-600';
const filterButtonDefault  = 'bg-white text-gray-600 border-gray-300 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200';

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function ClinicalScoringToolsPage() {
  /* ----- State ----- */
  const [inputValue, setInputValue]           = useState('');
  const [selectedCalcType, setSelectedCalcType] = useState('All');
  const [showDropdown, setShowDropdown]       = useState(false);
  const [selectedTool, setSelectedTool]       = useState<ScoreDefinition | null>(null);
  const [formValues, setFormValues]           = useState<Record<string, any>>({});
  const [scoreResult, setScoreResult]         = useState<{ score: number; interpretation: string } | null>(null);
  const [showNextSteps, setShowNextSteps]     = useState(false);
  const [showEvidence, setShowEvidence]       = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  /* ----- Derived data ----- */
  const filteredCategorizedTools = useMemo(() => {
    const result: { [key: string]: ScoreDefinition[] } = {};
    Object.keys(categorizedTools).forEach((category) => {
      const filtered = categorizedTools[category].filter((tool) => {
        const matchesSearch =
          tool.name.toLowerCase().includes(inputValue.toLowerCase());
        const matchesType =
          selectedCalcType === 'All' ||
          (tool.calcType &&
            tool.calcType.toLowerCase() === selectedCalcType.toLowerCase());
        return matchesSearch && matchesType;
      });
      if (filtered.length > 0) result[category] = filtered;
    });
    return result;
  }, [inputValue, selectedCalcType]);

  /* ----- Effects ----- */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ----- Handlers ----- */
  const handleSelectTool = (tool: ScoreDefinition) => {
    setSelectedTool(tool);
    setFormValues({});
    setScoreResult(null);
    setInputValue(tool.name);
    setShowDropdown(false);
    setShowNextSteps(false);
    setShowEvidence(false);
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldKey]: value }));
    setScoreResult(null);
  };

  const handleCalculate = () => {
    if (!selectedTool) return;
    const result = selectedTool.computeScore(formValues);
    setScoreResult(result);
    document
      .getElementById('score-result')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white via-teal-50 to-white px-6 md:px-8 pb-16 pt-12 flex flex-col items-center">

      {/* ✅ Canonical header – centred logo + title + subtitle */}
      <PageHeader
        title="Clinical Risk & Scoring Tools"
        subtitle="Access a wide range of validated scoring systems and calculators to aid in clinical decision‑making. Select a tool below or search by name."
        leftSlot={
          <Link href="/" className="text-sm text-teal-600 hover:underline">
            Policy Search
          </Link>
        }
      />

      {/* Main content follows – identical to your original implementation */}
      <div className="w-full max-w-3xl mx-auto space-y-8">

        {/* ------------------------------------------------------------------ */}
        {/*  Filter / Search                                                   */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">

          {/* Filter chips */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2 text-center sm:text-left">
              Filter by Type:
            </Label>
            <div className="flex gap-2 flex-wrap justify-center">
              {calcTypeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedCalcType(option)}
                  className={`${filterButtonBase} ${
                    selectedCalcType === option
                      ? filterButtonSelected
                      : filterButtonDefault
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Search + dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Label
              htmlFor="tool-search"
              className="block text-sm font-medium text-gray-700 mb-1 text-center sm:text-left"
            >
              Search or Select a Tool:
            </Label>
            <div className="relative">
              <input
                id="tool-search"
                type="text"
                className={`${formInputStyles} pr-10`}
                placeholder="Type to search tools..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setShowDropdown(true);
                }}
                onClick={() => setShowDropdown(!showDropdown)}
                aria-autocomplete="list"
                aria-expanded={showDropdown}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Toggle tool list"
              >
                {showDropdown ? (
                  <ChevronUp size={20} aria-hidden="true" />
                ) : (
                  <ChevronDown size={20} aria-hidden="true" />
                )}
              </button>
            </div>

            {showDropdown && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-auto focus:outline-none">
                {Object.keys(filteredCategorizedTools).length === 0 ? (
                  <div className="p-3 text-gray-500 text-sm">
                    No matches found
                  </div>
                ) : (
                  Object.keys(filteredCategorizedTools).map((category) => (
                    <div key={category}>
                      <div className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold uppercase tracking-wider sticky top-0">
                        {category}
                      </div>
                      {filteredCategorizedTools[category].map((tool) => (
                        <div
                          key={tool.name}
                          className="px-3 py-2 hover:bg-teal-50 cursor-pointer text-gray-800 text-sm"
                          onClick={() => handleSelectTool(tool)}
                          role="option"
                          aria-selected={selectedTool?.name === tool.name}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ')
                              handleSelectTool(tool);
                          }}
                        >
                          {tool.name}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/*  Selected‑tool card                                                */}
        {/* ------------------------------------------------------------------ */}
        {selectedTool && (
          <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-6 md:p-8 w-full">
            <h2 className="text-xl md:text-2xl font-semibold text-teal-700 mb-2 text-center">
              {selectedTool.name}
            </h2>
            <p className="text-sm text-gray-600 mb-6 text-center max-w-xl mx-auto">
              {selectedTool.description}
            </p>

            {/* Dynamic fields */}
            <div className="space-y-5">
              {selectedTool.fields.map((field) => {
                /* Checkbox */
                if (field.type === 'boolean') {
                  return (
                    <div
                      key={field.key}
                      className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200"
                    >
                      <input
                        type="checkbox"
                        id={field.key}
                        className={formCheckboxStyles}
                        checked={!!formValues[field.key]}
                        onChange={(e) =>
                          handleFieldChange(field.key, e.target.checked)
                        }
                      />
                      <Label
                        htmlFor={field.key}
                        className="text-gray-800 text-sm cursor-pointer"
                      >
                        {field.label}
                      </Label>
                    </div>
                  );
                }

                /* Number */
                if (field.type === 'number') {
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <Label
                        htmlFor={field.key}
                        className="text-gray-700 font-medium text-sm"
                      >
                        {field.label}
                      </Label>
                      <input
                        type="number"
                        id={field.key}
                        className={formInputStyles}
                        value={formValues[field.key] || ''}
                        onChange={(e) =>
                          handleFieldChange(field.key, e.target.value)
                        }
                        step={field.step || 'any'}
                        min={field.min}
                        max={field.max}
                      />
                    </div>
                  );
                }

                /* Select */
                if (field.type === 'select') {
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <Label
                        htmlFor={field.key}
                        className="text-gray-700 font-medium text-sm"
                      >
                        {field.label}
                      </Label>
                      <div className="relative">
                        <select
                          id={field.key}
                          className={formSelectStyles}
                          value={formValues[field.key] || ''}
                          onChange={(e) =>
                            handleFieldChange(field.key, e.target.value)
                          }
                        >
                          <option value="" disabled>
                            -- Select --
                          </option>
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>

            {/* Calculate button */}
            <div className="mt-8 text-center">
              <button onClick={handleCalculate} className={primaryButtonStyles}>
                <Calculator size={18} className="mr-2" />
                Calculate Score
              </button>
            </div>

            {/* Result */}
            {scoreResult && (
              <div
                id="score-result"
                className="mt-8 p-4 border-l-4 border-teal-500 bg-teal-50 rounded-md shadow-sm"
              >
                <h3 className="font-semibold text-teal-800 text-lg mb-1">
                  Result
                </h3>
                <p className="text-gray-700">
                  <strong>Score:</strong> {scoreResult.score}
                </p>
                <p className="text-gray-700 mt-1 whitespace-pre-line">
                  <strong>Interpretation:</strong>{' '}
                  {scoreResult.interpretation}
                </p>
              </div>
            )}

            {/* Next‑steps / evidence accordion */}
            {(selectedTool.nextSteps || selectedTool.evidence) && (
              <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {selectedTool.nextSteps && (
                    <button
                      onClick={() => setShowNextSteps((prev) => !prev)}
                      className={secondaryButtonStyles}
                    >
                      {showNextSteps ? 'Hide Next Steps' : 'Show Next Steps'}
                      {showNextSteps ? (
                        <ChevronUp size={16} className="ml-1" />
                      ) : (
                        <ChevronDown size={16} className="ml-1" />
                      )}
                    </button>
                  )}
                  {selectedTool.evidence && (
                    <button
                      onClick={() => setShowEvidence((prev) => !prev)}
                      className={secondaryButtonStyles}
                    >
                      {showEvidence ? 'Hide Evidence' : 'Show Evidence'}
                      {showEvidence ? (
                        <ChevronUp size={16} className="ml-1" />
                      ) : (
                        <ChevronDown size={16} className="ml-1" />
                      )}
                    </button>
                  )}
                </div>

                {showNextSteps && selectedTool.nextSteps && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50 border-gray-200 animate-fadeInUp delay-100">
                    <h4 className="text-md font-semibold text-teal-700 mb-3 flex items-center">
                      <HelpCircle size={18} className="mr-2" />
                      Next Steps
                    </h4>
                    <div className="space-y-3 text-sm">
                      {selectedTool.nextSteps.management && (
                        <div>
                          <p className="font-medium text-gray-800 underline mb-1">
                            Management:
                          </p>
                          <p className="text-gray-700 whitespace-pre-line">
                            {selectedTool.nextSteps.management}
                          </p>
                        </div>
                      )}
                      {selectedTool.nextSteps.criticalActions && (
                        <div>
                          <p className="font-medium text-gray-800 underline mb-1">
                            Critical Actions:
                          </p>
                          <p className="text-gray-700 whitespace-pre-line">
                            {selectedTool.nextSteps.criticalActions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {showEvidence && selectedTool.evidence && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50 border-gray-200 animate-fadeInUp delay-100">
                    <h4 className="text-md font-semibold text-teal-700 mb-3 flex items-center">
                      <FileText size={18} className="mr-2" />
                      Evidence & References
                    </h4>
                    {selectedTool.evidence.commentary && (
                      <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">
                        {selectedTool.evidence.commentary}
                      </p>
                    )}
                    <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                      {selectedTool.evidence.references.map((ref, index) => (
                        <li key={index}>{ref}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-12 text-xs text-gray-500 leading-relaxed text-center max-w-xl mx-auto">
          <p>
            <strong>Disclaimer:</strong> {DISCLAIMER_TEXT}
          </p>
        </div>
      </div>
    </div>
  );
}
