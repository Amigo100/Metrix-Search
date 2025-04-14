// /pages/clinical-scoring-tools.tsx

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
const calcTypeOptions = ["All", "Diagnostic", "Prognostic", "Rule Out", "Treatment", "Drug Conversion"];

export default function ClinicalScoringToolsPage() {
  const [inputValue, setInputValue] = useState('');
  const [selectedCalcType, setSelectedCalcType] = useState("All");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ScoreDefinition | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [scoreResult, setScoreResult] = useState<{ score: number; interpretation: string } | null>(null);
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Filter logic, respecting both search input and selected calcType
  const filteredCategorizedTools = useMemo(() => {
    const result: { [key: string]: ScoreDefinition[] } = {};
    Object.keys(categorizedTools).forEach((category) => {
      const filtered = categorizedTools[category].filter((tool) => {
        const matchesSearch = tool.name.toLowerCase().includes(inputValue.toLowerCase());
        const matchesType =
          selectedCalcType === "All" ||
          (tool.calcType && tool.calcType.toLowerCase() === selectedCalcType.toLowerCase());
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
    <div className="w-full min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Clinical Scoring Tools</h1>
        <p className="text-gray-600 mb-6 max-w-3xl">
          Search or select from many clinical calculators grouped by category. You can also filter by calculator type to find the relevant tool.
        </p>

        {/* Type Filter Buttons */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {calcTypeOptions.map((option) => (
            <button
              key={option}
              onClick={() => setSelectedCalcType(option)}
              className={`px-4 py-2 rounded-md border ${
                selectedCalcType === option
                  ? 'bg-[#008080] text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
              } transition-colors`}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Combined Search & Dropdown by Category */}
        <div className="relative mb-8 w-full sm:w-2/3 lg:w-1/2" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-gray-700"
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
          <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-4xl">
            <h2 className="text-xl font-semibold text-blue-700 mb-2">{selectedTool.name}</h2>
            <p className="text-sm text-gray-600 mb-5">{selectedTool.description}</p>

            {/* Render input fields */}
            <div className="space-y-4">
              {selectedTool.fields.map((field) => {
                if (field.type === 'boolean') {
                  return (
                    <div key={field.key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={field.key}
                        className="mr-2 h-5 w-5 text-blue-600"
                        checked={!!formValues[field.key]}
                        onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                      />
                      <label htmlFor={field.key} className="text-gray-800">
                        {field.label}
                      </label>
                    </div>
                  );
                }
                if (field.type === 'number') {
                  return (
                    <div key={field.key} className="flex flex-col sm:flex-row sm:items-center">
                      <label htmlFor={field.key} className="sm:w-48 font-medium text-gray-800">
                        {field.label}
                      </label>
                      <input
                        type="number"
                        id={field.key}
                        className="mt-1 sm:mt-0 border border-gray-300 p-2 rounded-md w-full sm:w-40 focus:ring-blue-400 focus:outline-none"
                        value={formValues[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      />
                    </div>
                  );
                }
                if (field.type === 'select') {
                  return (
                    <div key={field.key} className="flex flex-col sm:flex-row sm:items-center">
                      <label htmlFor={field.key} className="sm:w-48 font-medium text-gray-800">
                        {field.label}
                      </label>
                      <select
                        id={field.key}
                        className="mt-1 sm:mt-0 border border-gray-300 p-2 rounded-md w-full sm:w-60 focus:ring-blue-400 focus:outline-none"
                        value={formValues[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
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
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Calculate
            </button>

            {scoreResult && (
              <div className="mt-6 p-4 border-l-4 border-blue-600 bg-blue-50 rounded-md">
                <h3 className="font-semibold text-blue-700 text-lg">Result</h3>
                <p className="text-gray-800 mt-1">
                  <strong>Score:</strong> {scoreResult.score}
                </p>
                <p className="text-gray-800 mt-1">
                  <strong>Interpretation:</strong> {scoreResult.interpretation}
                </p>
              </div>
            )}

            {(selectedTool.nextSteps || selectedTool.evidence) && (
              <div className="mt-6 flex gap-3">
                {selectedTool.nextSteps && (
                  <button
                    onClick={() => setShowNextSteps(!showNextSteps)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    {showNextSteps ? 'Hide Next Steps' : 'Show Next Steps'}
                  </button>
                )}
                {selectedTool.evidence && (
                  <button
                    onClick={() => setShowEvidence(!showEvidence)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  >
                    {showEvidence ? 'Hide Evidence' : 'Show Evidence'}
                  </button>
                )}
              </div>
            )}

            {showNextSteps && selectedTool.nextSteps && (
              <div className="mt-4 p-4 border rounded bg-gray-50">
                <h4 className="text-md font-semibold text-green-700 mb-2">Next Steps</h4>
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
                <h4 className="text-md font-semibold text-purple-700 mb-2">Evidence & References</h4>
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

        <div className="mt-10 text-xs text-gray-500 max-w-3xl leading-relaxed">
          <p className="mb-2">
            <strong>Disclaimer:</strong> These calculators are provided for reference only; always use clinical judgment.
          </p>
        </div>
      </div>
    </div>
  );
}
