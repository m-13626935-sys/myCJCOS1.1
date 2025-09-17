
import React from 'react';
import type { AppDefinition, AppCategory, WidgetDefinition, Language } from './types';
import GeminiChatApp from './apps/GeminiChatApp';
import ImageStudioApp from './apps/ImageStudioApp';
import ClockApp from './apps/StopwatchApp';
import DigitalHumanSelectorApp from './apps/DigitalHumanSelectorApp';
import ChineseDictionaryApp from './apps/ChineseDictionaryApp';
import EnglishDictionaryApp from './apps/EnglishDictionaryApp';
import AboutApp from './apps/AboutApp';
import CalculatorApp from './apps/CalculatorApp';
import SettingsApp from './apps/SettingsApp';
import TicTacToeApp from './apps/TicTacToeApp';
import BlackboardApp from './apps/BlackboardApp';
import ScheduleApp from './apps/ScheduleApp';
import SlidesApp from './apps/SlidesApp';
import {
  ScheduleWidget,
  CalculatorWidget,
  TimerWidget,
} from './widgets/index';

export const EVENT_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#ec4899'];

export const CATEGORY_ORDER: AppCategory[] = [
    'category_ai',
    'category_games_entertainment',
    'category_education',
    'category_google',
    'category_tools',
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
    id: 'gemini-chat-window',
    name: 'app_chat',
    component: GeminiChatApp,
    defaultSize: { width: 500, height: 700 },
    isAiFeature: true,
  },
  {
    id: 'deepseek',
    name: 'app_deepseek',
    url: 'https://www.deepseek.com/',
    category: 'category_ai',
    icon: 'https://registry.npmmirror.com/@lobehub/icons-static-png/1.61.0/files/dark/deepseek-color.png',
  },
  {
    id: 'chatgpt',
    name: 'app_chatgpt',
    url: 'https://chatgpt.com/',
    category: 'category_ai',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/ChatGPT-Logo.svg',
  },

  // Tools
  {
    id: 'slides',
    name: 'app_slides',
    component: SlidesApp,
    category: 'category_tools',
    defaultSize: { width: 1280, height: 800 },
    isAiFeature: true,
  },
  {
    id: 'image-studio',
    name: 'app_image_studio',
    component: ImageStudioApp,
    category: 'category_tools',
    isAiFeature: true,
  },
  {
    id: 'clock',
    name: 'app_clock',
    component: ClockApp,
    category: 'category_tools',
  },
  {
    id: 'schedule',
    name: 'app_schedule',
    component: ScheduleApp,
    category: 'category_tools',
    defaultSize: { width: 900, height: 650 },
  },
  {
    id: 'calculator',
    name: 'app_calculator',
    component: CalculatorApp,
    category: 'category_tools',
    defaultSize: { width: 340, height: 520 },
  },
  {
    id: 'blackboard',
    name: 'app_blackboard',
    component: BlackboardApp,
    category: 'category_tools',
    defaultSize: { width: 800, height: 600 },
  },
  {
    id: 'settings',
    name: 'app_settings',
    component: SettingsApp,
    category: 'category_tools',
    defaultSize: { width: 720, height: 580 },
  },
  {
    id: 'about',
    name: 'app_about',
    component: AboutApp,
    category: 'category_tools',
    defaultSize: { width: 480, height: 520 },
  },
  {
    id: 'gemma',
    name: 'app_gamma',
    url: 'https://gamma.app/',
    category: 'category_tools',
    icon: 'https://store-images.s-microsoft.com/image/apps.53673.13800228740496758.b926c1b0-f31a-4a9b-b1b3-88dd15f27137.a0a38389-643f-48ed-9379-92a9fb5a7c94?h=210',
  },
  {
    id: 'canva',
    name: 'app_canva',
    url: 'https://www.canva.com/',
    category: 'category_tools',
    icon: 'https://upload.wikimedia.org/wikipedia/en/b/bb/Canva_Logo.svg',
  },
  {
    id: 'whatsapp',
    name: 'app_whatsapp',
    url: 'https://web.whatsapp.com/',
    category: 'category_tools',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
  },

  // Google
  {
    id: 'google-photos',
    name: 'app_google_photos',
    url: 'https://photos.google.com/',
    category: 'category_google',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Photos_icon_%282020%29.svg',
  },
  {
    id: 'google-translate',
    name: 'app_google_translate',
    url: 'https://translate.google.com/?sl=en&tl=zh-CN&op=translate',
    category: 'category_google',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Google_Translate_logo.svg',
  },
  {
    id: 'google-docs',
    name: 'app_google_docs',
    url: 'https://docs.google.com/',
    category: 'category_google',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg',
  },
  {
    id: 'google-slides',
    name: 'app_google_slides',
    url: 'https://slides.google.com/',
    category: 'category_google',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Google_Slides_logo_%282014-2020%29.svg',
  },
  {
    id: 'google-sheets',
    name: 'app_google_sheets',
    url: 'https://sheets.google.com/',
    category: 'category_google',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg',
  },
  {
    id: 'google-drive',
    name: 'app_google_drive',
    url: 'https://drive.google.com/drive/home?lfhs=2',
    category: 'category_google',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg',
  },
  {
    id: 'youtube',
    name: 'app_youtube',
    url: 'https://www.youtube.com/',
    category: 'category_google',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
  },
  {
    id: 'google-contacts',
    name: 'app_google_contacts',
    url: 'https://contacts.google.com/',
    category: 'category_google',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Google_Contacts_icon_%282022%29.svg',
  },
  {
    id: 'google-calendar',
    name: 'app_google_calendar',
    url: 'https://calendar.google.com',
    category: 'category_google',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg',
  },
  {
    id: 'gmail',
    name: 'app_gmail',
    url: 'https://mail.google.com/mail/u/0/#inbox',
    category: 'category_google',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
  },
  {
    id: 'google-meet',
    name: 'app_google_meet',
    url: 'https://meet.google.com/',
    category: 'category_google',
    icon: 'https://cdn4.iconfinder.com/data/icons/logos-brands-in-colors/48/google-meet-512.png',
  },

  // Education
  {
    id: 'chinesedictionary',
    name: 'app_chinese_dictionary',
    component: ChineseDictionaryApp,
    category: 'category_education',
    defaultSize: { width: 520, height: 720 },
  },
  {
    id: 'english-dictionary',
    name: 'app_english_dictionary',
    component: EnglishDictionaryApp,
    category: 'category_education',
    defaultSize: { width: 520, height: 720 },
  },
  {
    id: 'google-classroom',
    name: 'app_google_classroom',
    url: 'https://classroom.google.com/',
    category: 'category_education',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Google_Classroom_Logo.png',
  },
  {
    id: 'blooket',
    name: 'app_blooket',
    url: 'https://www.blooket.com/',
    category: 'category_education',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Blooket_logo.png',
  },
  {
    id: 'ains',
    name: 'app_ains',
    url: 'https://ains.moe.gov.my/',
    category: 'category_education',
    icon: 'https://ains.moe.gov.my/assets/jombaca-logo-afef1c3b.png',
  },
  {
    id: 'buku-teks',
    name: 'app_buku_teks',
    url: 'https://lookerstudio.google.com/u/0/reporting/19d52769-d10b-40c7-a11b-720cf7186ca9/page/p_cpue3fjz4c',
    category: 'category_education',
  },
  {
    id: 'delima',
    name: 'app_delima',
    url: 'https://d2.delima.edu.my',
    category: 'category_education',
    icon: 'https://d2.delima.edu.my/assets/images/pages/login/delima-2.svg',
  },
  {
    id: 'ekamus',
    name: 'app_ekamus',
    url: 'https://www.ekamus.info/',
    category: 'category_education',
    icon: 'https://play-lh.googleusercontent.com/ZPMVBamh0W-jb767iBwI54qn8OCs5PSVYmt37PZ_N4bhWHOGCV62Aot4eyIJSh3lT4w=s48-rw',
  },

  // Games & Entertainment
  {
    id: 'tic-tac-toe',
    name: 'app_tic_tac_toe',
    component: TicTacToeApp,
    category: 'category_games_entertainment',
    defaultSize: { width: 400, height: 480 },
  },
  {
    id: 'douyin',
    name: 'app_douyin',
    url: 'https://www.douyin.com/',
    category: 'category_games_entertainment',
    icon: 'https://cdn4.iconfinder.com/data/icons/social-media-flat-7/64/Social-media_Tiktok-512.png',
  },
  {
    id: 'minecraft',
    name: 'app_minecraft',
    url: 'https://www.mc.js.cool/mc/1.8wasm/',
    category: 'category_games_entertainment',
    icon: 'https://img.astone.cc/wp-content/uploads/2024/07/wodeshijielogo.png',
  },
  {
    id: 'spotify',
    name: 'app_spotify',
    url: 'https://open.spotify.com/',
    category: 'category_games_entertainment',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
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