import React, { useState, useCallback, useEffect } from 'react';
import { UploadArea } from './components/UploadArea';
import { ResultDisplay } from './components/ResultDisplay';
import { analyzeInvoiceImage } from './services/geminiService';
import { InvoiceData, AppStatus, InvoiceSessionItem } from './types';

const App: React.FC = () => {
  const [items, setItems] = useState<InvoiceSessionItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const activeItem = items.find(item => item.id === activeItemId) || null;

  // Cleanup object URLs when items are removed
  useEffect(() => {
    return () => {
      items.forEach(item => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const handleFilesSelect = useCallback((files: File[]) => {
    const newItems: InvoiceSessionItem[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: AppStatus.IDLE
    }));

    setItems(prev => [...prev, ...newItems]);
    
    // Automatically select the first new item if nothing is selected
    if (!activeItemId && newItems.length > 0) {
      setActiveItemId(newItems[0].id);
    } else if (newItems.length > 0) {
        // Optional: switch to the newly added item? Let's keep current selection unless it was null.
        setActiveItemId(newItems[0].id);
    }
  }, [activeItemId]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const analyzeItem = async (item: InvoiceSessionItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: AppStatus.ANALYZING, error: undefined } : i));

    try {
      const base64 = await fileToBase64(item.file);
      const result = await analyzeInvoiceImage(base64);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: AppStatus.SUCCESS, result } : i));
    } catch (e) {
      console.error(e);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: AppStatus.ERROR, error: "識別失敗" } : i));
    }
  };

  const handleAnalyzeActive = () => {
    if (activeItem) {
      analyzeItem(activeItem);
    }
  };

  const handleAnalyzeAll = async () => {
    const pendingItems = items.filter(i => i.status === AppStatus.IDLE || i.status === AppStatus.ERROR);
    
    // Process sequentially to avoid rate limits or browser hanging
    for (const item of pendingItems) {
      await analyzeItem(item);
    }
  };

  const handleRemoveItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const itemToRemove = items.find(i => i.id === id);
    if (itemToRemove) {
      URL.revokeObjectURL(itemToRemove.previewUrl);
    }
    
    setItems(prev => {
      const newItems = prev.filter(i => i.id !== id);
      // If we removed the active item, select the next available one or null
      if (activeItemId === id) {
        if (newItems.length > 0) {
          setActiveItemId(newItems[0].id);
        } else {
          setActiveItemId(null);
        }
      }
      return newItems;
    });
  };

  const handleDataChange = (newData: InvoiceData) => {
    if (activeItemId) {
      setItems(prev => prev.map(i => i.id === activeItemId ? { ...i, result: newData } : i));
    }
  };

  const handleExportCSV = () => {
    const successItems = items.filter(i => i.status === AppStatus.SUCCESS && i.result);
    if (successItems.length === 0) return;

    // Headers updated for "One Row Per Invoice" structure
    const headers = [
      'File Name',
      'Invoice Date',
      'Invoice Number',
      'PO Number',
      'Quotation Number',
      'Currency',
      'Items Details', // Consolidated items column
      'Invoice Total Amount'
    ];

    let csvContent = headers.join(',') + '\n';

    successItems.forEach(item => {
      const data = item.result!;
      
      // Filter out items with 0 cost as requested
      const validItems = data.items.filter(lineItem => lineItem.total !== 0);

      // Create a detailed summary string for the Items column. 
      // Using newline (\n) as separator allows multi-line cells in Google Sheets/Excel.
      const itemsSummary = validItems.map(lineItem => {
        // Sanitize double quotes in description by replacing with single quotes to avoid breaking CSV format
        const safeDesc = lineItem.description.replace(/"/g, "'").trim();
        return `${safeDesc} (Qty: ${lineItem.quantity}, Unit: ${lineItem.unitPrice}, Total: ${lineItem.total})`;
      }).join('\n');

      const row = [
        `"${item.file.name.replace(/"/g, '""')}"`,
        `"${data.invoiceDate || ''}"`,
        `"${data.invoiceNumber || ''}"`,
        `"${data.poNumber || ''}"`,
        `"${data.quotationNumber || ''}"`,
        `"${data.currency || ''}"`,
        `"${itemsSummary}"`, // Enclosed in quotes to handle newlines and commas within the summary
        data.totalAmount
      ];
      
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoices_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPdf = activeItem?.file.type === 'application/pdf';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Invoice AI Scanner</h1>
          </div>
          <div className="flex gap-3">
             {items.some(i => i.status === AppStatus.IDLE || i.status === AppStatus.ERROR) && (
                <button
                  onClick={handleAnalyzeAll}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <svg className="mr-2 -ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  全部識別
                </button>
             )}
              {items.some(i => i.status === AppStatus.SUCCESS) && (
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <svg className="mr-2 -ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  匯出全部 (CSV)
                </button>
              )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-4rem)]">
        
        {/* Left Column: File List */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full overflow-hidden">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <UploadArea onFilesSelect={handleFilesSelect} />
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-grow overflow-y-auto p-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-2 py-2 mb-2 sticky top-0 bg-white border-b z-10">
              發票列表 ({items.length})
            </h3>
            {items.length === 0 ? (
                <div className="text-center text-slate-400 py-10 px-4 text-sm">
                    尚未上傳任何發票
                </div>
            ) : (
                <ul className="space-y-2">
                {items.map(item => (
                    <li 
                        key={item.id}
                        onClick={() => setActiveItemId(item.id)}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border ${activeItemId === item.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300' : 'hover:bg-slate-50 border-transparent'}`}
                    >
                        <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center text-slate-500 overflow-hidden">
                             {item.file.type.includes('image') ? (
                                 <img src={item.previewUrl} className="w-full h-full object-cover" alt="" />
                             ) : (
                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                             )}
                        </div>
                        <div className="ml-3 flex-grow min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate" title={item.file.name}>{item.file.name}</p>
                            <div className="flex items-center mt-1">
                                {item.status === AppStatus.IDLE && <span className="inline-block w-2 h-2 rounded-full bg-slate-300 mr-2"></span>}
                                {item.status === AppStatus.ANALYZING && <svg className="animate-spin h-3 w-3 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                {item.status === AppStatus.SUCCESS && <svg className="h-3 w-3 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                                {item.status === AppStatus.ERROR && <svg className="h-3 w-3 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>}
                                <span className="text-xs text-slate-500">
                                    {item.status === AppStatus.IDLE && '待處理'}
                                    {item.status === AppStatus.ANALYZING && '識別中'}
                                    {item.status === AppStatus.SUCCESS && '已完成'}
                                    {item.status === AppStatus.ERROR && '失敗'}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => handleRemoveItem(e, item.id)}
                            className="ml-2 text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </li>
                ))}
                </ul>
            )}
          </div>
        </div>

        {/* Middle Column: Preview */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
             <div className="p-3 border-b bg-slate-50 font-medium text-slate-700 flex justify-between items-center">
                 <span>發票預覽</span>
                 {activeItem && (activeItem.status === AppStatus.IDLE || activeItem.status === AppStatus.ERROR) && (
                     <button 
                        onClick={handleAnalyzeActive}
                        className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition"
                     >
                        開始識別此張
                     </button>
                 )}
             </div>
             <div className="flex-grow bg-slate-100 p-4 flex items-center justify-center overflow-auto relative">
                {activeItem ? (
                     isPdf ? (
                        <embed src={activeItem.previewUrl} type="application/pdf" className="w-full h-full min-h-[500px]" />
                      ) : (
                        <img src={activeItem.previewUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-lg" />
                      )
                ) : (
                    <div className="text-slate-400 text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        請選擇一張發票預覽
                    </div>
                )}
             </div>
        </div>

        {/* Right Column: Result */}
        <div className="lg:col-span-5 flex flex-col h-full overflow-hidden">
            {activeItem?.result ? (
                 <div className="h-full overflow-y-auto">
                    <ResultDisplay data={activeItem.result} onChange={handleDataChange} />
                 </div>
            ) : activeItem?.status === AppStatus.ANALYZING ? (
                 <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center p-8">
                    <svg className="h-12 w-12 text-indigo-500 animate-spin mb-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <h3 className="text-lg font-medium text-slate-900">正在 AI 分析中...</h3>
                    <p className="text-slate-500 mt-2">正在提取發票詳細資訊，請稍候</p>
                 </div>
            ) : activeItem?.status === AppStatus.ERROR ? (
                <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center p-8">
                     <div className="bg-red-100 p-3 rounded-full mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                     <h3 className="text-lg font-medium text-slate-900">識別失敗</h3>
                     <p className="text-slate-500 mt-2 text-center">{activeItem.error || "無法讀取發票內容，請重試"}</p>
                     <button 
                        onClick={handleAnalyzeActive}
                        className="mt-6 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                     >
                        重新嘗試
                     </button>
                 </div>
            ) : (
                <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center p-8 text-slate-400">
                    <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p>選擇發票後開始識別</p>
                </div>
            )}
        </div>

      </main>
    </div>
  );
};

export default App;