import React, { useCallback } from 'react';

interface UploadAreaProps {
  onFilesSelect: (files: File[]) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelect }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFilesSelect(Array.from(event.target.files));
      // Reset input value to allow selecting the same file again if needed
      event.target.value = '';
    }
  }, [onFilesSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onFilesSelect(Array.from(event.dataTransfer.files));
    }
  }, [onFilesSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <div className="w-full">
      <label
        htmlFor="invoice-upload"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-300 border-dashed rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className="w-8 h-8 mb-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className="mb-1 text-sm text-indigo-700 font-medium">點擊或拖曳上傳多張發票</p>
          <p className="text-xs text-indigo-500">支援 PDF, PNG, JPG (Max 10MB)</p>
        </div>
        <input 
          id="invoice-upload" 
          type="file" 
          className="hidden" 
          multiple
          accept="image/*,application/pdf" 
          onChange={handleFileChange} 
        />
      </label>
    </div>
  );
};