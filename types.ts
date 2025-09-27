import React from 'react';

export type Language = 'zh' | 'en' | 'ms';
export type TimeFormat = '12h' | '24h';
export type ColorMode = 'dark' | 'light' | 'gradient';

export interface GradientConfig {
  from: string; // hex color
  to: string;   // hex color
  angle: number;
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
  // Fix: Add missing properties for GlassButtonApp.tsx
  setButtonOpacity?: (opacity: number) => void;
  buttonOpacity?: number;
  // AI Settings props
  aiSettings?: AISettings;
  setAiSettings?: (settings: AISettings) => void;
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
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface DictionaryEntry {
  word: string;
  pronunciation: string;
  definition: string;
  emotionalSpectrum: { emotion: string; intensity: number }[];
  contextualExamples: { context: string; example: string }[];
  etymology: string;
  relatedWords: string[];
}

export interface EnglishDictionaryEntry {
  word: string;
  ipa: string; // International Phonetic Alphabet
  definition: string;
  wordForms: string[];
  exampleSentences: string[];
  etymology: string;
  synonyms: string[];
  antonyms: string[];
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