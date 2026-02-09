import { GoogleGenAI, Type } from "@google/genai";
import { Child, GeneratedScene } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to parse JSON that might be wrapped in markdown code blocks or contain extra text.
 * Finds the first valid JSON object in the string.
 */
const cleanAndParseJSON = (text: string) => {
  try {
    // 1. Try simple parse first
    try {
        return JSON.parse(text);
    } catch (e) {
        // Continue to cleaning strategies
    }

    // 2. Remove markdown code blocks
    let cleaned = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        // Continue to substring strategy
    }

    // 3. Extract JSON object substring
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const jsonString = text.substring(startIndex, endIndex + 1);
      return JSON.parse(jsonString);
    }

    // 4. Extract JSON array substring (if expected)
    const startArr = text.indexOf('[');
    const endArr = text.lastIndexOf(']');
    if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
        const jsonString = text.substring(startArr, endArr + 1);
        return JSON.parse(jsonString);
    }

    throw new Error("Could not find valid JSON in response");
  } catch (e) {
    console.error("JSON Parse Error. Raw text:", text);
    throw new Error("Invalid response format from AI. Could not parse JSON.");
  }
};

/**
 * Generates a story based on the child's profile and a specific lesson.
 */
export const generateStoryContent = async (
  child: Child,
  lesson: string
): Promise<{ title: string; paragraphs: string[] }> => {
  
  const colors = child.favoriteColors && child.favoriteColors.length > 0 
    ? child.favoriteColors.join(", ") 
    : "colorful patterns";

  const prompt = `
    ROLE: Expert Children's Book Author.
    TARGET AUDIENCE: Child, Age ${child.age}.
    CONTEXT: The child's name is ${child.name}. They like ${child.interests.join(", ")} and the colors: ${colors}.
    OBJECTIVE: Write a story where the main character (${child.name}) learns the value of "${lesson}".
    CONSTRAINTS:
    1. The story must be approx 300 words total.
    2. Split the story into 4-6 engaging paragraphs.
    3. The tone must be encouraging, warm, and fun.
    4. Do not be preachy; show the lesson through consequences and resolution.
    5. Return ONLY the JSON object. Do not include any markdown formatting or explanation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            paragraphs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["title", "paragraphs"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from Gemini");
    
    return cleanAndParseJSON(text);
  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error("Failed to generate story. Please try again.");
  }
};

/**
 * Analyzes the story to extract key scenes for illustration.
 */
export const extractScenes = async (
  storyTitle: string,
  paragraphs: string[]
): Promise<GeneratedScene[]> => {
  const storyText = paragraphs.map((p, i) => `Paragraph ${i}: ${p}`).join("\n\n");
  
  const prompt = `
    Analyze the following children's story titled "${storyTitle}".
    Identify 3 distinct, visually interesting scenes that would make great illustrations.
    
    STORY:
    ${storyText}

    INSTRUCTIONS:
    - Select 3 scenes.
    - For each scene, provide the 'index' of the paragraph it corresponds to (use the paragraph index 0-${paragraphs.length-1}).
    - Provide a 'description' for the illustration.
    - The description must be visual, simple, and suitable for an image generator.
    - Return JSON: array of objects { index: number, description: string }.
    - Return ONLY the JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              index: { type: Type.INTEGER },
              description: { type: Type.STRING },
            },
            required: ["index", "description"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    return cleanAndParseJSON(text);
  } catch (error) {
    console.error("Error extracting scenes:", error);
    return [];
  }
};

/**
 * Generates an illustration for a specific scene description.
 */
export const generateIllustrationImage = async (
  sceneDescription: string,
  style: string = "watercolor style, soft pastel colors, children's book illustration"
): Promise<string> => {
  
  const finalPrompt = `
    Create a high-quality children's book illustration.
    Style: ${style}.
    Scene: ${sceneDescription}.
    Ensure the image is safe for children, colorful, and engaging.
    Aspect Ratio: 1:1.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: finalPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Extract image
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No content parts returned");

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Error generating illustration:", error);
    throw error;
  }
};