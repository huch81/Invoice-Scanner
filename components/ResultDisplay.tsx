import React from 'react';
import { InvoiceData } from '../types';

interface ResultDisplayProps {
  data: InvoiceData;
  onChange: (newData: InvoiceData) => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, onChange }) => {
  const handleInputChange = (field: keyof InvoiceData, value: string | number) => {
    onChange({ ...data, [field]: value });
  };

  const handleItemChange = (index: number, field: keyof typeof data.items[0], value: string | number) => {
    const newItems = [...data.items];
    // @ts-ignore - dynamic assignment safe here due to type narrowing in input
    newItems[index][field] = value;
    onChange({ ...data, items: newItems });
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-slate-200">
      <div className="bg-indigo-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          發票識別結果
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Invoice Number</label>
            <input
              type="text"
              value={data.invoiceNumber || ''}
              onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Invoice Date</label>
            <input
              type="text"
              value={data.invoiceDate || ''}
              onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
              placeholder="YYYY-MM-DD"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">PO Number</label>
            <input
              type="text"
              value={data.poNumber || ''}
              onChange={(e) => handleInputChange('poNumber', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Quotation Number</label>
            <input
              type="text"
              value={data.quotationNumber || ''}
              onChange={(e) => handleInputChange('quotationNumber', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
            />
          </div>
        </div>

        {/* Line Items */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">細項內容 (Items)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-2 rounded-tl-md">Description</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Unit Price</th>
                  <th className="px-4 py-2 text-right rounded-tr-md">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 p-0"
                      />
                    </td>
                    <td className="px-2 py-2 text-right w-20">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-right"
                      />
                    </td>
                    <td className="px-2 py-2 text-right w-32">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-right"
                      />
                    </td>
                    <td className="px-2 py-2 text-right w-32 font-medium">
                      <input
                        type="number"
                        value={item.total}
                        onChange={(e) => handleItemChange(index, 'total', parseFloat(e.target.value))}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <span className="text-slate-500 font-semibold uppercase">Total Amount ({data.currency})</span>
            <input
              type="number"
              value={data.totalAmount}
              onChange={(e) => handleInputChange('totalAmount', parseFloat(e.target.value))}
              className="text-2xl font-bold text-indigo-700 w-48 text-right border-none bg-transparent focus:ring-2 focus:ring-indigo-500 rounded-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
};