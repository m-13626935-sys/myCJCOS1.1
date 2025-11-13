import { GoogleGenAI, GenerateContentResponse, Chat, Type } from "@google/genai";
import type { ChatMessage, GroundingChunk, BilingualDictionaryEntry, CalendarEvent, Slide, AiSearchResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("未设置 API_KEY 环境变量");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const SCHEDULE_STORAGE_KEY = 'schedule_app_events';

// --- Internal Helper for Context Injection ---
const getLocalContext = (): string => {
    try {
        const events: CalendarEvent[] = JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY) || '[]');

        let context = "";
        if (events.length > 0) {
            const now = new Date();
            const upcomingEvents = events
                .filter(e => new Date(e.startTime) > now)
                .slice(0, 3)
                .map(e => `${e.title} at ${new Date(e.startTime).toLocaleString()}`)
                .join('; ');
            if (upcomingEvents) {
                context += `\n- User's upcoming events: "${upcomingEvents}"`;
            }
        }
        return context ? `\nFor context, here is some of the user's personal information. Use it to provide more relevant and personalized responses. Do not mention that you have this context unless it's directly relevant to answering the query.` + context : "";
    } catch {
        return "";
    }
};

const bilingualDictionarySchema = {
  type: Type.OBJECT,
  properties: {
    word: { type: Type.STRING, description: "The word that was looked up." },
    language: { type: Type.STRING, enum: ['zh', 'en'], description: "The detected language of the input word ('zh' for Chinese, 'en' for English)." },
    pronunciation: { type: Type.STRING, description: "Pinyin for Chinese words, or IPA for English words." },
    primaryDefinition: { type: Type.STRING, description: "The main definition in the word's original language." },
    secondaryDefinition: { type: Type.STRING, description: "The translation and definition in the other language." },
    examples: {
      type: Type.ARRAY,
      description: "Example sentences.",
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING, description: "The example sentence in the original language." },
          translation: { type: Type.STRING, description: "The translation of the example sentence." }
        },
        required: ['original', 'translation']
      }
    },
    etymology: { type: Type.STRING, description: "A brief history or origin of the word." },
    relatedWords: {
      type: Type.ARRAY,
      description: "Related words like synonyms, antonyms, etc.",
      items: { type: Type.STRING }
    }
  },
  required: ['word', 'language', 'pronunciation', 'primaryDefinition', 'secondaryDefinition', 'examples', 'etymology']
};


const assistantActionSchema = {
    type: Type.OBJECT,
    properties: {
        action: {
            type: Type.STRING,
            // FIX: Added 'create_memory' to the available actions for the AI assistant.
            description: "The specific action to take. Must be one of: 'create_event', 'set_timer', 'change_wallpaper_generate', 'create_memory', or 'none'.",
            enum: ['create_event', 'set_timer', 'change_wallpaper_generate', 'create_memory', 'none']
        },
        parameters: {
            type: Type.OBJECT,
            description: "Parameters for the action. This will be an empty object for 'none' action.",
            properties: {
                // Schedule parameters
                title: { type: Type.STRING, description: "The title of the calendar event." },
                startTime: { type: Type.STRING, description: "The start time of the event in ISO 8601 format. Infer the date and time from the user's request. Assume current year if not specified." },
                endTime: { type: Type.STRING, description: "The end time of the event in ISO 8601 format. If not specified, set it to one hour after the start time." },
                location: { type: Type.STRING, description: "The location of the event." },
                notes: { type: Type.STRING, description: "Any notes for the event." },
                // Timer parameters
                hours: { type: Type.NUMBER, description: "The number of hours for the timer." },
                minutes: { type: Type.NUMBER, description: "The number of minutes for the timer." },
                seconds: { type: Type.NUMBER, description: "The number of seconds for the timer." },
                // Wallpaper parameters
                prompt: { type: Type.STRING, description: "A detailed, creative prompt for generating an image to be used as a wallpaper." },
                // FIX: Added parameters for the 'create_memory' action.
                content: { type: Type.STRING, description: "The content to remember, can be a thought, a link, etc." },
                tags: { type: Type.ARRAY, description: "A list of tags to categorize the memory.", items: { type: Type.STRING } },
            }
        },
        response: { type: Type.STRING, description: "A friendly, conversational response to the user confirming the action has been understood, or explaining why it cannot be done." }
    },
    required: ['action', 'parameters', 'response']
};

const presentationElementSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['text'] },
        x: { type: Type.NUMBER, description: 'X position from left (0-1280)' },
        y: { type: Type.NUMBER, description: 'Y position from top (0-720)' },
        width: { type: Type.NUMBER, description: 'Width of the element' },
        height: { type: Type.NUMBER, description: 'Height of the element' },
        content: { type: Type.STRING, description: 'The text content, can include line breaks with \\n' },
        style: {
            type: Type.OBJECT,
            properties: {
                fontSize: { type: Type.NUMBER },
                fontWeight: { type: Type.NUMBER, description: 'e.g., 400 for normal, 700 for bold' },
                color: { type: Type.STRING, description: 'Hex color code, e.g., #FFFFFF' },
            },
            required: ['fontSize', 'fontWeight', 'color']
        }
    },
    required: ['type', 'x', 'y', 'width', 'height', 'content', 'style']
};

const slideSchema = {
    type: Type.OBJECT,
    properties: {
        backgroundColor: { type: Type.STRING, description: 'Hex color code for the slide background, e.g., #1A202C' },
        elements: {
            type: Type.ARRAY,
            items: presentationElementSchema
        }
    },
    required: ['backgroundColor', 'elements']
};

const presentationSchema = {
    type: Type.ARRAY,
    items: slideSchema
};


export const geminiService = {
    streamChat: async (sessionId: string, message: string, history: ChatMessage[], systemInstruction?: string) => {
        // The history from the client contains the whole conversation, including the latest user message.
        // The Gemini SDK's `Chat` object builds its own history.
        // We need to provide it with the history *before* the latest message.
        const historyForCreate = history
            .slice(0, -1) // Remove the last message (the one we're about to send)
            .filter(msg => msg.text) // Filter out empty placeholder messages
            .map(msg => ({
                role: msg.role, // 'user' and 'model' are valid roles for Gemini
                parts: [{ text: msg.text }]
            }));
        
        const localContext = getLocalContext();

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: historyForCreate,
            config: {
                systemInstruction: `${systemInstruction}${localContext}`,
            },
        });

        return await chat.sendMessageStream({ 
            message,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
    },

    generateImage: async (prompt: string) => {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error("error_image_generation_failed");
    },

    groundedSearch: async (query: string, context?: string): Promise<{ text: string; sources: GroundingChunk[] }> => {
        const localContext = getLocalContext();
        const systemInstruction = `You are a helpful search assistant. Use the provided context if available to better understand the user's query. ${context || ''} ${localContext}`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: query,
            config: {
                 systemInstruction,
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text;
        const sources: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        
        return { text, sources };
    },
    
    performAiSearch: async (query: string): Promise<AiSearchResult> => {
        const { text, sources } = await geminiService.groundedSearch(query);
        return {
            type: 'text',
            text,
            sources,
        };
    },

    analyzeImageAndText: async (prompt: string, file: { data: string; mimeType: string }): Promise<{ text: string }> => {
        const filePart = {
            inlineData: {
                data: file.data,
                mimeType: file.mimeType,
            },
        };

        let textPrompt = prompt;
        if (!textPrompt) {
            if (file.mimeType.startsWith('image/')) {
                textPrompt = "Describe this image in detail.";
            } else if (file.mimeType.startsWith('video/')) {
                textPrompt = "Describe this video in detail.";
            }
        }

        const textPart = { text: textPrompt };
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, filePart] },
        });

        const text = response.text;
        return { text };
    },
    
    identifyRegion: async (base64ImageData: string): Promise<string> => {
        const imagePart = {
            inlineData: {
                data: base64ImageData,
                mimeType: 'image/png', // We'll capture as PNG
            },
        };

        const systemInstruction = `You are an expert at analyzing images of user interfaces. The user has selected a region of their screen. Your task is to identify the primary content within this image.
        1. If the image contains primarily text, perform OCR and return ONLY the transcribed text. Do not add any commentary.
        2. If the image contains a distinct object, person, or scene, provide a concise descriptive search query for it. For example, if it's a picture of the Eiffel Tower, return "Eiffel Tower".
        3. If the content is ambiguous or a mix of elements, provide a brief description that could be used as a search query.
        Your response should be direct and ready to be used in a search engine.`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart] },
            config: {
                systemInstruction,
            }
        });

        return response.text.trim();
    },

    generateInspirationalCopy: async (file: { data: string; mimeType: string }): Promise<string> => {
        const filePart = {
            inlineData: {
                data: file.data,
                mimeType: file.mimeType,
            },
        };

        const textPart = { text: 'Generate a short, poetic, inspirational phrase that captures the essence of this image. Respond with only the phrase, without quotation marks or any other text.' };
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, filePart] },
        });

        return response.text.trim().replace(/"/g, ''); // Remove quotes
    },

    summarizeText: async (text: string): Promise<{ text: string }> => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Please summarize the following text:\n\n${text}`,
            config: {
                systemInstruction: "You are an expert summarizer. Your task is to provide a short, clear, and concise summary of the given text. Extract the key points and main ideas. The summary should be easy to understand for a general audience."
            }
        });
        return { text: response.text };
    },
    
    translateText: async (text: string, targetLanguageName: string): Promise<{ text: string }> => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Translate the following text to ${targetLanguageName}. Provide only the translated text as a raw string, without any additional explanations, formatting, or quotation marks. Text to translate: "${text}"`,
            config: {
                temperature: 0.1, // Lower temperature for more deterministic translation
            }
        });
        return { text: response.text.trim() };
    },

    getChineseDictionaryEntry: async (word: string): Promise<BilingualDictionaryEntry> => {
        const systemInstruction = `You are a strict JSON API for a Chinese-English dictionary. Your task is to analyze a word and return a JSON object based on the provided schema.
    Core Rules:
    1.  **Assume Chinese Input**: Assume the input word is Chinese, but handle reverse lookup if it's clearly English.
    2.  **Chinese Primary**: The 'primaryDefinition' field MUST be in Chinese. The 'secondaryDefinition' field MUST be its English translation/explanation. Examples must have original (Chinese) and translated (English) versions.
    3.  **Reverse Lookup**: If the user provides an English word, perform a reverse lookup. The 'primaryDefinition' must be the Chinese translation(s), and 'secondaryDefinition' must be the original English definition.
    4.  **JSON-ONLY OUTPUT**: Your entire response MUST be a single JSON object that strictly adheres to the schema. No extra text, comments, or markdown.
    5.  **Handle Invalid Input**: If the input is not a real word, you MUST return a valid JSON object where 'primaryDefinition' is "未找到释义。", 'secondaryDefinition' is "No definition found.", and other fields are empty as specified in the schema.
    6.  **Schema Adherence**: Do not deviate from the provided JSON 'responseSchema' under any circumstances.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Provide a detailed Chinese-English dictionary entry for the word: "${word}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: bilingualDictionarySchema,
            },
        });

        try {
            const jsonText = response.text.trim();
            const data = JSON.parse(jsonText);
            return data as BilingualDictionaryEntry;
        } catch (e) {
            console.error("Failed to parse Chinese dictionary entry JSON:", e);
            throw new Error("error_dictionary_parse");
        }
    },
    
    getEnglishDictionaryEntry: async (word: string): Promise<BilingualDictionaryEntry> => {
        const systemInstruction = `You are a strict JSON API for an English-Chinese dictionary. Your task is to analyze a word and return a JSON object based on the provided schema.
    Core Rules:
    1.  **Assume English Input**: Assume the input word is English, but handle reverse lookup if it's clearly Chinese.
    2.  **English Primary**: The 'primaryDefinition' field MUST be in English. The 'secondaryDefinition' field MUST be its Chinese translation/explanation. Examples must have original (English) and translated (Chinese) versions.
    3.  **Reverse Lookup**: If the user provides a Chinese word, perform a reverse lookup. The 'primaryDefinition' must be the English translation(s), and 'secondaryDefinition' must be the original Chinese definition.
    4.  **JSON-ONLY OUTPUT**: Your entire response MUST be a single JSON object that strictly adheres to the schema. No extra text, comments, or markdown.
    5.  **Handle Invalid Input**: If the input is not a real word, you MUST return a valid JSON object where 'primaryDefinition' is "No definition found.", 'secondaryDefinition' is "未找到释义。", and other fields are empty as specified in the schema.
    6.  **Schema Adherence**: Do not deviate from the provided JSON 'responseSchema' under any circumstances.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Provide a detailed English-Chinese dictionary entry for the word: "${word}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: bilingualDictionarySchema,
            },
        });

        try {
            const jsonText = response.text.trim();
            const data = JSON.parse(jsonText);
            return data as BilingualDictionaryEntry;
        } catch (e) {
            console.error("Failed to parse English dictionary entry JSON:", e);
            throw new Error("error_dictionary_parse");
        }
    },

    processAssistantCommand: async (query: string): Promise<any> => {
        const localContext = getLocalContext();
        // FIX: Updated the system instruction to include the 'create_memory' action and its description.
        let systemInstruction = `You are a helpful and clever OS assistant. Your goal is to understand user requests and translate them into structured actions.
- Analyze the user's query to determine if it matches one of the available actions: creating a calendar event, setting a timer, changing the wallpaper by generating an image, or creating a memory.
- If the user wants you to remember something (e.g., "remember that my friend's birthday is on..."), use the 'create_memory' action. Extract the core information as 'content' and generate relevant 'tags' for it.
- **Current Date/Time for context is: ${new Date().toISOString()}**. Use this to resolve relative times like "tomorrow" or "in 5 minutes".
- If the request is to change the wallpaper, create a rich, descriptive image generation prompt from the user's idea.
- If the request is a general question, a greeting, or something that doesn't fit an action, set the action to 'none' and provide a helpful, conversational answer in the 'response' field.
- For all actions, including 'none', you MUST provide a friendly 'response' for the user. For example, if setting a timer, say "OK, setting a timer for 5 minutes." or if creating an event, say "I've added 'Team Meeting' to your schedule."
- You must always respond with a valid JSON object matching the provided schema.${localContext}`;

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: query,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: assistantActionSchema,
                },
            });
            
            const jsonText = response.text.trim();
            const actionData = JSON.parse(jsonText);

            if (actionData.action === 'change_wallpaper_generate' && actionData.parameters?.prompt) {
                const imageUrl = await geminiService.generateImage(actionData.parameters.prompt);
                return {
                    ...actionData,
                    action: 'set_wallpaper_url',
                    parameters: { url: imageUrl }
                };
            }
            
            if (actionData.action === 'none') {
                // The model identified this as a general query. Let's get a grounded answer.
                return geminiService.groundedSearch(query);
            }

            return actionData;

        } catch (e) {
            console.error("Assistant command processing failed, falling back to grounded search.", e);
            return geminiService.groundedSearch(query);
        }
    },
    
    generatePresentationSlides: async (prompt: string): Promise<Omit<Slide, 'id'>[]> => {
        // Step 1: Get grounded information
        const groundedInfo = await geminiService.groundedSearch(`Factual information for a presentation on: ${prompt}`);
        const context = groundedInfo.text;
        
        // Step 2: Generate slides with the grounded context
        const systemInstruction = `You are an AI presentation designer. Based on the user's prompt and the provided context, create a series of slides. Each slide should have a background color and a few text elements with specified positions, sizes, and styles.
- Create a title slide and 2-3 content slides.
- Use the provided context to ensure the information is accurate and up-to-date.
- Keep text concise and to the point.
- Use a professional and clean color palette.
- Ensure text elements do not overlap and are well-positioned within the 1280x720 slide dimensions.
- You must return only a valid JSON object that conforms to the provided schema. No other text or explanation.

CONTEXT:
${context}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Create a short presentation about: "${prompt}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: presentationSchema,
            },
        });

        try {
            const jsonText = response.text.trim();
            const data = JSON.parse(jsonText);
            return data as Omit<Slide, 'id'>[];
        } catch (e) {
            console.error("Failed to parse presentation JSON:", e);
            throw new Error("Failed to generate presentation slides.");
        }
    },
};