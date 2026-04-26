import { GoogleGenAI, Type } from "@google/genai";

export interface ContentBlock {
  type: 'heading' | 'text' | 'table' | 'image';
  content?: string; // For heading, text
  tableData?: string[][]; // For table
  boundingBox?: number[]; // For image [ymin, xmin, ymax, xmax] (0-1000 scale)
}

export const analyzeDocumentImage = async (base64Image: string): Promise<ContentBlock[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analyze this document image and extract the content into a structured JSON format.
    
    Identify the following elements:
    1. Headings (type: 'heading')
    2. Paragraphs of text (type: 'text')
    3. Tables (type: 'table')
    4. Images, charts, diagrams, or figures (type: 'image')

    CRITICAL RULES:
    - For 'image' type: DO NOT extract text inside the image/chart. Instead, return the bounding box of the image area in the format [ymin, xmin, ymax, xmax] on a 0-1000 scale.
    - For 'text' and 'heading': Extract the text content accurately.
    - For 'table': Extract the table content as a 2D array of strings.
    - Mathematical formulas: Identify and return them in LaTeX format, wrapped in '$' (e.g., $E=mc^2$).
    - IGNORE HEADERS AND FOOTERS: Do not extract page numbers, headers, or footers.
    - IMPORTANT FORMATTING RULES FOR MATH/TEXT:
      1. DO NOT wrap standalone numbers with units in '$' (e.g., write "2 cm", "5 cm", NOT "$2$ cm").
      2. DO NOT wrap standalone geometric points or event labels in '$' (e.g., write "A, B, C", "A:", "B:", NOT "$A$", "$B$").
      3. SUB-QUESTION NUMBERING: You MUST format sub-questions using the pattern "1) ", "2) ", "3) ". DO NOT use "(1)", "(2)", "①", "②", "1.", "2.", etc. Convert all other numbering styles to "1) ", "2) ", etc.
      4. SUB-QUESTIONS MUST BE ON NEW LINES: Every sub-question MUST start on a completely new line. Use actual line breaks (enter/return) in the JSON string, do NOT output the literal characters "\\n".
         Correct example:
         "Bài 8: Gieo hai con xúc xắc...
         1) A: Tích số chấm...
         2) B: Tích số chấm..."
    - Maintain the reading order of the document.

    Return a JSON array of objects with the following schema:
    {
      "type": "heading" | "text" | "table" | "image",
      "content": string (for heading/text),
      "tableData": string[][] (for table),
      "boundingBox": number[] (for image, [ymin, xmin, ymax, xmax])
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Updated to gemini-3-flash-preview
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["heading", "text", "table", "image"] },
              content: { type: Type.STRING },
              tableData: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                } 
              },
              boundingBox: { 
                type: Type.ARRAY, 
                items: { type: Type.NUMBER } 
              }
            },
            required: ["type"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const parsed = JSON.parse(text) as ContentBlock[];
    
    // Clean up any literal "\n" strings that the AI might have outputted instead of actual newlines
    return parsed.map(block => {
      if (block.content) {
        block.content = block.content.replace(/\\n/g, '\n');
      }
      return block;
    });
  } catch (error) {
    console.error("Error analyzing document:", error);
    throw error;
  }
};
