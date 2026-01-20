
import { GoogleGenAI, Type } from "@google/genai";

export async function scanReceipt(base64Image: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: "Analyze this receipt image from a gas station or convenience store. Extract the items, their quantities, prices, the total amount, and the transaction date. Identify if any item is fuel (Gasoline, Diesel). Return as structured JSON.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                price: { type: Type.NUMBER },
              },
              required: ["description", "quantity", "price"],
            },
          },
          totalAmount: { type: Type.NUMBER },
          date: { type: Type.STRING },
          storeName: { type: Type.STRING },
          isFuelTransaction: { type: Type.BOOLEAN },
        },
        required: ["items", "totalAmount"],
      },
    },
  });

  try {
    const text = response.text;
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("Could not interpret receipt data.");
  }
}
