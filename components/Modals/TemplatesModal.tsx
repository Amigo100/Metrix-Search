// file: /components/Modals/TemplatesModal.tsx

import React, { useState, useContext, useEffect, useRef } from 'react'; // Added useEffect, useRef
import { useTranslation } from 'next-i18next'; // Hook for internationalization
import HomeContext from '@/pages/api/home/home.context'; // Context for global state
import { Prompt } from '@/types/prompt'; // Type definition for a prompt/template
import { v4 as uuidv4 } from 'uuid'; // Library for generating unique IDs
import {
    X, Plus, Upload, Download, ChevronDown, ChevronUp, Trash2, Edit3, Check, FileText, Search as SearchIcon, Info // Lucide icons
} from 'lucide-react';

// PDFMake library for generating PDFs client-side
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs; // Assign virtual file system for fonts

// --- Style Constants (Consistent with Theme) ---
// Re-declare or import these from a shared location
const primaryButtonStyles = "inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-sm disabled:opacity-70 disabled:cursor-not-allowed";
const secondaryButtonStyles = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed";
const ghostButtonStyles = "inline-flex items-center justify-center p-2 text-sm font-medium rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed";
const formInputStyles = "block w-full rounded-lg border border-gray-300 py-2 px-3 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-sm";
const formTextareaStyles = "block w-full rounded-lg border border-gray-300 p-3 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-sm bg-white";

/**
 * TemplatesModal Component - Redesigned Styling
 *
 * Displays a modal for managing prompt templates. Allows users to view, create,
 * edit, delete, import (JSON), and export (JSON, PDF) templates.
 */
export const TemplatesModal = () => {
  // i18n hook
  const { t } = useTranslation('common'); // Use 'common' or specific namespace
  // Access global state and dispatch function
  const { state, dispatch } = useContext(HomeContext);

  // Determine if the modal should be open based on global state
  const isOpen = state.openModal === 'templates';

  // Retrieve templates (prompts) from the global state, default to empty array if null/undefined
  const templates: Prompt[] = state.prompts || [];

  // Local state for managing UI interactions within the modal
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null); // ID of the currently expanded template
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null); // ID of the template being edited
  const [editName, setEditName] = useState(''); // Temporary state for the name while editing
  const [editContent, setEditContent] = useState(''); // Temporary state for the content while editing
  const [searchTerm, setSearchTerm] = useState(''); // State for the search input filter
  const modalContentRef = useRef<HTMLDivElement>(null); // Ref for modal content

  // --- Logic (Preserved) ---
  // Helper function to update templates in both global state and localStorage
  const updateTemplates = (newTemplates: Prompt[]) => {
    dispatch({ type: 'change', field: 'prompts', value: newTemplates });
    localStorage.setItem('prompts', JSON.stringify(newTemplates));
    console.log('Templates updated in global state and localStorage.');
  };
  // Handler function to close the modal
  const handleClose = () => { dispatch({ type: 'change', field: 'openModal', value: null }); };
  // Handler function to import templates from a JSON file
  const handleImport = () => { const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = '.json'; fileInput.onchange = async (e: any) => { const file = e.target.files[0]; if (!file) return; try { const text = await file.text(); const imported = JSON.parse(text) as Prompt[]; updateTemplates([...templates, ...imported]); alert(t('Templates imported successfully!')); console.log('Templates imported from JSON file.'); } catch (error) { console.error('Error importing templates:', error); alert(t('Error importing templates.')); } }; fileInput.click(); };
  // Handler function to export all current templates as a JSON file
  const handleExportAllJSON = () => { const dataStr = JSON.stringify(templates, null, 2); const blob = new Blob([dataStr], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'metrix_templates_export.json'; link.click(); URL.revokeObjectURL(url); console.log('All templates exported as JSON.'); };
  // Handler function to create a new, blank template
  const handleNewTemplate = () => { const newTemplate: Prompt = { id: uuidv4(), name: t('New Template'), description: '', content: '', model: { id: state.defaultModelId || 'gpt-4', name: 'GPT-4', maxLength: 24000, tokenLimit: 8000, }, folderId: null, }; const updated = [...templates, newTemplate]; updateTemplates(updated); setExpandedTemplateId(newTemplate.id); setEditingTemplateId(newTemplate.id); setEditName(newTemplate.name); setEditContent(newTemplate.content); console.log('New blank template created:', newTemplate.id); // Scroll to new template if possible setTimeout(() => { document.getElementById(`template-${newTemplate.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100); };
  // Handler function to toggle the expanded view of a template
  const handleToggleExpand = (tplId: string) => { if (expandedTemplateId === tplId) { setExpandedTemplateId(null); if (editingTemplateId === tplId) { setEditingTemplateId(null); } } else { setExpandedTemplateId(tplId); if (editingTemplateId && editingTemplateId !== tplId) { setEditingTemplateId(null); } } };
  // Handler function to initiate editing for a specific template
  const handleStartEdit = (tpl: Prompt) => { setEditingTemplateId(tpl.id); setEditName(tpl.name); setEditContent(tpl.content); setExpandedTemplateId(tpl.id); };
  // Handler function to save changes made to a template
  const handleSaveTemplate = (tplId: string) => { const updated = templates.map((tpl) => tpl.id === tplId ? { ...tpl, name: editName.trim() || 'Untitled Template', content: editContent } : tpl ); updateTemplates(updated); setEditingTemplateId(null); alert(t('Template saved!')); console.log('Template saved with id:', tplId); };
  // Handler function to delete a template
  const handleDeleteTemplate = (tplId: string) => { if (!confirm(t('Are you sure you want to delete this template? This cannot be undone.'))) return; const filtered = templates.filter((tpl) => tpl.id !== tplId); updateTemplates(filtered); if (expandedTemplateId === tplId) setExpandedTemplateId(null); if (editingTemplateId === tplId) setEditingTemplateId(null); console.log('Template deleted:', tplId); };
  // Handler function to export a single template as a PDF
  const handleExportAsPDF = (tpl: Prompt) => { const now = new Date(); const timeStamp = [ now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0'), '_', String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0'), String(now.getSeconds()).padStart(2, '0'), ].join(''); const pdfDefinition: any = { content: [ { text: tpl.name, style: 'header' }, { text: tpl.content, margin: [0, 5, 0, 15] }, ], styles: { header: { fontSize: 14, bold: true, color: '#0F766E' }, }, defaultStyle: { color: '#374151', fontSize: 10 }, }; pdfMake .createPdf(pdfDefinition) .download(`${timeStamp}_${tpl.name.replace(/[^a-z0-9]/gi, '_')}.pdf`); console.log('Exported template as PDF:', tpl.id); };

  // Filter templates based on the search term
  const filteredTemplates = templates.filter((tpl) =>
    tpl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tpl.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Effect to handle closing modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    if (isOpen) { window.addEventListener('keydown', handleKeyDown as any); }
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, [isOpen]); // Re-run when isOpen changes

  if (!isOpen) return null; // Don't render if not open

  return (
    // --- Redesigned Modal ---
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container */}
      <div
        ref={modalContentRef}
        className="w-full max-w-3xl max-h-[90vh] rounded-xl shadow-xl
                   bg-white text-gray-900 border border-gray-200
                   p-6 flex flex-col overflow-hidden" // Prevent content overflow
        role="dialog"
        aria-modal="true"
        aria-labelledby="templates-modal-title"
      >
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b border-gray-200 flex-shrink-0">
          <h2 id="templates-modal-title" className="text-xl font-semibold text-gray-800 mb-3 sm:mb-0">
            {t('Manage Scribe Templates')}
          </h2>
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleNewTemplate} className={`${primaryButtonStyles} text-xs px-3 py-1.5`}> <Plus size={16} className="mr-1"/> {t('New')} </button>
            <button onClick={handleImport} className={`${secondaryButtonStyles} text-xs px-3 py-1.5`}> <Upload size={16} className="mr-1"/> {t('Import')} </button>
            <button onClick={handleExportAllJSON} className={`${secondaryButtonStyles} text-xs px-3 py-1.5`}> <Download size={16} className="mr-1"/> {t('Export All')} </button>
            <button onClick={handleClose} className={`${ghostButtonStyles} p-1.5`} title={t('Close') || ''}> <X size={18}/> </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="my-4 flex-shrink-0 relative">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t('Search Templates...') || ''}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${formInputStyles} pl-10`} // Use themed input style with padding for icon
          />
        </div>

        {/* Templates List - Scrollable */}
        <div className="mt-1 space-y-3 overflow-y-auto flex-grow pr-2 -mr-2" style={{ scrollbarWidth: 'thin' }}>
          {/* Message when no templates match search or none exist */}
          {filteredTemplates.length === 0 && (
            <div className="text-center text-sm italic text-gray-500 py-10 flex flex-col items-center">
               <Info size={24} className="mb-2 text-gray-400"/>
              {templates.length === 0
                ? t('No templates created yet.')
                : t('No templates match your search.')}
            </div>
          )}

          {/* Map through filtered templates */}
          {filteredTemplates.map((tpl) => {
            const isExpanded = expandedTemplateId === tpl.id;
            const isEditing = editingTemplateId === tpl.id;

            return (
              <div
                key={tpl.id}
                id={`template-${tpl.id}`} // Add ID for scrolling
                className="p-3 rounded-lg border border-gray-200 bg-white transition-all duration-200 shadow-sm"
              >
                {/* Template Title Row */}
                <div className="flex items-center justify-between gap-2">
                  {/* Clickable Title to Expand/Collapse */}
                  <button onClick={() => handleToggleExpand(tpl.id)} className="text-left flex-grow min-w-0 group" >
                    <h3 className="text-sm font-semibold text-gray-800 truncate group-hover:text-teal-700">
                      {tpl.name || t('Untitled Template')}
                    </h3>
                  </button>
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button className={`${ghostButtonStyles} p-1`} onClick={() => handleToggleExpand(tpl.id)} title={isExpanded ? t('Collapse') || '' : t('Expand') || ''} > {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />} </button>
                    <button className={`${ghostButtonStyles} p-1 text-red-500 hover:bg-red-100 hover:text-red-600`} onClick={() => handleDeleteTemplate(tpl.id)} title={t('Delete Template') || ''} > <Trash2 size={16} /> </button>
                  </div>
                </div>

                {/* Expanded Content Area */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-sm animate-fadeInUp delay-50">
                    {isEditing ? (
                      <>
                        {/* Edit Name Input */}
                        <div className="mb-3">
                            <label className="block mb-1 text-xs font-medium text-gray-600"> {t('Template Name')} </label>
                            <input className={`${formInputStyles} text-sm py-1.5`} value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                        {/* Edit Content Textarea */}
                         <div className="mb-3">
                            <label className="block mb-1 text-xs font-medium text-gray-600"> {t('Template Content')} </label>
                            <textarea className={`${formTextareaStyles} w-full h-32 text-xs font-mono`} value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={6} />
                         </div>
                        {/* Save/Cancel Buttons */}
                        <div className="flex justify-end gap-2 mt-2">
                          <button className={`${secondaryButtonStyles} text-xs px-3 py-1`} onClick={() => setEditingTemplateId(null)} > {t('Cancel')} </button>
                          <button className={`${primaryButtonStyles} text-xs px-3 py-1 bg-green-600 hover:bg-green-700`} onClick={() => handleSaveTemplate(tpl.id)} > <Check size={14} className="mr-1"/> {t('Save')} </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Display Content */}
                        <div className="p-2 border border-gray-200 rounded-md bg-gray-50 text-gray-800 mb-3 whitespace-pre-wrap text-xs leading-relaxed font-mono min-h-[50px]">
                          {tpl.content || <span className="italic text-gray-400">{t('No content')}</span>}
                        </div>
                        {/* Action Buttons (Read Mode) */}
                        <div className="flex justify-end gap-3">
                          <button className={`${ghostButtonStyles} text-xs`} onClick={() => handleStartEdit(tpl)} > <Edit3 size={14} className="mr-1"/> {t('Edit')} </button>
                          <button className={`${ghostButtonStyles} text-xs`} onClick={() => handleExportAsPDF(tpl)} > <FileText size={14} className="mr-1"/> {t('Export PDF')} </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// export default TemplatesModal; // Keep if this is the intended default export
