import { useState, useContext } from 'react';
import { useTranslation } from 'next-i18next'; // Hook for internationalization
import HomeContext from '@/pages/api/home/home.context'; // Context for global state
import { Prompt } from '@/types/prompt'; // Type definition for a prompt/template
import { v4 as uuidv4 } from 'uuid'; // Library for generating unique IDs

// PDFMake library for generating PDFs client-side
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs; // Assign virtual file system for fonts

/**
 * TemplatesModal Component
 *
 * Displays a modal for managing prompt templates. Allows users to view, create,
 * edit, delete, import (JSON), and export (JSON, PDF) templates.
 * Updated with new color scheme.
 */
export const TemplatesModal = () => {
  // i18n hook
  const { t } = useTranslation();
  // Access global state and dispatch function
  const { state, dispatch } = useContext(HomeContext);

  // Determine if the modal should be open based on global state
  const isOpen = state.openModal === 'templates';
  if (!isOpen) return null; // Don't render if not open

  // Retrieve templates (prompts) from the global state, default to empty array if null/undefined
  const templates: Prompt[] = state.prompts || [];

  // Local state for managing UI interactions within the modal
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null); // ID of the currently expanded template
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null); // ID of the template being edited
  const [editName, setEditName] = useState(''); // Temporary state for the name while editing
  const [editContent, setEditContent] = useState(''); // Temporary state for the content while editing
  const [searchTerm, setSearchTerm] = useState(''); // State for the search input filter

  // Helper function to update templates in both global state and localStorage
  const updateTemplates = (newTemplates: Prompt[]) => {
    // Dispatch action to update global state
    dispatch({ type: 'change', field: 'prompts', value: newTemplates });
    // Persist updated templates to localStorage
    localStorage.setItem('prompts', JSON.stringify(newTemplates));
    console.log('Templates updated in global state and localStorage.');
  };

  // Handler function to close the modal
  const handleClose = () => {
    // Dispatch action to update global state, closing the modal
    dispatch({ type: 'change', field: 'openModal', value: null });
  };

  // Handler function to import templates from a JSON file
  const handleImport = () => {
    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json'; // Accept only JSON files
    // Define the onChange handler for the file input
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return; // Exit if no file selected
      try {
        const text = await file.text(); // Read file content as text
        const imported = JSON.parse(text) as Prompt[]; // Parse JSON text into Prompt array
        // Validate imported data structure if necessary (omitted for brevity)
        updateTemplates([...templates, ...imported]); // Add imported templates to existing ones
        alert(t('Templates imported successfully!')); // User feedback
        console.log('Templates imported from JSON file.');
      } catch (error) {
        console.error('Error importing templates:', error);
        alert(t('Error importing templates.')); // Error feedback
      }
    };
    fileInput.click(); // Programmatically click the hidden input to open the file dialog
  };

  // Handler function to export all current templates as a JSON file
  const handleExportAllJSON = () => {
    const dataStr = JSON.stringify(templates, null, 2); // Pretty-print JSON
    const blob = new Blob([dataStr], { type: 'application/json' }); // Create a Blob
    const url = URL.createObjectURL(blob); // Create a URL for the Blob
    const link = document.createElement('a'); // Create a download link
    link.href = url;
    link.download = 'templates_export.json'; // Set the filename
    link.click(); // Programmatically click the link to trigger download
    URL.revokeObjectURL(url); // Clean up the object URL
    console.log('All templates exported as JSON.');
  };

  // Handler function to create a new, blank template
  const handleNewTemplate = () => {
    const newTemplate: Prompt = {
      id: uuidv4(), // Generate a unique ID
      name: t('New Template'), // Default name (translatable)
      description: '', // Default empty description
      content: '', // Default empty content
      model: {
        id: state.defaultModelId || 'gpt-4',
        name: 'GPT-4',
        maxLength: 24000,
        tokenLimit: 8000,
      },
      folderId: null,
    };

    const updated = [...templates, newTemplate];
    updateTemplates(updated);

    // Immediately expand and start editing the new template
    setExpandedTemplateId(newTemplate.id);
    setEditingTemplateId(newTemplate.id);
    setEditName(newTemplate.name);
    setEditContent(newTemplate.content);

    console.log('New blank template created:', newTemplate.id);
  };

  // Handler function to toggle the expanded view of a template
  const handleToggleExpand = (tplId: string) => {
    if (expandedTemplateId === tplId) {
      // If already expanded, collapse it
      setExpandedTemplateId(null);
      // If it was also being edited, stop editing
      if (editingTemplateId === tplId) {
        setEditingTemplateId(null);
      }
    } else {
      // If not expanded, expand this one (collapsing any other)
      setExpandedTemplateId(tplId);
      // Ensure editing stops if a different template was being edited
      if (editingTemplateId && editingTemplateId !== tplId) {
        setEditingTemplateId(null);
      }
    }
  };

  // Handler function to initiate editing for a specific template
  const handleStartEdit = (tpl: Prompt) => {
    setEditingTemplateId(tpl.id);
    setEditName(tpl.name);
    setEditContent(tpl.content);
    setExpandedTemplateId(tpl.id);
  };

  // Handler function to save changes made to a template
  const handleSaveTemplate = (tplId: string) => {
    const updated = templates.map((tpl) =>
      tpl.id === tplId
        ? { ...tpl, name: editName.trim(), content: editContent }
        : tpl
    );
    updateTemplates(updated);
    setEditingTemplateId(null);
    alert(t('Template saved!'));
    console.log('Template saved with id:', tplId);
  };

  // Handler function to delete a template
  const handleDeleteTemplate = (tplId: string) => {
    // Optional: Add a confirmation dialog
    // if (!confirm(t('Are you sure you want to delete this template?'))) return;

    const filtered = templates.filter((tpl) => tpl.id !== tplId);
    updateTemplates(filtered);
    // Reset UI state if the deleted template was expanded or being edited
    if (expandedTemplateId === tplId) setExpandedTemplateId(null);
    if (editingTemplateId === tplId) setEditingTemplateId(null);
    console.log('Template deleted:', tplId);
  };

  // Handler function to export a single template as a PDF
  const handleExportAsPDF = (tpl: Prompt) => {
    const now = new Date();
    const timeStamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      '_',
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');

    const pdfDefinition: any = {
      content: [
        { text: tpl.name, style: 'header' },
        { text: tpl.content, margin: [0, 5, 0, 15] },
      ],
      styles: {
        header: { fontSize: 14, bold: true, color: '#2D4F6C' },
      },
      defaultStyle: {
        color: '#333',
      },
    };

    pdfMake
      .createPdf(pdfDefinition)
      .download(`${timeStamp}_${tpl.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    console.log('Exported template as PDF:', tpl.id);
  };

  // Filter templates based on the search term
  const filteredTemplates = templates.filter((tpl) =>
    tpl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tpl.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
      {/* Modal Container */}
      <div
        className="w-full max-w-3xl max-h-[90vh] rounded-lg shadow-xl
                   bg-white dark:bg-[#1a2b3c] text-gray-900 dark:text-white
                   border border-gray-200 dark:border-[#3D7F80] p-6 flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b border-gray-200 dark:border-[#3D7F80] flex-shrink-0">
          <h2 className="text-xl font-semibold text-[#2D4F6C] dark:text-white mb-4 sm:mb-0">
            {t('Templates')}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleNewTemplate}
              className="rounded-md bg-[#2D4F6C] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#25415a] transition-colors duration-200"
            >
              {t('New Template')}
            </button>
            <button
              onClick={handleImport}
              className="rounded-md bg-[#3D7F80] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#316667] transition-colors duration-200"
            >
              {t('Import JSON')}
            </button>
            <button
              onClick={handleExportAllJSON}
              className="rounded-md bg-[#3D7F80] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#316667] transition-colors duration-200"
            >
              {t('Export All JSON')}
            </button>
            <button
              onClick={handleClose}
              className="rounded-md bg-[#68A9A9] px-3 py-1.5 text-sm font-semibold text-[#1a2b3c] hover:bg-[#5a9a9a] transition-colors duration-200"
            >
              {t('Close')}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="my-4 flex-shrink-0">
          <input
            type="text"
            placeholder={t('Search Templates by Name or Content...') || ''}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-[#3D7F80]
                       bg-white dark:bg-[#25374a] text-sm text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-[#68A9A9] focus:border-transparent"
          />
        </div>

        {/* Templates List - Make this scrollable */}
        <div className="mt-1 space-y-3 overflow-y-auto flex-grow pr-2">
          {/* Message when no templates match search or none exist */}
          {filteredTemplates.length === 0 && (
            <div className="text-center text-sm italic text-gray-500 dark:text-gray-400 py-6">
              {templates.length === 0
                ? t('No templates found. Add a new template or import some.')
                : t('No templates match your search.')}
            </div>
          )}

          {/* Map through filtered templates and render each one */}
          {filteredTemplates.map((tpl) => {
            const isExpanded = expandedTemplateId === tpl.id;
            const isEditing = editingTemplateId === tpl.id;

            return (
              <div
                key={tpl.id}
                className="p-3 rounded-md border border-gray-200 dark:border-[#3D7F80]/50 bg-gray-50 dark:bg-[#25374a] transition-all duration-200 shadow-sm"
              >
                {/* Template Title Row */}
                <div className="flex items-center justify-between gap-2">
                  {/* Clickable Title to Expand/Collapse */}
                  <button
                    onClick={() => handleToggleExpand(tpl.id)}
                    className="text-left flex-grow min-w-0 group"
                  >
                    <h3 className="text-sm font-semibold text-[#2D4F6C] dark:text-gray-100 truncate group-hover:text-[#3D7F80] dark:group-hover:text-[#68A9A9]">
                      {tpl.name}
                    </h3>
                  </button>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Expand/Collapse Button */}
                    <button
                      className="text-xs font-medium text-[#3D7F80] hover:text-[#2D4F6C] dark:text-[#68A9A9] dark:hover:text-white"
                      onClick={() => handleToggleExpand(tpl.id)}
                      // ---- FIX APPLIED HERE: fallback ensures a valid string
                      title={isExpanded ? t('Collapse') || '' : t('Expand') || ''}
                    >
                      {isExpanded ? t('Collapse') : t('Expand')}
                    </button>
                    {/* Delete Button */}
                    <button
                      className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      title={t('Delete Template') || ''}
                    >
                      {t('Delete')}
                    </button>
                  </div>
                </div>

                {/* Expanded Content Area */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#3D7F80]/50 text-sm">
                    {isEditing ? (
                      <>
                        {/* Edit Name Input */}
                        <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                          {t('Template Name')}
                        </label>
                        <input
                          className="w-full mb-2 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-[#3D7F80]
                                     bg-white dark:bg-[#1a2b3c] text-gray-900 dark:text-white
                                     focus:outline-none focus:ring-1 focus:ring-[#68A9A9]"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        {/* Edit Content Textarea */}
                        <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                          {t('Template Content')}
                        </label>
                        <textarea
                          className="w-full h-32 mb-2 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-[#3D7F80]
                                     bg-white dark:bg-[#1a2b3c] text-gray-900 dark:text-white
                                     focus:outline-none focus:ring-1 focus:ring-[#68A9A9] font-mono"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={6}
                        />
                        {/* Save/Cancel Buttons for Editing */}
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            className="rounded-md bg-[#68A9A9] px-3 py-1 text-xs font-medium text-[#1a2b3c]
                                       hover:bg-[#5a9a9a]"
                            onClick={() => setEditingTemplateId(null)}
                          >
                            {t('Cancel')}
                          </button>
                          <button
                            className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white
                                       hover:bg-green-700"
                            onClick={() => handleSaveTemplate(tpl.id)}
                          >
                            {t('Save')}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className="p-2 border border-gray-200 dark:border-[#3D7F80]/30 rounded-md bg-white dark:bg-[#1a2b3c]
                                     text-gray-800 dark:text-gray-200 mb-2 whitespace-pre-wrap text-xs leading-relaxed font-mono"
                        >
                          {tpl.content || (
                            <span className="italic text-gray-400 dark:text-gray-500">
                              {t('No content')}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            className="text-xs font-medium text-[#3D7F80] hover:text-[#2D4F6C] dark:text-[#68A9A9] dark:hover:text-white"
                            onClick={() => handleStartEdit(tpl)}
                          >
                            {t('Edit')}
                          </button>
                          <button
                            className="text-xs font-medium text-[#3D7F80] hover:text-[#2D4F6C] dark:text-[#68A9A9] dark:hover:text-white"
                            onClick={() => handleExportAsPDF(tpl)}
                          >
                            {t('Export as PDF')}
                          </button>
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

export default TemplatesModal;
