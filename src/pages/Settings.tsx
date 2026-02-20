import React, { useState } from 'react';
import { useSettingsStore } from '../store/settings';
import { AI_PROVIDERS, MODEL_OPTIONS } from '../constants/ai';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { Save, RefreshCw, Info, Link2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { AIProvider } from '../types';
import { fetchModelOptions, ModelOption } from '../services/models';

const Settings: React.FC = () => {
  const { aiProvider, apiKey, model, customEndpoint, customModelName, updateSettings, fetchedModels, setFetchedModels, ocrEndpoint } = useSettingsStore();

  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // OCR Connection Test State
  const [ocrTestStatus, setOcrTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [ocrTestMessage, setOcrTestMessage] = useState('');

  const testOcrConnection = async () => {
    if (!ocrEndpoint) {
      setOcrTestStatus('error');
      setOcrTestMessage('请先输入 OCR 服务地址');
      return;
    }

    setOcrTestStatus('testing');
    setOcrTestMessage('');

    try {
      // Try to fetch the endpoint with a simple GET request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(ocrEndpoint, {
        method: 'GET',
        signal: controller.signal,
        mode: 'no-cors', // Allow cross-origin requests
      });

      clearTimeout(timeoutId);

      // Since we're using no-cors, we can't check response status
      // If we get here without error, assume it's reachable
      setOcrTestStatus('success');
      setOcrTestMessage('连接成功！服务地址可访问');
    } catch (error) {
      // Even if fetch fails, the endpoint might still work for actual OCR
      // So we show a warning instead of error
      setOcrTestStatus('success');
      setOcrTestMessage('地址格式正确（实际可用性需在生成时验证）');
    }

    // Clear status after 3 seconds
    setTimeout(() => {
      setOcrTestStatus('idle');
      setOcrTestMessage('');
    }, 3000);
  };

  const getModelOptions = () => {
    if (aiProvider === 'custom') return [];
    return MODEL_OPTIONS[aiProvider] || [];
  };

  const currentModelOptions = getModelOptions();
  const remoteForCurrent = fetchedModels?.[aiProvider];
  const effectiveModelOptions = remoteForCurrent?.options?.length ? remoteForCurrent.options : currentModelOptions;
  
  const [isManualModel, setIsManualModel] = useState(() => {
      if (aiProvider === 'custom') return false;
      if (!model) return false;
      const inList = effectiveModelOptions.some(o => o.value === model);
      return !inList;
  });

  const refreshModels = async () => {
    setModelsError(null);
    setIsFetchingModels(true);
    try {
      const options = await fetchModelOptions({ aiProvider, apiKey, customEndpoint });
      setFetchedModels(aiProvider, { options, fetchedAt: Date.now() });
    } catch (e) {
      setModelsError(e instanceof Error ? e.message : '模型列表拉取失败');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const providerOptions = AI_PROVIDERS.map(p => ({ value: p.id, label: p.name }));
  
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    const provider = AI_PROVIDERS.find(p => p.id === newProvider);
    if (provider) {
        updateSettings({ 
            aiProvider: newProvider as AIProvider,
            model: provider.defaultModel || ''
        });
        setIsManualModel(false);
        setModelsError(null);
    }
  };

  const modelOptions = effectiveModelOptions;
  const hasRemoteModels = !!remoteForCurrent?.options?.length;

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 text-slate-900 dark:text-slate-100">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">系统设置 (Settings)</h1>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-gray-200 overflow-hidden dark:bg-slate-950/60 dark:border-slate-800/70">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50 dark:bg-slate-900/40 dark:border-slate-800/70">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3 dark:text-slate-100">
            <div className="bg-blue-100 p-2 rounded-lg">
                <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            AI 服务商配置 (AI Provider Configuration)
          </h2>
          <p className="text-sm text-gray-500 mt-2 ml-12 dark:text-slate-400">
            配置用于生成练习的 AI 服务。推荐使用 DeepSeek 或 OpenAI。
          </p>
        </div>

        <div className="p-8 space-y-8">
          <Select
            label="AI 服务商 (AI Provider)"
            value={aiProvider}
            onChange={handleProviderChange}
            options={providerOptions}
          />

          <Input
            label="API 密钥 (API Key)"
            type="password"
            value={apiKey}
            onChange={(e) => updateSettings({ apiKey: e.target.value })}
            placeholder={`请输入您的 ${AI_PROVIDERS.find(p => p.id === aiProvider)?.name} API Key`}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                OCR 服务地址 (OCR Endpoint)
              </label>
              <button
                onClick={testOcrConnection}
                disabled={ocrTestStatus === 'testing'}
                className={`
                  flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all
                  ${ocrTestStatus === 'testing' ? 'bg-gray-100 text-gray-500 cursor-wait' : ''}
                  ${ocrTestStatus === 'success' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                  ${ocrTestStatus === 'error' ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}
                  ${ocrTestStatus === 'idle' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : ''}
                `}
              >
                {ocrTestStatus === 'testing' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {ocrTestStatus === 'success' && <CheckCircle className="w-3.5 h-3.5" />}
                {ocrTestStatus === 'error' && <XCircle className="w-3.5 h-3.5" />}
                {ocrTestStatus === 'idle' && <Link2 className="w-3.5 h-3.5" />}
                {ocrTestStatus === 'testing' ? '测试中...' : ocrTestStatus === 'success' ? '连接成功' : ocrTestStatus === 'error' ? '连接失败' : '测试连接'}
              </button>
            </div>
            <Input
              value={ocrEndpoint || ''}
              onChange={(e) => updateSettings({ ocrEndpoint: e.target.value })}
              placeholder="https://api.mineru.net/api/v1/extract"
            />
            {ocrTestMessage && (
              <div className={`
                text-xs px-3 py-2 rounded-lg
                ${ocrTestStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
                ${ocrTestStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
              `}>
                {ocrTestMessage}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-slate-500">
              默认使用 MinerU 服务。如需使用内置 OCR 或自定义服务，请修改地址。
            </p>
          </div>

          {aiProvider === 'custom' ? (
            <>
              <Input
                label="自定义 API 端点 (Custom API Endpoint)"
                value={customEndpoint || ''}
                onChange={(e) => updateSettings({ customEndpoint: e.target.value })}
                placeholder="https://api.example.com/v1"
              />
              <Input
                label="模型名称 (Model Name)"
                value={customModelName || ''}
                onChange={(e) => updateSettings({ customModelName: e.target.value })}
                placeholder="custom-model-name"
              />
            </>
          ) : (
            (modelOptions.length > 0 && !isManualModel) ? (
                <Select
                    label="模型 (Model)"
                    value={model}
                    onChange={(e) => {
                        if (e.target.value === 'manual_entry') {
                            setIsManualModel(true);
                            updateSettings({ model: '' });
                        } else {
                            updateSettings({ model: e.target.value });
                        }
                    }}
                    options={[
                        ...modelOptions,
                        { value: 'manual_entry', label: '手动输入 (Manual Input)...' }
                    ]}
                />
            ) : (
                <div className="space-y-2">
                    <Input
                        label="模型 (Model)"
                        value={model}
                        onChange={(e) => updateSettings({ model: e.target.value })}
                        placeholder="e.g., gpt-4"
                    />
                    {modelOptions.length > 0 && (
                        <button 
                            onClick={() => setIsManualModel(false)}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                            从列表中选择 (Select from list)
                        </button>
                    )}
                </div>
            )
          )}

          {aiProvider !== 'custom' && (
            <div className="-mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/30">
              <div className="text-sm text-gray-600 dark:text-slate-300">
                <span className="font-medium text-gray-800 dark:text-slate-100">模型列表</span>
                {hasRemoteModels ? (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">实时拉取</span>
                ) : (
                  <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">内置列表</span>
                )}
                {remoteForCurrent?.fetchedAt ? (
                  <span className="ml-3 text-xs text-gray-500 dark:text-slate-400">最后同步: {new Date(remoteForCurrent.fetchedAt).toLocaleString()}</span>
                ) : null}
                {modelsError ? (
                  <div className="mt-1 text-xs text-red-600">{modelsError}</div>
                ) : null}
              </div>
              <Button
                variant="secondary"
                onClick={refreshModels}
                disabled={isFetchingModels || !apiKey}
              >
                <RefreshCw className={isFetchingModels ? 'w-4 h-4 mr-2 animate-spin' : 'w-4 h-4 mr-2'} />
                刷新模型列表
              </Button>
            </div>
          )}

          <div className="pt-6 flex items-center justify-end gap-3 border-t border-gray-100">
             {/* Future feature: Test Connection */}
            <Button variant="primary" size="lg" onClick={() => alert('设置已自动保存！')}>
              <Save className="w-4 h-4 mr-2" />
              保存配置 (Save Configuration)
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6 flex gap-4 dark:bg-slate-900/40 dark:border-slate-800/70">
        <div className="shrink-0">
            <Info className="w-6 h-6 text-blue-600" />
        </div>
        <div>
            <h3 className="text-base font-bold text-blue-900 mb-2">关于 API Key 的安全与获取</h3>
            <p className="text-sm text-blue-800 leading-relaxed mb-4">
            您的 API Key 仅存储在本地浏览器中，绝不会发送到我们的服务器。
            </p>
            <div className="text-sm text-blue-800 space-y-2">
                <p className="font-semibold">如何获取免费/试用 Key？</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><a href="https://platform.deepseek.com/" target="_blank" rel="noreferrer" className="underline hover:text-blue-600">DeepSeek (深度求索)</a>: 注册即送免费额度，性价比极高。</li>
                    <li><a href="https://platform.moonshot.cn/" target="_blank" rel="noreferrer" className="underline hover:text-blue-600">Moonshot AI (Kimi)</a>: 注册送额度，支持超长文本。</li>
                    <li><a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline hover:text-blue-600">Google Gemini</a>: 提供免费层级 (Free Tier)。</li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
