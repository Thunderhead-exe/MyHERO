import { GoogleGenAI, Type } from "@google/genai";
import { Child, GeneratedScene } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to parse JSON that might be wrapped in markdown code blocks or contain extra text.
 * Uses regex to find the JSON object/array wrapper.
 */
const cleanAndParseJSON = (text: string) => {
  if (!text) throw new Error("Empty response from AI");

  // 1. Try simple parse first (best case)
  try {
    return JSON.parse(text);
  } catch (e) {
    // Continue
  }

  // 2. Extract content from markdown code blocks (```json ... ``` or just ``` ... ```)
  // This regex matches ``` followed by optional json, captures content, and ends with ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      // If code block content isn't valid JSON, fall through
    }
  }

  // 3. Regex to find the first opening brace '{' or '[' and the last matching '}' or ']'
  // This is a heuristic: find the first { and the last }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const jsonCandidate = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonCandidate);
    } catch (e) {
      // Continue
    }
  }

  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      const jsonCandidate = text.substring(firstBracket, lastBracket + 1);
      return JSON.parse(jsonCandidate);
    } catch (e) {
        // Continue
    }
  }

  console.error("JSON Parse Failure. Raw text:", text);
  throw new Error("Could not extract valid JSON from the AI response.");
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
      model: "gemini-3-pro-preview",
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

    return cleanAndParseJSON(response.text || "");
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

    return cleanAndParseJSON(response.text || "");
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