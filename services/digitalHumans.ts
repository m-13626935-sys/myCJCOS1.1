
export interface DigitalHuman {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  initialMessage: string;
  placeholder: string;
}

export const DIGITAL_HUMAN_DATA: DigitalHuman[] = [
  {
    id: 'teacher',
    name: 'dh_teacher_name',
    description: 'dh_teacher_desc',
    systemInstruction: 'dh_teacher_sys',
    initialMessage: 'dh_teacher_init',
    placeholder: 'dh_teacher_placeholder'
  },
  {
    id: 'creative_partner',
    name: 'dh_creative_partner_name',
    description: 'dh_creative_partner_desc',
    systemInstruction: 'dh_creative_partner_sys',
    initialMessage: 'dh_creative_partner_init',
    placeholder: 'dh_creative_partner_placeholder'
  },
  {
    id: 'life_assistant',
    name: 'dh_life_assistant_name',
    description: 'dh_life_assistant_desc',
    systemInstruction: 'dh_life_assistant_sys',
    initialMessage: 'dh_life_assistant_init',
    placeholder: 'dh_life_assistant_placeholder'
  },
  {
    id: 'word_formation_assistant',
    name: 'dh_word_formation_assistant_name',
    description: 'dh_word_formation_assistant_desc',
    systemInstruction: 'dh_word_formation_assistant_sys',
    initialMessage: 'dh_word_formation_assistant_init',
    placeholder: 'dh_word_formation_assistant_placeholder'
  },
  {
    id: 'prompt_assistant',
    name: 'dh_prompt_assistant_name',
    description: 'dh_prompt_assistant_desc',
    systemInstruction: 'dh_prompt_assistant_sys',
    initialMessage: 'dh_prompt_assistant_init',
    placeholder: 'dh_prompt_assistant_placeholder'
  }
];
