export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  invoiceDate: string;
  invoiceNumber: string;
  poNumber: string;
  quotationNumber: string;
  totalAmount: number;
  currency: string;
  items: LineItem[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface InvoiceSessionItem {
  id: string;
  file: File;
  previewUrl: string;
  status: AppStatus;
  result?: InvoiceData;
  error?: string;
}