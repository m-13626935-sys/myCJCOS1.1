import { GoogleGenAI, GenerateContentResponse, Chat, Type } from "@google/genai";
import type { ChatMessage, GroundingChunk, DictionaryEntry, EnglishDictionaryEntry, CalendarEvent, Slide } from '../types';

if (!process.env.API_KEY) {
    throw new Error("未设置 API_KEY 环境变量");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const dictionarySchema = {
  type: Type.OBJECT,
  properties: {
    word: { type: Type.STRING, description: "查询的词语" },
    pronunciation: { type: Type.STRING, description: "该词语的拼音" },
    definition: { type: Type.STRING, description: "该词语的主要释义" },
    emotionalSpectrum: {
      type: Type.ARRAY,
      description: "该词语的情感权重分析",
      items: {
        type: Type.OBJECT,
        properties: {
          emotion: { type: Type.STRING, description: "情感标签 (例如: 喜悦, 悲伤, 愤怒)" },
          intensity: { type: Type.NUMBER, description: "情感强度 (0-100)" }
        },
        required: ['emotion', 'intensity']
      }
    },
    contextualExamples: {
      type: Type.ARRAY,
      description: "在不同语境下的例句",
      items: {
        type: Type.OBJECT,
        properties: {
          context: { type: Type.STRING, description: "语境分类 (例如: 商务沟通, 日常对话, 文学创作)" },
          example: { type: Type.STRING, description: "在该语境下的例句" }
        },
        required: ['context', 'example']
      }
    },
    etymology: { type: Type.STRING, description: "关于词源或演变的简短故事" },
    relatedWords: {
      type: Type.ARRAY,
      description: "相关的词语 (同义词、反义词等)",
      items: { type: Type.STRING }
    }
  },
  required: ['word', 'pronunciation', 'definition', 'emotionalSpectrum', 'contextualExamples', 'etymology', 'relatedWords']
};

const englishDictionarySchema = {
  type: Type.OBJECT,
  properties: {
    word: { type: Type.STRING, description: "The English word being looked up." },
    ipa: { type: Type.STRING, description: "The International Phonetic Alphabet (IPA) pronunciation." },
    definition: { type: Type.STRING, description: "The primary definition of the word." },
    wordForms: {
        type: Type.ARRAY,
        description: "Different forms of the word (e.g., plural, past tense, comparative).",
        items: { type: Type.STRING }
    },
    exampleSentences: {
      type: Type.ARRAY,
      description: "Example sentences using the word.",
      items: { type: Type.STRING }
    },
    etymology: { type: Type.STRING, description: "A brief history or origin of the word." },
    synonyms: {
      type: Type.ARRAY,
      description: "Words with similar meanings.",
      items: { type: Type.STRING }
    },
    antonyms: {
        type: Type.ARRAY,
        description: "Words with opposite meanings.",
        items: { type: Type.STRING }
    }
  },
  required: ['word', 'ipa', 'definition', 'wordForms', 'exampleSentences', 'etymology', 'synonyms', 'antonyms']
};

const assistantActionSchema = {
    type: Type.OBJECT,
    properties: {
        action: {
            type: Type.STRING,
            description: "The specific action to take. Must be one of: 'create_event', 'set_timer', 'change_wallpaper_generate', or 'none'.",
            enum: ['create_event', 'set_timer', 'change_wallpaper_generate', 'none']
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
                prompt: { type: Type.STRING, description: "A detailed, creative prompt for generating an image to be used as a wallpaper." }
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

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: historyForCreate,
            config: {
                ...(systemInstruction && { systemInstruction }),
            },
        });

        return await chat.sendMessageStream({ message });
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

    groundedSearch: async (query: string): Promise<{ text: string; sources: GroundingChunk[] }> => {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: query,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text;
        const sources: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        
        return { text, sources };
    },
    
    generateContentMultiModal: async (prompt: string, file: { data: string; mimeType: string }): Promise<{ text: string }> => {
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

    summarizeText: async (text: string): Promise<{ text: string }> => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Please summarize the following presentation content:\n\n${text}`,
            config: {
                systemInstruction: "You are an expert summarizer. Your task is to provide a short, clear, and concise summary of the given presentation text. Extract the key points and main ideas. The summary should be easy to understand for a general audience."
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

    getDictionaryEntry: async (word: string): Promise<DictionaryEntry> => {
        const systemInstruction = `你是一个严格的 JSON API 端点。你的唯一任务是根据提供的模式分析一个中文词语，并返回一个 JSON 对象。
核心规则：
1. **绝对禁止对话**：不要打招呼，不要解释，不要道歉。
2. **仅限 JSON 输出**：你的全部响应必须是一个严格符合所提供 JSON 模式的单个 JSON 对象。响应前后不能有任何额外的文本、注释或标记。
3. **处理无效输入**：如果用户输入不是一个真实、可查找的中文词语（例如，它是一个人的名字、无意义的字符、拼音或外语），你**必须**返回一个有效的 JSON 对象。在此对象中：
    * \`definition\` 字段必须准确地设为字符串："未找到该词语的释义。"
    * \`word\` 字段应设为用户的原始输入。
    * 所有其他字符串字段应设为空字符串 \`""\`。
    * 所有数组字段应设为空数组 \`[]\`。
4. **严格遵守模式**：任何情况下都不得偏离所提供的 JSON \`responseSchema\`。
不遵守这些规则将导致系统失败。`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: word,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: dictionarySchema,
            },
        });

        try {
            const jsonText = response.text.trim();
            const data = JSON.parse(jsonText);
            return data as DictionaryEntry;
        } catch (e) {
            console.error("Failed to parse dictionary entry JSON:", e);
            throw new Error("error_chinese_dictionary_parse");
        }
    },

    getEnglishDictionaryEntry: async (word: string): Promise<EnglishDictionaryEntry> => {
        const systemInstruction = `You are a strict JSON API endpoint. Your sole task is to analyze an English word and return a JSON object based on the provided schema.
Core Rules:
1.  **NO DIALOGUE, EVER**: Do not greet, explain, or apologize.
2.  **JSON-ONLY OUTPUT**: Your entire response MUST be a single JSON object that strictly adheres to the provided JSON schema. No extra text, comments, or markdown before or after the response.
3.  **HANDLE INVALID INPUT**: If the user input is not a real, lookup-able English word (e.g., it's a name, nonsense characters, or a foreign word), you **MUST** return a valid JSON object. In this object:
    *   The \`definition\` field must be set precisely to the string: "No definition found for this word."
    *   The \`word\` field should be set to the user's original input.
    *   All other string fields should be empty strings \`""\`۔
    *   All array fields should be empty arrays \`[]\`۔
4.  **STRICT SCHEMA ADHERENCE**: Do not deviate from the provided JSON \`responseSchema\` under any circumstances.
Failure to follow these rules will result in system failure.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Provide a detailed dictionary entry for the English word: "${word}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: englishDictionarySchema,
            },
        });

        try {
            const jsonText = response.text.trim();
            const data = JSON.parse(jsonText);
            return data as EnglishDictionaryEntry;
        } catch (e) {
            console.error("Failed to parse English dictionary entry JSON:", e);
            throw new Error("error_english_dictionary_parse");
        }
    },
    
    processAssistantCommand: async (query: string): Promise<any> => {
        const systemInstruction = `You are a helpful and clever OS assistant. Your goal is to understand user requests and translate them into structured actions.
- Analyze the user's query to determine if it matches one of the available actions: creating a calendar event, setting a timer, or changing the wallpaper by generating an image.
- **Current Date/Time for context is: ${new Date().toISOString()}**. Use this to resolve relative times like "tomorrow" or "in 5 minutes".
- If the request is to change the wallpaper, create a rich, descriptive image generation prompt from the user's idea.
- If the request is a general question, a greeting, or something that doesn't fit an action, set the action to 'none' and provide a helpful, conversational answer in the 'response' field.
- For all actions, including 'none', you MUST provide a friendly 'response' for the user. For example, if setting a timer, say "OK, setting a timer for 5 minutes." or if creating an event, say "I've added 'Team Meeting' to your schedule."
- You must always respond with a valid JSON object matching the provided schema.`;

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
                return { text: actionData.response, sources: [] };
            }

            return actionData;

        } catch (e) {
            console.error("Assistant command processing failed, falling back to grounded search.", e);
            return geminiService.groundedSearch(query);
        }
    },
    
    generatePresentationSlides: async (prompt: string): Promise<Omit<Slide, 'id'>[]> => {
        const systemInstruction = `You are an AI presentation designer. Based on the user's prompt, create a series of slides. Each slide should have a background color and a few text elements with specified positions, sizes, and styles.
- Create a title slide and 2-3 content slides.
- Keep text concise and to the point.
- Use a professional and clean color palette.
- Ensure text elements do not overlap and are well-positioned within the 1280x720 slide dimensions.
- You must return only a valid JSON object that conforms to the provided schema. No other text or explanation.`;

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