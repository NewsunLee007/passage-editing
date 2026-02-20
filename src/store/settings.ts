import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSettings, DEFAULT_SETTINGS, AIProvider } from '../types';
import { ModelOption } from '../services/models';

interface SettingsStore extends UserSettings {
  fetchedModels: Record<string, { options: ModelOption[]; fetchedAt: number }>;
  ocrEndpoint?: string;
  // Preview Settings
  previewLineHeight?: number;
  previewFontSize?: number;
  previewImagePosition?: number;
  previewPagePadding?: number;
  previewParagraphSpacing?: number;

  updateSettings: (settings: Partial<UserSettings> & { 
    ocrEndpoint?: string;
    previewLineHeight?: number;
    previewFontSize?: number;
    previewImagePosition?: number;
    previewPagePadding?: number;
    previewParagraphSpacing?: number;
  }) => void;
  setFetchedModels: (provider: string, data: { options: ModelOption[]; fetchedAt: number }) => void;
  resetSettings: () => void;
  setProvider: (provider: AIProvider) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      fetchedModels: {},
      ocrEndpoint: 'https://api.mineru.net/api/v1/extract',
      // Default Preview Settings
      previewLineHeight: 1.2,
      previewFontSize: 16,
      previewImagePosition: 20,
      previewPagePadding: 0,
      previewParagraphSpacing: 8,

      updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
      setFetchedModels: (provider, data) => set((state) => ({
        fetchedModels: {
          ...state.fetchedModels,
          [provider]: data
        }
      })),
      resetSettings: () => set({
          ...DEFAULT_SETTINGS,
          fetchedModels: {},
          ocrEndpoint: 'https://api.mineru.net/api/v1/extract',
          previewLineHeight: 1.2,
          previewFontSize: 16,
          previewImagePosition: 20,
          previewPagePadding: 0,
          previewParagraphSpacing: 8
      }),
      setProvider: (provider) => set({ aiProvider: provider }),
    }),
    {
      name: 'worksheet_settings',
      partialize: (state) => ({
        ...state,
        // Ensure we persist everything including fetchedModels
      }),
    }
  )
);
