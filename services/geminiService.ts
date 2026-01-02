import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const INVOICE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    invoiceDate: {
      type: Type.STRING,
      description: "The date of the invoice (e.g., YYYY-MM-DD)."
    },
    invoiceNumber: {
      type: Type.STRING,
      description: "The unique identifier number of the invoice."
    },
    poNumber: {
      type: Type.STRING,
      description: "The Purchase Order (PO) number if available."
    },
    quotationNumber: {
      type: Type.STRING,
      description: "The Quotation number if available."
    },
    totalAmount: {
      type: Type.NUMBER,
      description: "The total amount of the invoice after tax/discounts."
    },
    currency: {
      type: Type.STRING,
      description: "The currency code (e.g., USD, TWD, EUR)."
    },
    items: {
      type: Type.ARRAY,
      description: "List of line items in the invoice.",
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unitPrice: { type: Type.NUMBER },
          total: { type: Type.NUMBER }
        },
        required: ["description", "quantity", "unitPrice", "total"]
      }
    }
  },
  required: ["invoiceDate", "invoiceNumber", "totalAmount", "items"]
};

export const analyzeInvoiceImage = async (base64Data: string): Promise<InvoiceData> => {
  try {
    // Detect MIME type from the data URL header (e.g., data:application/pdf;base64,...)
    const mimeMatch = base64Data.match(/^data:(.*?);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    // Clean the base64 string by removing the header
    const cleanBase64 = base64Data.replace(/^data:(.*?);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: "Analyze this invoice document. Extract the Invoice Date, Invoice Number, PO Number, Quotation Number, Total Amount, Currency, and all line items (Description, Quantity, Unit Price, Total). Return the data in valid JSON format matching the schema."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: INVOICE_SCHEMA,
        systemInstruction: "You are an expert accountant AI. Be precise with numbers and OCR extraction. If a field is not present (like PO or Quotation), return an empty string. Convert dates to YYYY-MM-DD format if possible."
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No data returned from Gemini.");
    }

    const data = JSON.parse(text) as InvoiceData;
    return data;

  } catch (error) {
    console.error("Error analyzing invoice:", error);
    throw error;
  }
};