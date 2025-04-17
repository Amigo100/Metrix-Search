import { useState, useContext, ChangeEvent } from 'react';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';
import { Prompt } from '@/types/prompt';
import { v4 as uuidv4 } from 'uuid';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

import {
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

/**
 * TemplatesModal Component
 * Displays a modal for managing prompt templates. Allows users to view, create,
 * edit, delete, import (JSON), and export (JSON, PDF) templates.
 * IMPROVEMENT: Adjusted overlay opacity.
 */
export const TemplatesModal = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useContext(HomeContext);

  const isOpen = state.openModal === 'templates';
  if (!isOpen) return null;

  const templates: Prompt[] = state.prompts || [];

  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // ... (rest of the handler functions remain exactly the same) ...
  const updateTemplates = (newTemplates: Prompt[]) => {
    dispatch({ type: 'change', field: 'prompts', value: newTemplates });
    localStorage.setItem('prompts', JSON.stringify(newTemplates));
    console.log('Templates updated in global state and localStorage.');
  };

  const handleClose = () => {
    dispatch({ type: 'change', field: 'openModal', value: null });
  };

  const handleImport = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const imported = JSON.parse(text) as Prompt[];
          if (!Array.isArray(imported)) {
            throw new Error("Invalid JSON format: Expected an array.");
          }
          updateTemplates([...templates, ...imported]);
          alert(t('Templates imported successfully!') || 'Templates imported successfully!');
          console.log('Templates imported from JSON file.');
        } catch (error) {
          console.error('Error importing templates:', error);
          alert(t('Error importing templates. Please check file format.') || 'Error importing templates.');
        }
    };
    fileInput.click();
  };

  const handleExportAllJSON = () => {
    if (templates.length === 0) {
      alert(t('No templates to export.') || 'No templates to export.');
      return;
    }
    const dataStr = JSON.stringify(templates, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'templates_export.json';
    link.click();
    URL.revokeObjectURL(url);
    console.log('All templates exported as JSON.');
  };

  const handleNewTemplate = () => {
    const newTemplate: Prompt = {
      id: uuidv4(),
      name: t('New Template') || 'New Template',
      description: '',
      content: '',
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
    setExpandedTemplateId(newTemplate.id);
    setEditingTemplateId(newTemplate.id);
    setEditName(newTemplate.name);
    setEditContent(newTemplate.content);
    console.log('New blank template created:', newTemplate.id);
    // Optionally scroll the new template into view
    // setTimeout(() => document.getElementById(`template-${newTemplate.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const handleToggleExpand = (tplId: string) => {
    if (expandedTemplateId === tplId) {
      setExpandedTemplateId(null);
      if (editingTemplateId === tplId) {
        setEditingTemplateId(null);
      }
    } else {
      setExpandedTemplateId(tplId);
      if (editingTemplateId && editingTemplateId !== tplId) {
         setEditingTemplateId(null);
      }
    }
  };

  const handleStartEdit = (tpl: Prompt) => {
    setEditingTemplateId(tpl.id);
    setEditName(tpl.name);
    setEditContent(tpl.content);
    setExpandedTemplateId(tpl.id);
  };

  const handleSaveTemplate = (tplId: string) => {
    if (!editName.trim()) {
        alert(t('Template name cannot be empty.') || 'Template name cannot be empty.');
        return;
    }
    const updated = templates.map((tpl) =>
      tpl.id === tplId
        ? { ...tpl, name: editName.trim(), content: editContent }
        : tpl
    );
    updateTemplates(updated);
    setEditingTemplateId(null);
    alert(t('Template saved!') || 'Template saved!');
    console.log('Template saved with id:', tplId);
  };

  const handleDeleteTemplate = (tplId: string) => {
    if (!window.confirm(t('Are you sure you want to delete this template?') || 'Are you sure you want to delete this template?')) {
        return;
    }
    const filtered = templates.filter((tpl) => tpl.id !== tplId);
    updateTemplates(filtered);
    if (expandedTemplateId === tplId) setExpandedTemplateId(null);
    if (editingTemplateId === tplId) setEditingTemplateId(null);
    console.log('Template deleted:', tplId);
  };

  const handleExportAsPDF = (tpl: Prompt) => {
    const now = new Date();
    const timeStamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

    const pdfDefinition: any = {
        content: [
            { text: tpl.name, style: 'header' },
            { text: tpl.content || (t('No content') || 'No content'), margin: [0, 5, 0, 15], style: 'content' },
        ],
        styles: {
            header: { fontSize: 14, bold: true, color: '#0F766E' /* teal-700 */, marginBottom: 5 },
            content: { fontSize: 10 }
        },
        defaultStyle: {
            color: '#374151' // gray-700
        },
    };

    pdfMake.createPdf(pdfDefinition).download(`${timeStamp}_${tpl.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    console.log('Exported template as PDF:', tpl.id);
  };


  const filteredTemplates = templates.filter((tpl) =>
    tpl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tpl.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // --- RECTIFICATION: Changed overlay background opacity from /70 to /50 ---
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    {/* Alternative syntax: <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm"> */}
      <div
        className="w-full max-w-3xl max-h-[90vh] rounded-lg shadow-xl
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   border border-gray-200 dark:border-teal-700/50 p-6 flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b border-gray-200 dark:border-teal-700/50 flex-shrink-0">
          <h2 className="text-xl font-semibold text-teal-800 dark:text-teal-300 mb-4 sm:mb-0">
            {t('Manage Templates')}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleNewTemplate}
              className="inline-flex items-center rounded-md bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              title={t('Create a new blank template') || ''}
            >
              <PlusIcon className="w-4 h-4 mr-1" /> {t('New')}
            </button>
            <button
              onClick={handleImport}
              className="inline-flex items-center rounded-md bg-teal-100 dark:bg-teal-800/50 px-3 py-1.5 text-sm font-semibold text-teal-700 dark:text-teal-300 shadow-sm hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors duration-200"
              title={t('Import templates from a JSON file') || ''}
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> {t('Import JSON')}
            </button>
            <button
              onClick={handleExportAllJSON}
              className="inline-flex items-center rounded-md bg-teal-100 dark:bg-teal-800/50 px-3 py-1.5 text-sm font-semibold text-teal-700 dark:text-teal-300 shadow-sm hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors duration-200"
              title={t('Export all current templates to a JSON file') || ''}
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-1" /> {t('Export JSON')}
            </button>
            <button
              onClick={handleClose}
              className="inline-flex items-center rounded-md bg-gray-200 dark:bg-gray-600 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-100 shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
              title={t('Close this modal') || ''}
            >
              <XMarkIcon className="w-4 h-4 mr-1" /> {t('Close')}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="my-4 flex-shrink-0 relative">
          <input
            type="text"
            placeholder={t('Search Templates by Name or Content...') || ''}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-teal-700/50
                       bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title={t('Clear search') || ''}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Templates List */}
        <div className="mt-1 space-y-3 overflow-y-auto flex-grow pr-2">
          {filteredTemplates.length === 0 && (
             <div className="text-center text-sm italic text-gray-500 dark:text-gray-400 py-10 px-4 rounded-md border border-dashed border-gray-300 dark:border-gray-600">
                {templates.length === 0
                    ? t('No templates found. Click "New" or "Import JSON" to add templates.')
                    : t('No templates match your search term.')}
            </div>
          )}

          {filteredTemplates.map((tpl) => {
            const isExpanded = expandedTemplateId === tpl.id;
            const isEditing = editingTemplateId === tpl.id;

            return (
              <div
                key={tpl.id}
                id={`template-${tpl.id}`}
                className="p-3 rounded-md border border-gray-200 dark:border-teal-800/60 bg-gray-50 dark:bg-gray-700/50 transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-teal-700"
              >
                {/* Template Title Row */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleExpand(tpl.id)}
                    className="text-left flex-grow min-w-0 group flex items-center"
                    title={t('Click to expand/collapse details') || ''}
                  >
                    <h3 className="text-sm font-semibold text-teal-800 dark:text-gray-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-300">
                      {tpl.name}
                    </h3>
                    {isEditing && <PencilSquareIcon className="ml-2 h-3 w-3 text-teal-500 flex-shrink-0"/>}
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        className="p-1 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-300"
                        onClick={() => handleToggleExpand(tpl.id)}
                        title={isExpanded ? t('Collapse') || '' : t('Expand') || ''}
                    >
                        {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                    </button>
                    <button
                        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        title={t('Delete Template') || ''}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Content Area */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-teal-800/50 text-sm">
                    {isEditing ? (
                      <>
                        <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                          {t('Template Name')}
                        </label>
                        <input
                          className="w-full mb-3 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-teal-700/50
                                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                     focus:outline-none focus:ring-1 focus:ring-teal-500"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                          {t('Template Content')}
                        </label>
                        <textarea
                          className="w-full h-36 mb-3 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-teal-700/50
                                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                     focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={8}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            className="inline-flex items-center rounded-md bg-gray-200 dark:bg-gray-600 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-100 shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                            onClick={() => setEditingTemplateId(null)}
                            title={t('Cancel changes') || ''}
                          >
                            <XMarkIcon className="w-4 h-4 mr-1" /> {t('Cancel')}
                          </button>
                          <button
                            className="inline-flex items-center rounded-md bg-teal-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                            onClick={() => handleSaveTemplate(tpl.id)}
                            title={t('Save changes to this template') || ''}
                          >
                             <CheckIcon className="w-4 h-4 mr-1" /> {t('Save')}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className="p-3 border border-gray-200 dark:border-teal-800/30 rounded-md bg-white dark:bg-gray-800
                                     text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-wrap text-xs leading-relaxed font-mono"
                        >
                          {tpl.content || (
                            <span className="italic text-gray-400 dark:text-gray-500">
                              {t('No content provided for this template.')}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            className="inline-flex items-center text-xs font-medium text-teal-600 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
                            onClick={() => handleStartEdit(tpl)}
                            title={t('Edit this template') || ''}
                          >
                             <PencilSquareIcon className="w-4 h-4 mr-1" /> {t('Edit')}
                          </button>
                          <button
                            className="inline-flex items-center text-xs font-medium text-teal-600 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
                            onClick={() => handleExportAsPDF(tpl)}
                            title={t('Export this template as a PDF file') || ''}
                          >
                            <DocumentArrowDownIcon className="w-4 h-4 mr-1" /> {t('Export PDF')}
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
