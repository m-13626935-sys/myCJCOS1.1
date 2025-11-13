import React from 'react';

export type Language = 'zh' | 'en' | 'ms';
export type TimeFormat = '12h' | '24h';
export type ColorMode = 'dark' | 'light' | 'gradient' | 'theme' | 'adaptive';

export interface GradientConfig {
  from: string; // hex color
  to: string;   // hex color
  angle: number;
}

export interface ThemeColors {
  primaryBG: string;
  highlightBG: string;
  gradientStart: string;
  gradientEnd: string;
  borderColor: string;
  shadowColor: string;
  textOnBG: string;
  textShadowOnBG: string;
  accentShadow: string;
}

export type ButtonBackground = string | GradientConfig; // string is for "r, g, b"

export interface AISettings {
  isEnabled: boolean;
  memoryEnabled: boolean;
  appIntegrationsEnabled: boolean;
}

export interface AppProps {
  close: () => void;
  launchApp: (appId: string, options?: { props?: Record<string, any>, title?: string }) => void;
  setWallpaper?: (url: string) => void;
  // Text props
  setTextColor?: (color: string) => void;
  textColor?: string;
  setTextShadow?: (color: string) => void;
  textShadow?: string;
  // Language props
  setLanguage?: (language: Language) => void;
  language?: Language;
  // Time format props
  setTimeFormat?: (format: TimeFormat) => void;
  timeFormat?: TimeFormat;
  // System theme props
  setColorMode?: (mode: ColorMode) => void;
  colorMode?: ColorMode;
  setSystemBackgroundGradient?: (gradient: GradientConfig) => void;
  systemBackgroundGradient?: GradientConfig;
  setThemeColors?: (colors: ThemeColors) => void;
  themeColors?: ThemeColors | null;
  // Fix: Add missing properties for GlassButtonApp.tsx
  setButtonOpacity?: (opacity: number) => void;
  buttonOpacity?: number;
  // AI Settings props
  aiSettings?: AISettings;
  setAiSettings?: (settings: AISettings) => void;
  // Dock settings
  isAutoHideDockEnabled?: boolean;
  setIsAutoHideDockEnabled?: (enabled: boolean) => void;
  autoHideDuration?: number;
  setAutoHideDuration?: (duration: number) => void;
  // Inspirational Copy props
  inspirationalCopy?: string | null;
  setInspirationalCopy?: (copy: string) => void;
  // Auto Theme props
  isAutoThemeEnabled?: boolean;
  setIsAutoThemeEnabled?: (enabled: boolean) => void;
}

export type AppCategory = string; // Changed to string to support translation keys

export interface AppDefinition {
  id: string;
  name: string; // Will be a translation key
  category?: AppCategory; // Will be a translation key
  component?: React.ComponentType<Partial<AppProps & any>>;
  url?: string;
  icon?: string;
  defaultSize?: { width: number; height: number };
  isAiFeature?: boolean;
}

export interface WindowInstance {
  id: string;
  appId: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMaximized: boolean;
  isMinimized: boolean;
  isClosing?: boolean;
  isMinimizing?: boolean;
  isRestoring?: boolean;
  snapState?: { layout: string; area: string } | null;
  props?: Record<string, any>;
  previousState?: {
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
}

export interface WidgetDefinition {
  id: string;
  name: string; // Translation key
  component: React.ComponentType<Partial<AppProps>>;
  defaultSize: { width: number; height: number };
}

export interface DesktopWidgetInstance {
  instanceId: string;
  widgetId: string;
  position: { x: number; y: number };
  zIndex: number;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    sources?: GroundingChunk[];
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface BilingualDictionaryEntry {
    word: string;
    language: 'zh' | 'en';
    pronunciation: string; // Pinyin or IPA
    primaryDefinition: string; // Definition in the original language
    secondaryDefinition: string; // Definition in the other language
    examples: {
        original: string;
        translation: string;
    }[];
    etymology: string;
    relatedWords?: string[]; // Synonyms, antonyms etc.
}


export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  location?: string;
  notes?: string;
  color: string;
}

// --- SLIDES APP TYPES ---
export interface TextStyle {
    fontSize: number;
    fontWeight: number;
    color: string;
}

export interface PresentationElement {
    id: string;
    type: 'text' | 'image';
    x: number;
    y: number;
    width: number;
    height: number;
    style?: Partial<TextStyle>;
    content?: string; // For text
    src?: string; // For image
}

export interface Slide {
    id: string;
    backgroundColor: string;
    elements: PresentationElement[];
}

export interface Presentation {
    slides: Slide[];
    width: number;
    height: number;
}

// --- MEMORY HUB TYPES ---
export interface Memory {
  id: string;
  content: string;
  type: 'text' | 'image' | 'link';
  tags: string[];
  createdAt: string; // ISO String
  src?: string; // for image or link URL
}

// --- AI SEARCH TYPES ---
export interface AiSearchResultText {
  type: 'text';
  text: string;
  sources: GroundingChunk[];
}

export type AiSearchResult = AiSearchResultText;