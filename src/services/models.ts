import { AIProvider } from '../types';
import { PROVIDER_ENDPOINTS } from '../constants/endpoints';

export type ModelOption = { value: string; label: string };

const normalizeAndDedupe = (options: ModelOption[]) => {
  const seen = new Set<string>();
  const result: ModelOption[] = [];
  for (const opt of options) {
    const key = opt.value.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push({ value: key, label: opt.label || key });
  }
  return result;
};

const sortByRecentishId = (a: ModelOption, b: ModelOption) => {
  return b.value.localeCompare(a.value);
};

export async function fetchModelOptions(params: {
  aiProvider: AIProvider;
  apiKey: string;
  customEndpoint?: string;
}): Promise<ModelOption[]> {
  const { aiProvider, apiKey, customEndpoint } = params;

  if (!apiKey && aiProvider !== 'custom') {
    throw new Error('缺少 API Key');
  }

  if (aiProvider === 'gemini') {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Gemini models 拉取失败: ${response.status} ${text}`);
    }

    const data = await response.json();
    const models = Array.isArray(data?.models) ? data.models : [];
    const options = models
      .map((m: any) => {
        const name = typeof m?.name === 'string' ? m.name : '';
        const id = name.startsWith('models/') ? name.slice('models/'.length) : name;
        const displayName = typeof m?.displayName === 'string' ? m.displayName : '';
        return {
          value: id,
          label: displayName ? `${displayName} (${id})` : id,
        };
      })
      .filter((o: ModelOption) => o.value);

    return normalizeAndDedupe(options).sort(sortByRecentishId);
  }

  if (aiProvider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'dangerously-allow-browser': 'true',
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Anthropic models 拉取失败: ${response.status} ${text}`);
    }

    const data = await response.json();
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : [];
    const options = list
      .map((m: any) => {
        const id = typeof m?.id === 'string' ? m.id : typeof m?.name === 'string' ? m.name : '';
        const displayName = typeof m?.display_name === 'string' ? m.display_name : typeof m?.displayName === 'string' ? m.displayName : '';
        return {
          value: id,
          label: displayName ? `${displayName} (${id})` : id,
        };
      })
      .filter((o: ModelOption) => o.value);

    return normalizeAndDedupe(options).sort(sortByRecentishId);
  }

  const endpoint =
    aiProvider === 'custom'
      ? (customEndpoint || '').replace(/\/$/, '')
      : (PROVIDER_ENDPOINTS[aiProvider] || '').replace(/\/$/, '');

  if (!endpoint) {
    throw new Error('未找到模型列表端点');
  }

  const response = await fetch(`${endpoint}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Models 拉取失败: ${response.status} ${text}`);
  }

  const data = await response.json();
  const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : [];
  const options = list
    .map((m: any) => {
      const id = typeof m?.id === 'string' ? m.id : '';
      return { value: id, label: id };
    })
    .filter((o: ModelOption) => o.value);

  return normalizeAndDedupe(options).sort(sortByRecentishId);
}

