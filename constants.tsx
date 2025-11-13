import React from 'react';
import type { AppDefinition, AppCategory, WidgetDefinition, Language } from './types';
import GeminiChatApp from './apps/GeminiChatApp';
import ImageStudioApp from './apps/ImageStudioApp';
import ClockApp from './components/StopwatchApp';
import DigitalHumanSelectorApp from './apps/DigitalHumanSelectorApp';
import CalculatorApp from './apps/CalculatorApp';
import SettingsApp from './apps/SettingsApp';
import ScheduleApp from './apps/ScheduleApp';
import SlidesApp from './apps/SlidesApp';
import AddApp from './apps/AddApp';
import TicTacToeApp from './apps/TicTacToeApp';
import ChineseDictionaryApp from './apps/ChineseDictionaryApp';
import EnglishDictionaryApp from './apps/EnglishDictionaryApp';
import AboutApp from './apps/AboutApp';
import {
  ScheduleWidget,
  CalculatorWidget,
  TimerWidget,
} from './widgets/index';

export const EVENT_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#ec4899'];

export const CATEGORY_ORDER: AppCategory[] = [
    'category_ai',
    'category_education',
    'category_tools',
    'category_custom',
];

// For language selection dropdowns
export const LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
    { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
];


export const APPS: AppDefinition[] = [
  // AI
  {
    id: 'digital-human-selector',
    name: 'app_digital_human_chat',
    component: DigitalHumanSelectorApp,
    category: 'category_ai',
    defaultSize: { width: 720, height: 540 },
    isAiFeature: true,
  },
  {
    id: 'slides',
    name: 'app_slides',
    component: SlidesApp,
    category: 'category_ai',
    defaultSize: { width: 1280, height: 800 },
    isAiFeature: true,
  },
  {
    id: 'image-studio',
    name: 'app_image_studio',
    component: ImageStudioApp,
    category: 'category_ai',
    isAiFeature: true,
  },
  {
    id: 'gemini-chat-window',
    name: 'app_chat',
    component: GeminiChatApp,
    category: 'category_ai',
    defaultSize: { width: 500, height: 700 },
    isAiFeature: true,
  },

  // Education
  {
    id: 'chinese-dictionary',
    name: 'app_chinese_dictionary',
    component: ChineseDictionaryApp,
    category: 'category_education',
    defaultSize: { width: 600, height: 750 },
  },
  {
    id: 'english-dictionary',
    name: 'app_english_dictionary',
    component: EnglishDictionaryApp,
    category: 'category_education',
    defaultSize: { width: 600, height: 750 },
  },

  // Tools
  {
    id: 'about',
    name: 'app_about',
    component: AboutApp,
    category: 'category_tools',
    defaultSize: { width: 500, height: 450 },
  },
  {
    id: 'calculator',
    name: 'app_calculator',
    component: CalculatorApp,
    category: 'category_tools',
    defaultSize: { width: 340, height: 520 },
  },
  {
    id: 'tictactoe',
    name: 'app_tictactoe',
    component: TicTacToeApp,
    category: 'category_tools',
    defaultSize: { width: 400, height: 500 },
  },
  {
    id: 'schedule',
    name: 'app_schedule',
    component: ScheduleApp,
    category: 'category_tools',
    defaultSize: { width: 900, height: 650 },
  },
  {
    id: 'settings',
    name: 'app_settings',
    component: SettingsApp,
    category: 'category_tools',
    defaultSize: { width: 720, height: 580 },
  },
  {
    id: 'clock',
    name: 'app_clock',
    component: ClockApp,
    category: 'category_tools',
  },
  {
    id: 'add-app',
    name: 'app_add_app',
    component: AddApp,
    category: 'category_tools',
    defaultSize: { width: 600, height: 450 },
  },
];

export const WIDGETS: WidgetDefinition[] = [
  {
    id: 'schedule',
    name: 'widget_schedule_name',
    component: ScheduleWidget,
    defaultSize: { width: 280, height: 320 },
  },
  {
    id: 'calculator',
    name: 'widget_calculator_name',
    component: CalculatorWidget,
    defaultSize: { width: 260, height: 380 },
  },
  {
    id: 'timer',
    name: 'widget_timer_name',
    component: TimerWidget,
    defaultSize: { width: 220, height: 140 },
  },
];