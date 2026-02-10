
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function fetchConflictBriefing(countryName: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a comprehensive intelligence dossier for ${countryName}. 
      1. Identify current political leadership (Head of State/Government).
      2. List specific conflict hotspots with approximate [latitude, longitude].
      3. Detail all active armed conflicts or political violence. 
      Use Wikipedia-style historical grounding for root causes and actor descriptions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            currentRuler: { type: Type.STRING },
            governmentType: { type: Type.STRING },
            brief: { type: Type.STRING },
            severityScore: { type: Type.NUMBER },
            status: { type: Type.STRING },
            hotspots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  coordinates: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  intensity: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                }
              }
            },
            deepDetails: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  causes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  type: { type: Type.STRING },
                  status: { type: Type.STRING },
                  actors: { type: Type.ARRAY, items: { type: Type.STRING } },
                  casualties: {
                    type: Type.OBJECT,
                    properties: {
                      civilian: { type: Type.NUMBER },
                      military: { type: Type.NUMBER },
                      total: { type: Type.NUMBER }
                    }
                  },
                  displacement: { type: Type.NUMBER },
                  wikipediaContext: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Briefing Error:", error);
    return null;
  }
}

export async function fetchMapsIntelligence(query: string, latitude: number, longitude: number) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Perform a detailed geospatial analysis for: ${query}. Focus on strategic infrastructure, government buildings, and humanitarian nodes near coordinates [${latitude}, ${longitude}].`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: latitude,
              longitude: longitude
            }
          }
        }
      },
    });

    return {
      text: response.text,
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Gemini Maps Grounding Error:", error);
    return null;
  }
}

export async function fetchIntelligenceConnections() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Analyze current global geopolitics and return 12 significant active connections. Include specific details on the nature of the proxy support or alliance.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              source: { type: Type.STRING, description: "3-letter ISO code" },
              target: { type: Type.STRING, description: "3-letter ISO code" },
              type: { type: Type.STRING, description: "PROXY_WAR, ARMS_FLOW, ALLIANCE, CYBER, or SPILLOVER" },
              description: { type: Type.STRING }
            },
            required: ["id", "source", "target", "type", "description"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Connections Fetch Error:", error);
    return [];
  }
}

export async function fetchGlobalConflictUpdates() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Summarize the most critical global conflict developments in the last 24 hours.",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Global Updates Error:", error);
    return "Unable to fetch real-time updates.";
  }
}
