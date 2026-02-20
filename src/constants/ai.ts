export const AI_PROVIDERS = [
  { id: 'openai', name: 'OpenAI (国际版)', defaultModel: 'gpt-4o' },
  { id: 'anthropic', name: 'Anthropic (Claude)', defaultModel: 'claude-3-5-sonnet-20240620' },
  { id: 'gemini', name: 'Google Gemini', defaultModel: 'gemini-1.5-pro' },
  { id: 'deepseek', name: 'DeepSeek (深度求索)', defaultModel: 'deepseek-chat' },
  { id: 'moonshot', name: 'Moonshot AI (Kimi)', defaultModel: 'moonshot-v1-8k' },
  { id: 'qwen', name: 'Alibaba Qwen (通义千问)', defaultModel: 'qwen-turbo' },
  { id: 'zhipu', name: 'Zhipu GLM (智谱清言)', defaultModel: 'glm-4' },
  { id: 'custom', name: '自定义接口 (Custom OpenAI Compatible)', defaultModel: '' },
];

export const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet (Best for Logic/Coding)' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Most Powerful)' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fastest)' },
  ],
  gemini: [
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Latest)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast)' },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek V3 (Chat)' },
    { value: 'deepseek-coder', label: 'DeepSeek Coder V2' },
  ],
  moonshot: [
    { value: 'moonshot-v1-8k', label: 'Moonshot V1 (8k Context)' },
    { value: 'moonshot-v1-32k', label: 'Moonshot V1 (32k Context)' },
    { value: 'moonshot-v1-128k', label: 'Moonshot V1 (128k Context)' },
  ],
  qwen: [
    { value: 'qwen-turbo', label: 'Qwen Turbo' },
    { value: 'qwen-plus', label: 'Qwen Plus' },
    { value: 'qwen-max', label: 'Qwen Max' },
    { value: 'qwen-long', label: 'Qwen Long (Long Context)' },
  ],
  zhipu: [
    { value: 'glm-4', label: 'GLM-4 (Latest)' },
    { value: 'glm-4-air', label: 'GLM-4 Air' },
    { value: 'glm-4-flash', label: 'GLM-4 Flash' },
    { value: 'glm-3-turbo', label: 'GLM-3 Turbo' },
  ],
};
