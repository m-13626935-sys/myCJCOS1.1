
import React from 'react';
import type { AppProps } from '../types';
import { DIGITAL_HUMAN_DATA } from '../services/digitalHumans';
import { useLanguage } from '../contexts/LanguageContext';

interface DigitalHumanSelectorProps extends Partial<AppProps> {}

const DigitalHumanSelectorApp: React.FC<DigitalHumanSelectorProps> = ({ launchApp, close }) => {
  const { t } = useLanguage();

  const handleSelect = (human: typeof DIGITAL_HUMAN_DATA[0]) => {
    if (launchApp && close) {
      launchApp('gemini-chat-window', {
        title: t(human.name),
        props: {
          systemInstruction: t(human.systemInstruction),
          initialMessage: t(human.initialMessage),
          placeholder: t(human.placeholder),
          sessionId: `digital-human-${human.id}`,
        },
      });
      close();
    }
  };

  return (
    <div className="h-full flex flex-col text-outline">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">{t('app_digital_human_chat')}</h1>
        <p className="opacity-70 mt-1">{t('dh_selector_subtitle')}</p>
      </div>
      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pr-2 -mr-4 pb-2">
        {DIGITAL_HUMAN_DATA.map(human => (
          <div
            key={human.id}
            className="bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-xl p-6 flex flex-col ring-1 ring-black/10 dark:ring-white/10 shadow-lg transition-all duration-300 hover:ring-black/50 dark:hover:ring-white/20 hover:shadow-2xl hover:-translate-y-1"
          >
            <h2 className="text-lg font-semibold mb-2">{t(human.name)}</h2>
            <p className="text-sm flex-grow mb-4">{t(human.description)}</p>
            <button
              onClick={() => handleSelect(human)}
              className="mt-auto w-full py-2 px-4 bg-black/20 dark:bg-white/20 text-outline font-semibold rounded-lg ring-1 ring-inset ring-white/30 dark:ring-black/30 shadow-lg hover:bg-black/30 dark:hover:bg-white/30 active:shadow-inner active:scale-95 transition-all duration-150"
            >
              {t('dh_start_chat')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DigitalHumanSelectorApp;