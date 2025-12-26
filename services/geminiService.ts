
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ContentConfig, GeneratedContent, NicheType } from "../types";

export class TubeGeniusAI {
  async generateContent(config: ContentConfig): Promise<GeneratedContent> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = this.getSystemInstruction(config.niche);
    
    const prompt = `
      Create a comprehensive YouTube ${config.format} content package for the topic: "${config.topic}".
      Target Tone: ${config.tone}
      Language: ${config.language}

      Requirement:
      1. Engaging Title (SEO optimized)
      2. Full Script with timestamps
      3. Precise Voiceover text
      4. 5 high-quality image prompts for AI image generation (describing visual scenes)
      5. Metadata (Description, 10 tags)
      6. A brief Safety & Compliance report
      7. A list of 3-5 critical factual claims for human verification. Each claim must include a confidence score (0-100) representing how certain you are of its accuracy based on your training data.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            script: { type: Type.STRING },
            voiceoverText: { type: Type.STRING },
            imagePrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            criticalClaims: {
              type: Type.ARRAY,
              items: { 
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  confidence: { type: Type.INTEGER, description: "A percentage value from 0 to 100" }
                }
              }
            },
            metadata: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              }
            },
            safetyReport: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}") as GeneratedContent;
    
    // Auto-generate Storyboard thumbnails using nano banana image model
    result.scenePreviews = await this.generateStoryboard(result.imagePrompts);
    
    return result;
  }

  private async generateStoryboard(prompts: string[]): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const previews: string[] = [];
    
    // Generate previews in parallel for speed
    const tasks = prompts.map(async (p) => {
      try {
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: `Cinematic storyboard sketch for: ${p}. 4k, hyper-realistic, studio lighting.`,
          config: {
            imageConfig: { aspectRatio: "16:9" }
          }
        });
        
        const part = res.candidates[0].content.parts.find(pt => pt.inlineData);
        return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : '';
      } catch (e) {
        console.error("Image generation failed", e);
        return '';
      }
    });

    return await Promise.all(tasks);
  }

  private getSystemInstruction(niche: NicheType): string {
    switch (niche) {
      case NicheType.FINANCE:
        return "You are a senior financial analyst from Wall Street. Use data-driven insights.";
      case NicheType.SENIOR_HEALTH:
        return "You are a compassionate health educator specializing in senior care.";
      case NicheType.TECH_AI:
        return "You are a tech visionary and early adopter.";
      case NicheType.HISTORY:
        return "You are a master storyteller with cinematic vision.";
      case NicheType.COMMERCE:
        return "You are a professional product reviewer focusing on conversion.";
      default:
        return "You are a professional YouTube content strategist.";
    }
  }
}
