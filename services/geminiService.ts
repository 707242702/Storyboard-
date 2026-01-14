
import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardResponse } from "../types";

export const analyzeVideoToStoryboard = async (
  videoBase64: string,
  mimeType: string
): Promise<StoryboardResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: videoBase64,
          },
        },
        {
          text: `You are a professional film editor and AI prompting expert. 
          Break down this video (max 70s) into a professional storyboard for video reproduction.
          
          CRITICAL REQUIREMENTS:
          1. The first item MUST be the Intro (00:00).
          2. The last item MUST be the Outro (the final frame).
          3. Capture all significant shot changes in between.
          4. EXTRACT ALL TEXT: Identify any on-screen text, subtitles, or spoken dialogue.
          
          For each entry:
          - timestamp: MM:SS
          - duration: e.g., "3.2s"
          - shotType: e.g., "Medium Close Up"
          - cameraMovement: e.g., "Handheld Tracking" or "Static"
          - description: Visual layout and color palette
          - action: What is physically happening
          - lighting: Lighting direction and temperature
          - subtitles: Any visible text/captions or spoken dialogue in this shot
          - reproductionPrompt: A detailed prompt for AI Video Generators (Sora/Veo) to recreate this specific shot. Include lens, subject, environment, and motion.
          
          Provide a concise summary of the visual narrative.`
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                timestamp: { type: Type.STRING },
                duration: { type: Type.STRING },
                shotType: { type: Type.STRING },
                cameraMovement: { type: Type.STRING },
                description: { type: Type.STRING },
                action: { type: Type.STRING },
                lighting: { type: Type.STRING },
                subtitles: { type: Type.STRING },
                reproductionPrompt: { type: Type.STRING },
              },
              required: ["timestamp", "duration", "shotType", "cameraMovement", "description", "action", "lighting", "reproductionPrompt"]
            }
          }
        },
        required: ["title", "summary", "scenes"]
      },
    },
  });

  if (!response.text) {
    throw new Error("API returned an empty response.");
  }

  return JSON.parse(response.text.trim()) as StoryboardResponse;
};
