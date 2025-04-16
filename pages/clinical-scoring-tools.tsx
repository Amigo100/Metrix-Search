// file: /pages/clinical-scoring-tools.tsx (or similar path)

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Calculator, HelpCircle, FileText } from 'lucide-react'; // Using Lucide icons
import { Label } from '@/components/ui/label'; // *** ADDED IMPORT FOR LABEL *** Adjust path if needed

// Assuming tool definitions are imported correctly
import { cardioRiskTools } from '@/tools/cardiorisk-tools'; // Adjust path
import { pulmonaryTools } from '@/tools/pulmonary-tools'; // Adjust path
import { giTools } from '@/tools/gi-tools'; // Adjust path
import { neuroTools } from '@/tools/neuro-tools'; // Adjust path
import { endocrinologyTools } from '@/tools/endocrinology-tools'; // Adjust path
import { obgynTools } from '@/tools/obgyn-tools'; // Adjust path

import { ScoreDefinition } from '@/tools/types'; // Adjust path

// Group by category (Logic preserved)
const categorizedTools: { [key: string]: ScoreDefinition[] } = {
  Cardiology: cardioRiskTools,
  Pulmonology: pulmonaryTools,
  Gastroenterology: giTools,
  Neurology: neuroTools,
  Endocrinology: endocrinologyTools,
  'OB/GYN': obgynTools,
};

// The available calcType options (Logic preserved)
const calcTypeOptions = [
  'All',
  'Diagnostic',
  'Prognostic',
  'Rule Out',
  'Treatment',
  'Drug Conversion',
];

// Updated Disclaimer Text
const DISCLAIMER_TEXT = `Metrix AI enhances clinical decision-making with risk and scoring tools. These tools are intended for reference and informational purposes only and do not substitute for professional clinical judgment. Always verify results and consult relevant guidelines.`;

// --- Input Styles (Consistent with Login Page) ---
// Assuming Input component is imported or defined elsewhere if needed
// If using shadcn/ui Input, import it: import { Input } from '@/components/ui/input';
// Define styles directly if not using a component library for basic elements
const formInputStyles = "block w-full rounded-lg border border-gray-300 py-2 px-3 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-sm";
const formSelectStyles = `${formInputStyles} appearance-none pr-8`; // Add padding for dropdown arrow
const formCheckboxStyles = "h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-1";

// --- Button Styles (Consistent with Theme) ---
const primaryButtonStyles = "inline-flex items-center justify-center px-6 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-md disabled:opacity-70 disabled:cursor-not-allowed";
const secondaryButtonStyles = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed";
const filterButtonBase = "px-3 py-1.5 text-sm font-medium rounded-full border transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500";
const filterButtonSelected = "bg-teal-600 text-white border-teal-600";
const filterButtonDefault = "bg-white text-gray-600 border-gray-300 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200";


export default function ClinicalScoringToolsPage() {
  // --- State Management (Logic Preserved) ---
  const [inputValue, setInputValue] = useState('');
  const [selectedCalcType, setSelectedCalcType] = useState('All');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ScoreDefinition | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [scoreResult, setScoreResult] = useState<{ score: number; interpretation: string } | null>(null);
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // --- Filtering Logic (Preserved) ---
  const filteredCategorizedTools = useMemo(() => {
    const result: { [key: string]: ScoreDefinition[] } = {};
    Object.keys(categorizedTools).forEach((category) => {
      const filtered = categorizedTools[category].filter((tool) => {
        const matchesSearch = tool.name.toLowerCase().includes(inputValue.toLowerCase());
        const matchesType = selectedCalcType === 'All' || (tool.calcType && tool.calcType.toLowerCase() === selectedCalcType.toLowerCase());
        return matchesSearch && matchesType;
      });
      if (filtered.length > 0) { result[category] = filtered; }
    });
    return result;
  }, [inputValue, selectedCalcType]);

  // --- Effects (Preserved) ---
  useEffect(() => { // Close dropdown on outside click
    function handleClickOutside(e: MouseEvent) { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) { setShowDropdown(false); } }
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  // --- Event Handlers (Preserved) ---
  const handleSelectTool = (tool: ScoreDefinition) => {
    setSelectedTool(tool);
    setFormValues({}); // Reset form values when tool changes
    setScoreResult(null); // Reset result
    setInputValue(tool.name); // Update search input to reflect selection
    setShowDropdown(false); // Close dropdown
    setShowNextSteps(false); // Hide extra info
    setShowEvidence(false);
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldKey]: value }));
    setScoreResult(null); // Reset score when form values change
  };

  const handleCalculate = () => {
    if (!selectedTool) return;
    // Basic validation could be added here if needed
    const result = selectedTool.computeScore(formValues);
    setScoreResult(result);
    // Optionally scroll to result
    const resultElement = document.getElementById('score-result');
    resultElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    // --- Updated Page Layout & Styling ---
    <div className="w-full min-h-screen bg-gradient-to-b from-white via-teal-50 to-white p-6 md:p-8 flex flex-col items-center">
      {/* Page Header */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center pt-8 pb-10 px-4 text-center">
         {/* Logo can be smaller here */}
         <img
            src="/MetrixAI.png" // Ensure path is correct
            alt="Metrix Logo"
            width={64} // Example size
            height={64}
            className="mb-4"
          />
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Clinical Risk & Scoring Tools
        </h1>
        <p className="text-gray-600 text-base leading-relaxed max-w-2xl">
          Access a wide range of validated scoring systems and calculators to aid in clinical decision-making. Select a tool below or search by name.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-3xl mx-auto space-y-8">
        {/* Filter and Search Section */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
           {/* Type Filter Buttons - Updated Styling */}
           <div>
             <Label className="block text-sm font-medium text-gray-700 mb-2 text-center sm:text-left">Filter by Type:</Label> {/* Use imported Label */}
             <div className="flex gap-2 flex-wrap justify-center">
                {calcTypeOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedCalcType(option)}
                    className={`${filterButtonBase} ${selectedCalcType === option ? filterButtonSelected : filterButtonDefault}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
           </div>

          {/* Combined Search & Dropdown - Updated Styling */}
          <div className="relative" ref={dropdownRef}>
            <Label htmlFor="tool-search" className="block text-sm font-medium text-gray-700 mb-1 text-center sm:text-left"> {/* Use imported Label */}
              Search or Select a Tool:
            </Label>
            <div className="relative">
              {/* Assuming you have an Input component or use a standard input */}
              <input
                id="tool-search"
                type="text"
                className={`${formInputStyles} pr-10`} // Use consistent style, Add padding for the dropdown icon
                placeholder="Type to search tools..."
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setShowDropdown(true); }}
                onClick={() => setShowDropdown(!showDropdown)} // Toggle on click as well
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

            {/* Dropdown List - Updated Styling */}
            {showDropdown && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-auto focus:outline-none">
                {Object.keys(filteredCategorizedTools).length === 0 ? (
                  <div className="p-3 text-gray-500 text-sm">No matches found</div>
                ) : (
                  Object.keys(filteredCategorizedTools).map((category) => (
                    <div key={category}>
                      <div className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold uppercase tracking-wider sticky top-0"> {/* Sticky category header */}
                        {category}
                      </div>
                      {filteredCategorizedTools[category].map((tool) => (
                        <div
                          key={tool.name}
                          className="px-3 py-2 hover:bg-teal-50 cursor-pointer text-gray-800 text-sm"
                          onClick={() => handleSelectTool(tool)}
                          role="option"
                          aria-selected={selectedTool?.name === tool.name}
                          tabIndex={0} // Make it focusable
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectTool(tool); }}
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
        </div> {/* End Filter and Search Section */}

        {/* Display the selected tool - Updated Card Styling */}
        {selectedTool && (
          <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-6 md:p-8 w-full">
            <h2 className="text-xl md:text-2xl font-semibold text-teal-700 mb-2 text-center">
              {selectedTool.name}
            </h2>
            <p className="text-sm text-gray-600 mb-6 text-center max-w-xl mx-auto">
              {selectedTool.description}
            </p>

            {/* Render input fields - Updated Styling */}
            <div className="space-y-5">
              {selectedTool.fields.map((field) => {
                // --- Checkbox ---
                if (field.type === 'boolean') {
                  return (
                    <div key={field.key} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id={field.key}
                        className={formCheckboxStyles}
                        checked={!!formValues[field.key]}
                        onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                      />
                      <Label htmlFor={field.key} className="text-gray-800 text-sm cursor-pointer"> {/* Use imported Label */}
                        {field.label}
                      </Label>
                    </div>
                  );
                }
                // --- Number Input ---
                if (field.type === 'number') {
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <Label htmlFor={field.key} className="text-gray-700 font-medium text-sm"> {/* Use imported Label */}
                        {field.label}
                      </Label>
                      {/* Assuming you have an Input component or use a standard input */}
                      <input
                        type="number"
                        id={field.key}
                        className={formInputStyles} // Use consistent style
                        value={formValues[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        step={field.step || 'any'}
                        min={field.min}
                        max={field.max}
                      />
                    </div>
                  );
                }
                // --- Select Dropdown ---
                if (field.type === 'select') {
                  return (
                     <div key={field.key} className="space-y-1.5">
                       <Label htmlFor={field.key} className="text-gray-700 font-medium text-sm"> {/* Use imported Label */}
                         {field.label}
                       </Label>
                       <div className="relative">
                         <select
                           id={field.key}
                           className={formSelectStyles} // Use consistent style
                           value={formValues[field.key] || ''}
                           onChange={(e) => handleFieldChange(field.key, e.target.value)}
                         >
                           <option value="" disabled>-- Select --</option>
                           {field.options?.map((option) => (
                             <option key={option} value={option}> {option} </option>
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

            {/* Calculate Button - Updated Styling */}
            <div className="mt-8 text-center">
                <button onClick={handleCalculate} className={primaryButtonStyles}>
                    <Calculator size={18} className="mr-2"/> Calculate Score
                </button>
            </div>

            {/* Result Display - Updated Styling */}
            {scoreResult && (
              <div id="score-result" className="mt-8 p-4 border-l-4 border-teal-500 bg-teal-50 rounded-md shadow-sm">
                <h3 className="font-semibold text-teal-800 text-lg mb-1">Result</h3>
                <p className="text-gray-700">
                  <strong>Score:</strong> {scoreResult.score}
                </p>
                <p className="text-gray-700 mt-1 whitespace-pre-line"> {/* Allow line breaks */}
                  <strong>Interpretation:</strong> {scoreResult.interpretation}
                </p>
              </div>
            )}

            {/* Next Steps / Evidence Section - Updated Styling */}
            {(selectedTool.nextSteps || selectedTool.evidence) && (
              <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
                 {/* Buttons to toggle sections */}
                 <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {selectedTool.nextSteps && (
                      <button onClick={() => setShowNextSteps((prev) => !prev)} className={secondaryButtonStyles} >
                        {showNextSteps ? 'Hide Next Steps' : 'Show Next Steps'}
                        {showNextSteps ? <ChevronUp size={16} className="ml-1"/> : <ChevronDown size={16} className="ml-1"/>}
                      </button>
                    )}
                    {selectedTool.evidence && (
                      <button onClick={() => setShowEvidence((prev) => !prev)} className={secondaryButtonStyles} >
                         {showEvidence ? 'Hide Evidence' : 'Show Evidence'}
                         {showEvidence ? <ChevronUp size={16} className="ml-1"/> : <ChevronDown size={16} className="ml-1"/>}
                      </button>
                    )}
                 </div>

                 {/* Collapsible Sections */}
                 {showNextSteps && selectedTool.nextSteps && (
                   <div className="mt-4 p-4 border rounded-lg bg-gray-50 border-gray-200 animate-fadeInUp delay-100">
                     <h4 className="text-md font-semibold text-teal-700 mb-3 flex items-center">
                        <HelpCircle size={18} className="mr-2"/> Next Steps
                     </h4>
                     <div className="space-y-3 text-sm">
                        {selectedTool.nextSteps.management && (
                            <div>
                                <p className="font-medium text-gray-800 underline mb-1">Management:</p>
                                <p className="text-gray-700 whitespace-pre-line">{selectedTool.nextSteps.management}</p>
                            </div>
                        )}
                         {selectedTool.nextSteps.criticalActions && (
                            <div>
                                <p className="font-medium text-gray-800 underline mb-1">Critical Actions:</p>
                                <p className="text-gray-700 whitespace-pre-line">{selectedTool.nextSteps.criticalActions}</p>
                            </div>
                         )}
                     </div>
                   </div>
                 )}

                 {showEvidence && selectedTool.evidence && (
                   <div className="mt-4 p-4 border rounded-lg bg-gray-50 border-gray-200 animate-fadeInUp delay-100">
                     <h4 className="text-md font-semibold text-teal-700 mb-3 flex items-center">
                        <FileText size={18} className="mr-2"/> Evidence & References
                     </h4>
                     {selectedTool.evidence.commentary && ( <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">{selectedTool.evidence.commentary}</p> )}
                     <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                       {selectedTool.evidence.references.map((ref, index) => ( <li key={index}>{ref}</li> ))}
                     </ul>
                   </div>
                 )}
              </div>
            )}
          </div>
        )}

        {/* Final Disclaimer - Updated Styling */}
        <div className="mt-12 text-xs text-gray-500 leading-relaxed text-center max-w-xl mx-auto">
          <p><strong>Disclaimer:</strong> {DISCLAIMER_TEXT}</p>
        </div>
      </div>
    </div>
  );
}
