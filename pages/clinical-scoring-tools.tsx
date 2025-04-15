import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

import { cardioRiskTools } from '@/tools/cardiorisk-tools';
import { pulmonaryTools } from '@/tools/pulmonary-tools';
import { giTools } from '@/tools/gi-tools';
import { neuroTools } from '@/tools/neuro-tools';
import { endocrinologyTools } from '@/tools/endocrinology-tools';
import { obgynTools } from '@/tools/obgyn-tools';

import { ScoreDefinition } from '@/tools/types';

// Group by category
const categorizedTools: { [key: string]: ScoreDefinition[] } = {
  Cardiology: cardioRiskTools,
  Pulmonology: pulmonaryTools,
  Gastroenterology: giTools,
  Neurology: neuroTools,
  Endocrinology: endocrinologyTools,
  'OB/GYN': obgynTools,
};

// The available calcType options
const calcTypeOptions = [
  'All',
  'Diagnostic',
  'Prognostic',
  'Rule Out',
  'Treatment',
  'Drug Conversion',
];

// Optionally, you can place your more detailed disclaimers here if desired
const DISCLAIMER_TEXT = `
Our Metrix AI platform enhances clinicians' decision-making processes.
It provides a range of risk and scoring tools, but these are not designed
for automated diagnoses or to replace clinical judgment in any capacity.
`;

export default function ClinicalScoringToolsPage() {
  const [inputValue, setInputValue] = useState('');
  const [selectedCalcType, setSelectedCalcType] = useState('All');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ScoreDefinition | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [scoreResult, setScoreResult] =
    useState<{ score: number; interpretation: string } | null>(null);
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Filter logic, respecting both search input and selected calcType
  const filteredCategorizedTools = useMemo(() => {
    const result: { [key: string]: ScoreDefinition[] } = {};
    Object.keys(categorizedTools).forEach((category) => {
      const filtered = categorizedTools[category].filter((tool) => {
        const matchesSearch = tool.name
          .toLowerCase()
          .includes(inputValue.toLowerCase());
        const matchesType =
          selectedCalcType === 'All' ||
          (tool.calcType &&
            tool.calcType.toLowerCase() === selectedCalcType.toLowerCase());
        return matchesSearch && matchesType;
      });
      if (filtered.length > 0) {
        result[category] = filtered;
      }
    });
    return result;
  }, [inputValue, selectedCalcType]);

  // Close the dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
  };

  const handleCalculate = () => {
    if (!selectedTool) return;
    const result = selectedTool.computeScore(formValues);
    setScoreResult(result);
  };

  return (
    <div className="w-full min-h-screen bg-white p-6 flex flex-col items-center">
      {/* 
        1) Brand and heading (mimicking the style of the first-stage layout),
        2) Disclaimer,
        3) Then the existing type-filter buttons, search bar, etc.
      */}
      <div className="flex flex-col items-center pt-8 pb-12 px-4">
        {/* Brand Header / Logo */}
        <header className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center">
            <img
              src="/MetrixAI.png"
              alt="Metrix AI Logo"
              className="w-28 h-28 object-cover mr-3"
            />
          </div>
        </header>

        {/* Main heading */}
        <div className="mt-4 text-center max-w-3xl">
          <h1 className="text-3xl font-bold mb-3">
            Metrix AI Risk and Scoring Tool
          </h1>
          {/* Optional short disclaimer or subheading */}
          <p className="text-gray-700 text-base leading-snug whitespace-pre-line">
            {DISCLAIMER_TEXT}
          </p>
        </div>
      </div>

      {/* Existing content: filter buttons, search bar, tool display, etc. */}
      <div className="w-full max-w-2xl mx-auto">
        {/* Type Filter Buttons */}
        <div className="flex gap-2 mb-4 flex-wrap justify-center">
          {calcTypeOptions.map((option) => (
            <button
              key={option}
              onClick={() => setSelectedCalcType(option)}
              className={`px-4 py-2 rounded-md border ${
                selectedCalcType === option
                  ? 'bg-[#008080] text-white border-[#008080]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-[#008080]'
              } transition-colors`}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Combined Search & Dropdown by Category */}
        <div className="relative mb-8 w-full" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
            Search or Select a Tool
          </label>
          <div
            className="flex items-center bg-white border border-gray-300 rounded-md px-3 py-2 shadow-sm cursor-text"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <input
              type="text"
              className="flex-1 focus:outline-none bg-transparent"
              placeholder="Type to search..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowDropdown(true);
              }}
            />
            {showDropdown ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
          </div>

          {showDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-auto">
              {Object.keys(filteredCategorizedTools).length === 0 ? (
                <div className="p-2 text-gray-500 text-sm">No matches found</div>
              ) : (
                Object.keys(filteredCategorizedTools).map((category) => (
                  <div key={category}>
                    <div className="px-3 py-1 bg-gray-100 text-gray-700 font-semibold">
                      {category}
                    </div>
                    {filteredCategorizedTools[category].map((tool) => (
                      <div
                        key={tool.name}
                        className="px-3 py-2 hover:bg-[#008080] cursor-pointer text-gray-700"
                        onClick={() => handleSelectTool(tool)}
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

        {/* Display the selected tool */}
        {selectedTool && (
          <div className="bg-white shadow-md rounded-lg p-6 mx-auto w-full max-w-4xl">
            <h2 className="text-xl font-semibold text-[#008080] mb-2 text-center">
              {selectedTool.name}
            </h2>
            <p className="text-sm text-gray-600 mb-5 text-center">
              {selectedTool.description}
            </p>

            {/* Render input fields */}
            <div className="space-y-4">
              {selectedTool.fields.map((field) => {
                if (field.type === 'boolean') {
                  return (
                    <div key={field.key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={field.key}
                        className="mr-2 h-5 w-5 text-[#008080]"
                        checked={!!formValues[field.key]}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            [field.key]: e.target.checked,
                          }))
                        }
                      />
                      <label htmlFor={field.key} className="text-gray-800">
                        {field.label}
                      </label>
                    </div>
                  );
                }
                if (field.type === 'number') {
                  return (
                    <div
                      key={field.key}
                      className="flex flex-col sm:flex-row sm:items-center"
                    >
                      <label
                        htmlFor={field.key}
                        className="sm:w-48 font-medium text-gray-800"
                      >
                        {field.label}
                      </label>
                      <input
                        type="number"
                        id={field.key}
                        className="mt-1 sm:mt-0 border border-gray-300 p-2 rounded-md w-full sm:w-40 focus:ring-[#008080] focus:outline-none"
                        value={formValues[field.key] || ''}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  );
                }
                if (field.type === 'select') {
                  return (
                    <div
                      key={field.key}
                      className="flex flex-col sm:flex-row sm:items-center"
                    >
                      <label
                        htmlFor={field.key}
                        className="sm:w-48 font-medium text-gray-800"
                      >
                        {field.label}
                      </label>
                      <select
                        id={field.key}
                        className="mt-1 sm:mt-0 border border-gray-300 p-2 rounded-md w-full sm:w-60 focus:ring-[#008080] focus:outline-none"
                        value={formValues[field.key] || ''}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                      >
                        <option value="">-- Select --</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={handleCalculate}
              className="mt-6 bg-[#008080]-600 text-white px-6 py-2 rounded-md hover:bg-[#008080] transition-colors"
            >
              Calculate
            </button>

            {scoreResult && (
              <div className="mt-6 p-4 border-l-4 border-[#008080] bg-[#008080] rounded-md">
                <h3 className="font-semibold text-[#008080] text-lg">Result</h3>
                <p className="text-gray-800 mt-1">
                  <strong>Score:</strong> {scoreResult.score}
                </p>
                <p className="text-gray-800 mt-1">
                  <strong>Interpretation:</strong> {scoreResult.interpretation}
                </p>
              </div>
            )}

            {(selectedTool.nextSteps || selectedTool.evidence) && (
              <div className="mt-6 flex gap-3 justify-center">
                {selectedTool.nextSteps && (
                  <button
                    onClick={() => setShowNextSteps((prev) => !prev)}
                    className="bg-[#008080] text-white px-4 py-2 rounded-md hover:bg-[#008080]"
                  >
                    {!showNextSteps ? 'Show Next Steps' : 'Hide Next Steps'}
                  </button>
                )}
                {selectedTool.evidence && (
                  <button
                    onClick={() => setShowEvidence((prev) => !prev)}
                    className="bg-[#008080] text-white px-4 py-2 rounded-md hover:bg-[#008080]"
                  >
                    {!showEvidence ? 'Show Evidence' : 'Hide Evidence'}
                  </button>
                )}
              </div>
            )}

            {showNextSteps && selectedTool.nextSteps && (
              <div className="mt-4 p-4 border rounded bg-gray-50">
                <h4 className="text-md font-semibold text-[#008080] mb-2">Next Steps</h4>
                <div className="mb-3">
                  <p className="font-medium underline">Management:</p>
                  <p className="text-gray-700 whitespace-pre-line">
                    {selectedTool.nextSteps.management}
                  </p>
                </div>
                <div>
                  <p className="font-medium underline">Critical Actions:</p>
                  <p className="text-gray-700 whitespace-pre-line">
                    {selectedTool.nextSteps.criticalActions}
                  </p>
                </div>
              </div>
            )}

            {showEvidence && selectedTool.evidence && (
              <div className="mt-4 p-4 border rounded bg-gray-50">
                <h4 className="text-md font-semibold text-[#008080] mb-2">
                  Evidence & References
                </h4>
                {selectedTool.evidence.commentary && (
                  <p className="text-gray-700 mb-3 whitespace-pre-line">
                    {selectedTool.evidence.commentary}
                  </p>
                )}
                <ul className="list-disc list-inside text-gray-800 space-y-1">
                  {selectedTool.evidence.references.map((ref) => (
                    <li key={ref}>{ref}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Original small disclaimer at the bottom */}
        <div className="mt-10 text-xs text-gray-500 leading-relaxed text-center">
          <p className="mb-2">
            <strong>Disclaimer:</strong> These calculators are provided for reference
            only; always use clinical judgment.
          </p>
        </div>
      </div>
    </div>
  );
}
