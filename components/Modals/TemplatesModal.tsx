// /components/Modals/TemplatesModal.tsx

import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { useTranslation, DefaultTFuncReturn } from 'next-i18next'; // Hook for internationalization
import HomeContext from '@/pages/api/home/home.context'; // Context for global state
// Assuming Prompt type exists - adding conceptual fields here for clarity
// import { Prompt } from '@/types/prompt';
import { v4 as uuidv4 } from 'uuid'; // Library for generating unique IDs

// PDFMake library for generating PDFs client-side
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs; // Assign virtual file system for fonts

// --- Conceptual Types (assuming these exist or similar) ---
interface ModelInfo {
  id: string;
  name: string;
  maxLength: number;
  tokenLimit: number;
}

interface Prompt {
  id: string;
  name: string;
  description: string; // Assuming description exists
  content: string;
  model: ModelInfo;
  folderId: string | null;
  lastModified?: number; // Added for sorting by date
}

interface Folder {
  id: string;
  name: string;
}
// --- End Conceptual Types ---

// --- Notification Component (Simple Inline) ---
interface NotificationMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

const InlineNotification: React.FC<{
  notification: NotificationMessage | null;
  onDismiss: () => void;
}> = ({ notification, onDismiss }) => {
  if (!notification) return null;

  const baseClasses = "px-4 py-2 rounded-md text-sm mb-4 flex justify-between items-center shadow";
  const typeClasses = {
    success: "bg-green-100 border border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-600/50 dark:text-green-200",
    error: "bg-red-100 border border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-600/50 dark:text-red-200",
    info: "bg-blue-100 border border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-600/50 dark:text-blue-200",
  };

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);


  return (
    <div className={`${baseClasses} ${typeClasses[notification.type]}`}>
      <span>{notification.message}</span>
      <button onClick={onDismiss} className="ml-4 text-current opacity-70 hover:opacity-100">&times;</button>
    </div>
  );
};
// --- End Notification Component ---


/**
 * TemplatesModal Component - Enhanced Version
 *
 * Manages prompt templates with folders, sorting, bulk actions,
 * improved notifications, confirmations, and loading states.
 */
export const TemplatesModal = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useContext(HomeContext);

  // --- Modal State ---
  const isOpen = state.openModal === 'templates';

  // --- Data State ---
  const [allTemplates, setAllTemplates] = useState<Prompt[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  // --- UI State ---
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editFolderId, setEditFolderId] = useState<string | null>(null); // For editing template's folder
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState<'nameAsc' | 'nameDesc' | 'dateAsc' | 'dateDesc'>('nameAsc');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null means 'All Templates'
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationMessage | null>(null);


  // --- Load Initial Data ---
  useEffect(() => {
    if (isOpen) {
      // Load templates from global state or localStorage
      const storedTemplates = state.prompts || JSON.parse(localStorage.getItem('prompts') || '[]');
      // Ensure lastModified exists (add placeholder if missing)
      const templatesWithDate = storedTemplates.map((p: Prompt) => ({
        ...p,
        lastModified: p.lastModified || Date.now()
      }));
      setAllTemplates(templatesWithDate);

      // Load folders from localStorage (or initialize if none)
      const storedFolders = JSON.parse(localStorage.getItem('folders') || '[]');
      setFolders(storedFolders);

      // Reset UI state on open
      setSearchTerm('');
      setSelectedFolderId(null);
      setSelectedTemplateIds(new Set());
      setNotification(null);
      setIsLoading(false);
      setExpandedTemplateId(null);
      setEditingTemplateId(null);
    }
  }, [isOpen, state.prompts]); // Rerun if modal opens or global prompts change


  // --- Data Update Helpers ---
  const updateFolders = useCallback((newFolders: Folder[]) => {
    setFolders(newFolders);
    localStorage.setItem('folders', JSON.stringify(newFolders));
    console.log('Folders updated in state and localStorage.');
  }, []);

  const updateAllTemplates = useCallback((newTemplates: Prompt[]) => {
    setAllTemplates(newTemplates);
    // Update global state and localStorage
    dispatch({ type: 'change', field: 'prompts', value: newTemplates });
    localStorage.setItem('prompts', JSON.stringify(newTemplates));
    console.log('Templates updated in global state and localStorage.');
  }, [dispatch]);


  // --- Event Handlers ---
  const handleClose = () => {
    dispatch({ type: 'change', field: 'openModal', value: null });
  };

  const handleCreateFolder = () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName || folders.some(f => f.name === trimmedName)) {
      setNotification({ type: 'error', message: t('Folder name cannot be empty or duplicate.') });
      return;
    }
    const newFolder: Folder = { id: uuidv4(), name: trimmedName };
    updateFolders([...folders, newFolder]);
    setNewFolderName('');
    setNotification({ type: 'success', message: t('Folder "{{name}}" created.', { name: trimmedName }) });
  };

  // Note: Deleting folders would require handling templates within them (e.g., move to null or prevent deletion if not empty)
  // This basic implementation doesn't include folder deletion.

  const handleImport = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      setIsLoading(true);
      setNotification(null);
      try {
        const text = await file.text();
        const imported = JSON.parse(text);

        // Basic validation (check if it's an array)
        if (!Array.isArray(imported)) {
          // ALT FIX: Use String() constructor
          throw new Error(String(t('Invalid file format: Expected an array of templates.')));
        }

        // More robust validation could check individual prompt structures
        const validImported = imported.map((p: any) => ({ // Add default/missing fields
             id: p.id || uuidv4(),
             name: p.name || t('Imported Template'),
             description: p.description || '',
             content: p.content || '',
             model: p.model || state.defaultModelId || { id: 'gpt-4', name: 'GPT-4', maxLength: 24000, tokenLimit: 8000 }, // Default model
             folderId: p.folderId && folders.some(f => f.id === p.folderId) ? p.folderId : null, // Assign to folder only if folder exists
             lastModified: p.lastModified || Date.now(),
        })) as Prompt[];

        updateAllTemplates([...allTemplates, ...validImported]);
        setNotification({ type: 'success', message: t('{{count}} templates imported successfully!', { count: validImported.length }) });
      } catch (error: any) {
        console.error('Error importing templates:', error);
        // Ensure error message is string
        const errorMessage = typeof error.message === 'string' ? error.message : t('Unknown error');
        setNotification({ type: 'error', message: `${t('Error importing templates:')} ${errorMessage}` });
      } finally {
        setIsLoading(false);
      }
    };
    fileInput.click();
  };

  const handleExport = (templatesToExport: Prompt[]) => {
     if (templatesToExport.length === 0) {
        setNotification({ type: 'info', message: t('No templates selected for export.') });
        return;
     }
     setIsLoading(true);
     try {
        const dataStr = JSON.stringify(templatesToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `templates_export_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        console.log(`${templatesToExport.length} templates exported as JSON.`);
        // No notification needed here usually, download starts automatically
     } catch (error) {
         console.error('Error exporting templates:', error);
         setNotification({ type: 'error', message: t('Failed to export templates.') });
     } finally {
         setIsLoading(false);
     }
  };

  const handleExportAllJSON = () => handleExport(allTemplates);
  const handleExportSelectedJSON = () => {
      const selected = allTemplates.filter(t => selectedTemplateIds.has(t.id));
      handleExport(selected);
  };


  const handleNewTemplate = () => {
    const newTemplate: Prompt = {
      id: uuidv4(),
      name: t('New Template'),
      description: '',
      content: '',
      model: state.defaultModelId ? { id: state.defaultModelId, name: 'Default', maxLength: 24000, tokenLimit: 8000 } : { id: 'gpt-4', name: 'GPT-4', maxLength: 24000, tokenLimit: 8000 },
      folderId: selectedFolderId, // Assign to current folder
      lastModified: Date.now(),
    };

    updateAllTemplates([...allTemplates, newTemplate]);

    // Immediately expand and begin editing
    setExpandedTemplateId(newTemplate.id);
    setEditingTemplateId(newTemplate.id);
    setEditName(newTemplate.name);
    setEditContent(newTemplate.content);
    setEditFolderId(newTemplate.folderId); // Set folder for editing dropdown

    console.log('New blank template created:', newTemplate.id);
    // Scroll to the new template if possible (more complex UI needed)
  };

  const handleToggleExpand = (tplId: string) => {
    if (expandedTemplateId === tplId) {
      setExpandedTemplateId(null);
      if (editingTemplateId === tplId) { // Stop editing if collapsing the edited item
        setEditingTemplateId(null);
      }
    } else {
      setExpandedTemplateId(tplId);
       if (editingTemplateId && editingTemplateId !== tplId) { // Stop editing other item if expanding a new one
         setEditingTemplateId(null);
      }
    }
  };

  const handleStartEdit = (tpl: Prompt) => {
    setEditingTemplateId(tpl.id);
    setEditName(tpl.name);
    setEditContent(tpl.content);
    setEditFolderId(tpl.folderId); // Load current folder ID
    setExpandedTemplateId(tpl.id); // Ensure expanded
  };

  const handleSaveTemplate = (tplId: string) => {
    const updated = allTemplates.map((tpl) =>
      tpl.id === tplId
        ? { ...tpl, name: editName.trim() || t('Untitled Template'), content: editContent, folderId: editFolderId, lastModified: Date.now() } // Update fields and timestamp
        : tpl
    );
    updateAllTemplates(updated);
    setEditingTemplateId(null);
    setNotification({ type: 'success', message: t('Template saved!') });
    console.log('Template saved with id:', tplId);
  };

  const handleDeleteTemplate = (tplId: string) => {
    // ALT FIX: Use String() constructor for window.confirm
    if (window.confirm(String(t('Are you sure you want to delete this template?')))) {
      const filtered = allTemplates.filter((tpl) => tpl.id !== tplId);
      updateAllTemplates(filtered);
      if (expandedTemplateId === tplId) setExpandedTemplateId(null);
      if (editingTemplateId === tplId) setEditingTemplateId(null);
      // Remove from selection if deleted
      const newSelected = new Set(selectedTemplateIds);
      newSelected.delete(tplId);
      setSelectedTemplateIds(newSelected);
      setNotification({ type: 'info', message: t('Template deleted.') });
      console.log('Template deleted:', tplId);
    }
  };

   const handleDeleteSelected = () => {
      if (selectedTemplateIds.size === 0) {
         setNotification({ type: 'info', message: t('No templates selected for deletion.') });
         return;
      }
      // ALT FIX: Use String() constructor for window.confirm
      if (window.confirm(String(t('Are you sure you want to delete {{count}} selected templates?', { count: selectedTemplateIds.size })))) {
         const filtered = allTemplates.filter((tpl) => !selectedTemplateIds.has(tpl.id));
         updateAllTemplates(filtered);
         setSelectedTemplateIds(new Set()); // Clear selection
         setEditingTemplateId(null); // Ensure no deleted item is being edited
         setExpandedTemplateId(null); // Collapse any potentially deleted expanded item
         setNotification({ type: 'info', message: t('{{count}} templates deleted.', { count: selectedTemplateIds.size }) });
         console.log(`${selectedTemplateIds.size} templates deleted.`);
      }
   };


  const handleExportAsPDF = (tpl: Prompt) => {
    setIsLoading(true);
    try {
        const now = new Date();
        const timeStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const pdfDefinition: any = {
          content: [
            { text: tpl.name, style: 'header' },
            { text: tpl.description, style: 'description', margin: [0, 2, 0, 10] },
            { text: tpl.content, style: 'content' },
          ],
          styles: {
            header: { fontSize: 16, bold: true, color: '#2D4F6C', marginBottom: 5 },
            description: { fontSize: 10, italics: true, color: '#666' },
            content: { fontSize: 10, preservation: 'preserveLeading', preserveLeading: true },
          },
          defaultStyle: { fontSize: 10, color: '#333', lineHeight: 1.3 },
        };
        pdfMake.createPdf(pdfDefinition).download(`${timeStamp}_${tpl.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
        console.log('Exported template as PDF:', tpl.id);
    } catch (error) {
        console.error('Error exporting PDF:', error);
        setNotification({ type: 'error', message: t('Failed to generate PDF.') });
    } finally {
        setIsLoading(false);
    }
  };

  const handleCheckboxChange = (tplId: string, checked: boolean) => {
      const newSelected = new Set(selectedTemplateIds);
      if (checked) {
          newSelected.add(tplId);
      } else {
          newSelected.delete(tplId);
      }
      setSelectedTemplateIds(newSelected);
  };

  const handleSelectAllChange = (checked: boolean) => {
      if (checked) {
          setSelectedTemplateIds(new Set(filteredAndSortedTemplates.map(t => t.id)));
      } else {
          setSelectedTemplateIds(new Set());
      }
  };


  // --- Filtering and Sorting Logic ---
  const filteredAndSortedTemplates = useMemo(() => {
    let result = allTemplates;

    // Filter by folder
    if (selectedFolderId) {
      result = result.filter(t => t.folderId === selectedFolderId);
    } else {
        // When "All Folders" is selected, show templates with null folderId OR folderId matching an existing folder
        // This prevents orphaned templates from disappearing if their folder is deleted externally
         result = result.filter(t => t.folderId === null || folders.some(f => f.id === t.folderId));
    }


    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(tpl =>
        tpl.name.toLowerCase().includes(lowerSearchTerm) ||
        tpl.content.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortCriteria) {
        case 'nameAsc':
          return a.name.localeCompare(b.name);
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        case 'dateAsc':
          return (a.lastModified || 0) - (b.lastModified || 0);
        case 'dateDesc':
          return (b.lastModified || 0) - (a.lastModified || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [allTemplates, searchTerm, sortCriteria, selectedFolderId, folders]);

  // Determine if "Select All" checkbox should be checked
  const isAllSelected = useMemo(() => {
      return filteredAndSortedTemplates.length > 0 && selectedTemplateIds.size === filteredAndSortedTemplates.length;
  }, [filteredAndSortedTemplates, selectedTemplateIds]);


  // --- Render ---
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-[1000]">
          <svg className="animate-spin h-8 w-8 text-[#2D4F6C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {/* Modal Container */}
      <div
        className="w-full max-w-5xl h-[90vh] rounded-lg shadow-xl
                   bg-white dark:bg-[#1a2b3c] text-gray-900 dark:text-white
                   border border-gray-200 dark:border-[#3D7F80] p-0 flex flex-col overflow-hidden" // Changed padding to 0, manage internally
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#3D7F80] flex-shrink-0">
          <h2 className="text-xl font-semibold text-[#2D4F6C] dark:text-white">
            {t('Templates')}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-md bg-[#68A9A9] px-3 py-1.5 text-sm font-semibold text-[#1a2b3c] hover:bg-[#5a9a9a] transition-colors duration-200"
            disabled={isLoading}
          >
            {t('Close')}
          </button>
        </div>

        {/* Notification Area */}
        <div className="px-4 pt-4 flex-shrink-0">
            <InlineNotification notification={notification} onDismiss={() => setNotification(null)} />
        </div>


        {/* Main Content Area (Folders + Templates) */}
        <div className="flex flex-grow overflow-hidden">

            {/* Folders Sidebar */}
            <div className="w-1/4 border-r border-gray-200 dark:border-[#3D7F80]/50 p-4 flex flex-col overflow-y-auto flex-shrink-0">
                <h3 className="text-sm font-semibold mb-3 text-[#2D4F6C] dark:text-gray-200">{t('Folders')}</h3>
                <button
                    onClick={() => setSelectedFolderId(null)}
                    className={`w-full text-left text-sm p-2 rounded mb-1 ${selectedFolderId === null ? 'bg-[#e0f2f2] dark:bg-[#3D7F80]/50 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                >
                    {t('All Templates')}
                </button>
                {folders.map(folder => (
                    <button
                        key={folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        className={`w-full text-left text-sm p-2 rounded mb-1 ${selectedFolderId === folder.id ? 'bg-[#e0f2f2] dark:bg-[#3D7F80]/50 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                    >
                        {folder.name}
                    </button>
                ))}
                 {/* Add New Folder / Template Area */}
                 <div className="mt-auto pt-4 border-t border-gray-200 dark:border-[#3D7F80]/50">
                     {/* Moved New Template button here */}
                     <button
                        onClick={handleNewTemplate}
                        className="w-full rounded bg-[#2D4F6C] px-3 py-1 text-xs font-semibold text-white hover:bg-[#25415a] mb-2" // Added margin-bottom
                        disabled={isLoading}
                    >
                        {t('New Template')}
                    </button>
                    {/* Add New Folder Input */}
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder={t('New folder name...')}
                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-[#3D7F80] bg-white dark:bg-[#25374a] focus:ring-1 focus:ring-[#68A9A9] focus:outline-none mb-2"
                    />
                    <button
                        onClick={handleCreateFolder}
                        className="w-full rounded bg-[#3D7F80] px-3 py-1 text-xs font-semibold text-white hover:bg-[#316667] transition-colors duration-200"
                        disabled={isLoading || !newFolderName.trim()}
                    >
                        {t('Create Folder')}
                    </button>
                 </div>
            </div>

            {/* Templates Area */}
            <div className="w-3/4 p-4 flex flex-col overflow-hidden">
                {/* Toolbar (Search, Sort, Actions) */}
                <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between mb-4 flex-shrink-0">
                    <input
                        type="text"
                        placeholder={t('Search Templates...') || ''}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-[#3D7F80]
                                   bg-white dark:bg-[#25374a] text-sm text-gray-900 dark:text-white
                                   placeholder-gray-400 dark:placeholder-gray-500
                                   focus:outline-none focus:ring-1 focus:ring-[#68A9A9] focus:border-transparent md:w-1/3"
                    />
                    {/* Removed New Template button from here */}
                    <div className="flex gap-2 items-center flex-wrap">
                         {/* Sort Dropdown */}
                         <select
                            value={sortCriteria}
                            onChange={(e) => setSortCriteria(e.target.value as any)}
                            className="px-2 py-1.5 text-xs rounded border border-gray-300 dark:border-[#3D7F80] bg-white dark:bg-[#25374a] focus:ring-1 focus:ring-[#68A9A9] focus:outline-none"
                         >
                            <option value="nameAsc">{t('Sort: Name (A-Z)')}</option>
                            <option value="nameDesc">{t('Sort: Name (Z-A)')}</option>
                            <option value="dateDesc">{t('Sort: Date (Newest)')}</option>
                            <option value="dateAsc">{t('Sort: Date (Oldest)')}</option>
                         </select>
                         {/* Bulk Actions */}
                         <button
                            onClick={handleDeleteSelected}
                            className="rounded bg-red-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            disabled={isLoading || selectedTemplateIds.size === 0}
                         >
                             {t('Delete Selected')} ({selectedTemplateIds.size})
                         </button>
                         <button
                            onClick={handleExportSelectedJSON}
                            className="rounded bg-[#3D7F80] px-2 py-1.5 text-xs font-semibold text-white hover:bg-[#316667] disabled:opacity-50"
                            disabled={isLoading || selectedTemplateIds.size === 0}
                         >
                             {t('Export Selected')} ({selectedTemplateIds.size})
                         </button>
                         {/* Import/Export All Buttons */}
                         <button
                            onClick={handleImport}
                            className="rounded-md bg-[#3D7F80] px-2 py-1.5 text-xs font-semibold text-white hover:bg-[#316667] transition-colors duration-200"
                            disabled={isLoading}
                         >
                             {t('Import JSON')}
                         </button>
                         <button
                            onClick={handleExportAllJSON}
                            className="rounded-md bg-[#3D7F80] px-2 py-1.5 text-xs font-semibold text-white hover:bg-[#316667] transition-colors duration-200"
                            disabled={isLoading}
                         >
                             {t('Export All JSON')}
                         </button>
                    </div>
                </div>

                {/* Templates List Header */}
                 <div className="flex items-center px-3 py-1 border-b border-t border-gray-200 dark:border-[#3D7F80]/50 bg-gray-50 dark:bg-gray-800/30 flex-shrink-0">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 rounded text-[#3D7F80] bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-offset-0 focus:ring-[#68A9A9]"
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAllChange(e.target.checked)}
                        disabled={filteredAndSortedTemplates.length === 0}
                    />
                    <span className="ml-3 text-xs font-medium text-gray-600 dark:text-gray-400">{t('Select All')}</span>
                    {/* Add other header info if needed */}
                 </div>


                {/* Templates List */}
                <div className="mt-1 space-y-2 overflow-y-auto flex-grow pr-1">
                  {filteredAndSortedTemplates.length === 0 && (
                    <div className="text-center text-sm italic text-gray-500 dark:text-gray-400 py-10">
                      {allTemplates.length === 0
                        ? t('No templates exist yet.')
                        : selectedFolderId && !folders.find(f => f.id === selectedFolderId)
                        ? t('Selected folder not found.') // Edge case if folder deleted externally
                        : searchTerm
                        ? t('No templates match your search in this folder.')
                        : t('This folder is empty.')
                       }
                       <button onClick={handleNewTemplate} className="ml-2 text-sm text-[#2D4F6C] dark:text-[#68A9A9] underline"> {t('Create one?')}</button>
                    </div>
                  )}

                  {filteredAndSortedTemplates.map((tpl) => {
                    const isExpanded = expandedTemplateId === tpl.id;
                    const isEditing = editingTemplateId === tpl.id;
                    const isSelected = selectedTemplateIds.has(tpl.id);

                    return (
                      <div
                        key={tpl.id}
                        className={`p-3 rounded-md border ${isSelected ? 'border-[#3D7F80] bg-[#e0f2f2]/50 dark:bg-[#3D7F80]/30' : 'border-gray-200 dark:border-[#3D7F80]/30 bg-gray-50 dark:bg-[#25374a]/70'} transition-all duration-150 shadow-sm`}
                      >
                        {/* Template Title Row */}
                        <div className="flex items-center justify-between gap-2">
                           <div className="flex items-center flex-grow min-w-0 gap-2">
                               <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 rounded text-[#3D7F80] bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-offset-0 focus:ring-[#68A9A9] flex-shrink-0"
                                    checked={isSelected}
                                    onChange={(e) => handleCheckboxChange(tpl.id, e.target.checked)}
                                />
                                <button
                                    onClick={() => handleToggleExpand(tpl.id)}
                                    className="text-left flex-grow min-w-0 group"
                                >
                                    <h3 className="text-sm font-semibold text-[#2D4F6C] dark:text-gray-100 truncate group-hover:text-[#3D7F80] dark:group-hover:text-[#68A9A9]">
                                    {tpl.name}
                                    </h3>
                                     {/* Optional: Show folder name */}
                                     {tpl.folderId && folders.find(f => f.id === tpl.folderId) && (
                                         <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({folders.find(f => f.id === tpl.folderId)?.name})</span>
                                     )}
                                </button>
                           </div>
                          {/* Action Icons/Buttons */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                             <button
                                className="text-xs font-medium text-[#3D7F80] hover:text-[#2D4F6C] dark:text-[#68A9A9] dark:hover:text-white"
                                onClick={() => handleToggleExpand(tpl.id)}
                                title={isExpanded ? t('Collapse') : t('Expand')}
                              >
                                {isExpanded ? t('Collapse') : t('Expand')}
                              </button>
                            <button
                              className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              title={t('Delete Template') || ''}
                              disabled={isLoading}
                            >
                              {t('Delete')}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Content Area */}
                        {isExpanded && (
                          <div className={`mt-3 pt-3 border-t border-gray-200 dark:border-[#3D7F80]/50 text-sm ${isEditing ? 'p-3 bg-blue-50 dark:bg-[#2D4F6C]/20 rounded-md' : ''}`}>
                            {/* Editing View */}
                            {isEditing ? (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                    <div>
                                        <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                                        {t('Template Name')}
                                        </label>
                                        <input
                                        className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-[#3D7F80]
                                                    bg-white dark:bg-[#1a2b3c] text-gray-900 dark:text-white
                                                    focus:outline-none focus:ring-1 focus:ring-[#68A9A9]"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                                        {t('Folder')}
                                        </label>
                                        <select
                                            value={editFolderId || ''} // Use empty string for 'No Folder' option value
                                            onChange={(e) => setEditFolderId(e.target.value || null)}
                                            className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-[#3D7F80] bg-white dark:bg-[#1a2b3c] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#68A9A9]"
                                        >
                                            <option value="">{t('-- No Folder --')}</option>
                                            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                    </div>
                                </div>

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
                                <div className="flex justify-end gap-2 mt-2">
                                  <button
                                    className="rounded-md bg-[#68A9A9] px-3 py-1 text-xs font-medium text-[#1a2b3c] hover:bg-[#5a9a9a]"
                                    onClick={() => setEditingTemplateId(null)}
                                    disabled={isLoading}
                                  >
                                    {t('Cancel')}
                                  </button>
                                  <button
                                    className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                                    onClick={() => handleSaveTemplate(tpl.id)}
                                    disabled={isLoading}
                                  >
                                    {t('Save')}
                                  </button>
                                </div>
                              </>
                            ) : (
                              /* Read-Only View */
                              <>
                                <div
                                   className="p-2 border border-gray-200 dark:border-[#3D7F80]/30 rounded-md bg-white dark:bg-[#1a2b3c]
                                              text-gray-800 dark:text-gray-200 mb-2 whitespace-pre-wrap text-xs leading-relaxed font-mono max-h-40 overflow-y-auto"
                                >
                                  {tpl.content || <span className="italic text-gray-400 dark:text-gray-500">{t('No content')}</span>}
                                </div>
                                <div className="flex justify-end gap-3">
                                  <button
                                    className="text-xs font-medium text-[#3D7F80] hover:text-[#2D4F6C] dark:text-[#68A9A9] dark:hover:text-white"
                                    onClick={() => handleStartEdit(tpl)}
                                    disabled={isLoading}
                                  >
                                    {t('Edit')}
                                  </button>
                                  <button
                                    className="text-xs font-medium text-[#3D7F80] hover:text-[#2D4F6C] dark:text-[#68A9A9] dark:hover:text-white"
                                    onClick={() => handleExportAsPDF(tpl)}
                                    disabled={isLoading}
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
                </div> {/* End Templates List */}
            </div> {/* End Templates Area */}
        </div> {/* End Main Content Area */}
      </div> {/* End Modal Container */}
    </div> /* End Modal Backdrop */
  );
};

// Export the component as default
export default TemplatesModal;
