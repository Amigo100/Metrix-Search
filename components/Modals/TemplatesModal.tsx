// /components/Modals/TemplatesModal.tsx

import { useState, useContext } from 'react';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';
import { Prompt } from '@/types/prompt';
import { v4 as uuidv4 } from 'uuid';

// PDFMake
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const TemplatesModal = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useContext(HomeContext);

  const isOpen = state.openModal === 'templates';
  if (!isOpen) return null;

  // Pull the prompts from global state
  const templates: Prompt[] = state.prompts || [];

  // Local state for expanded & editing templates
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to update templates in global state and localStorage
  const updateTemplates = (newTemplates: Prompt[]) => {
    dispatch({ field: 'prompts', value: newTemplates });
    localStorage.setItem('prompts', JSON.stringify(newTemplates));
    console.log('Templates updated in global state and localStorage.');
  };

  const handleClose = () => {
    dispatch({ field: 'openModal', value: null });
  };

  // Import templates from a JSON file
  const handleImport = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text) as Prompt[];
        updateTemplates([...templates, ...imported]);
        alert(t('Templates imported successfully!'));
        console.log('Templates imported from JSON file.');
      } catch (error) {
        console.error('Error importing templates:', error);
        alert(t('Error importing templates.'));
      }
    };
    fileInput.click();
  };

  // Export all templates as JSON
  const handleExportAllJSON = () => {
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

  // Create a new blank template
  const handleNewTemplate = () => {
    const newTemplate: Prompt = {
      id: uuidv4(),
      name: t('New Template'),
      description: '',
      content: '',
      model: {
        id: 'gpt-4',
        name: 'GPT-4',
        maxLength: 24000,
        tokenLimit: 8000,
      },
      folderId: null,
    };

    const updated = [...templates, newTemplate];
    updateTemplates(updated);

    // Immediately expand and begin editing the new template
    setExpandedTemplateId(newTemplate.id);
    setEditingTemplateId(newTemplate.id);
    setEditName(newTemplate.name);
    setEditContent(newTemplate.content);

    console.log('New blank template created:', newTemplate.id);
  };

  // Toggle expansion for a template
  const handleToggleExpand = (tplId: string) => {
    if (expandedTemplateId === tplId) {
      setExpandedTemplateId(null);
      if (editingTemplateId === tplId) {
        setEditingTemplateId(null);
      }
    } else {
      setExpandedTemplateId(tplId);
    }
  };

  // Start editing a template
  const handleStartEdit = (tpl: Prompt) => {
    setEditingTemplateId(tpl.id);
    setEditName(tpl.name);
    setEditContent(tpl.content);
  };

  // Save changes to a template
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

  // Delete a template
  const handleDeleteTemplate = (tplId: string) => {
    const filtered = templates.filter((tpl) => tpl.id !== tplId);
    updateTemplates(filtered);
    if (expandedTemplateId === tplId) setExpandedTemplateId(null);
    if (editingTemplateId === tplId) setEditingTemplateId(null);
    console.log('Template deleted:', tplId);
  };

  // Export a single template as PDF
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

    const pdfDefinition = {
      content: [
        { text: tpl.name, style: 'header' },
        { text: tpl.content, margin: [0, 5, 0, 15] },
      ],
      styles: {
        header: { fontSize: 14, bold: true },
      },
    };

    pdfMake.createPdf(pdfDefinition).download(`${timeStamp}_${tpl.name}.pdf`);
    console.log('Exported template as PDF:', tpl.id);
  };

  // Filter templates by search term
  const filteredTemplates = templates.filter((tpl) =>
    tpl.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
      {/* Modal Container */}
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-md shadow-lg
                   bg-white dark:bg-[#343541] text-black dark:text-white 
                   border border-gray-300 dark:border-gray-700 p-6"
      >
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold mb-4 sm:mb-0">
            {t('Templates')}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleNewTemplate}
              className="rounded-md bg-gray-900 px-3 py-1 text-sm font-semibold text-white hover:bg-gray-700 transition"
            >
              {t('New Template')}
            </button>
            <button
              onClick={handleImport}
              className="rounded-md bg-gray-900 px-3 py-1 text-sm font-semibold text-white hover:bg-gray-700 transition"
            >
              {t('Import')}
            </button>
            <button
              onClick={handleExportAllJSON}
              className="rounded-md bg-gray-900 px-3 py-1 text-sm font-semibold text-white hover:bg-gray-700 transition"
            >
              {t('Export All JSON')}
            </button>
            <button
              onClick={handleClose}
              className="rounded-md bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              {t('Close')}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <input
            type="text"
            placeholder={t('Search Templates') || ''}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-[#343541] text-sm text-black dark:text-white 
                       placeholder-gray-400 dark:placeholder-gray-500 
                       focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
          />
        </div>

        {/* Templates List */}
        <div className="mt-4 space-y-2">
          {filteredTemplates.length === 0 && (
            <div className="text-sm italic">
              {t('No templates found. Try adding a new template or importing some.')}
            </div>
          )}

          {filteredTemplates.map((tpl) => {
            const isExpanded = expandedTemplateId === tpl.id;
            const isEditing = editingTemplateId === tpl.id;

            return (
              <div
                key={tpl.id}
                className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800"
              >
                {/* Title row */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleToggleExpand(tpl.id)}
                    className="text-left"
                  >
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                      {tpl.name}
                    </h3>
                  </button>
                  <div className="flex items-center gap-3">
                    {!isExpanded ? (
                      <button
                        className="text-xs underline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        onClick={() => handleToggleExpand(tpl.id)}
                      >
                        {t('Expand')}
                      </button>
                    ) : (
                      <button
                        className="text-xs underline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        onClick={() => handleToggleExpand(tpl.id)}
                      >
                        {t('Collapse')}
                      </button>
                    )}
                    <button
                      className="text-xs underline text-red-500 hover:text-red-400"
                      onClick={() => handleDeleteTemplate(tpl.id)}
                    >
                      {t('Delete')}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-2 text-sm">
                    {isEditing ? (
                      <>
                        <label className="block mb-1 font-medium text-gray-800 dark:text-gray-100">
                          {t('Template Name')}
                        </label>
                        <input
                          className="w-full mb-2 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 
                                     bg-white dark:bg-[#343541] text-black dark:text-white 
                                     focus:outline-none"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        <label className="block mb-1 font-medium text-gray-800 dark:text-gray-100">
                          {t('Template Content')}
                        </label>
                        <textarea
                          className="w-full h-32 mb-2 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 
                                     bg-white dark:bg-[#343541] text-black dark:text-white 
                                     focus:outline-none"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            className="rounded-md bg-gray-300 px-3 py-1 text-sm font-medium text-gray-800 
                                       hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                            onClick={() => setEditingTemplateId(null)}
                          >
                            {t('Cancel')}
                          </button>
                          <button
                            className="rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white 
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
                          className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#343541] 
                                     text-gray-800 dark:text-white mb-2 whitespace-pre-wrap"
                        >
                          {tpl.content}
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            className="text-xs underline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            onClick={() => handleStartEdit(tpl)}
                          >
                            {t('Edit')}
                          </button>
                          <button
                            className="text-xs underline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
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
