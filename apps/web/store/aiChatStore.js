import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * AI Chat Store
 * Manages chat history with persistence to localStorage
 * Max 50 messages per session to avoid bloat
 */
export const useAIChatStore = create(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      error: null,
      selectedModelId: null,

      /**
       * Tambah message ke chat history
       */
      addMessage: (message) =>
        set((state) => {
          const messages = [...state.messages, message];
          // Keep only last 50 messages to optimize storage
          if (messages.length > 50) {
            messages.shift();
          }
          return { messages };
        }),

      /**
       * Clear semua messages
       */
      clearMessages: () => set({ messages: [] }),

      /**
       * Set loading state
       */
      setLoading: (isLoading) => set({ isLoading }),

      /**
       * Set error
       */
      setError: (error) => set({ error }),

      /**
       * Set selected model
       */
      setSelectedModelId: (selectedModelId) => set({ selectedModelId }),

      /**
       * Get formatted chat history untuk context
       */
      getChatHistory: () => {
        const { messages } = get();
        return messages
          .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
          .join('\n');
      },

      /**
       * Get last N messages
       */
      getRecentMessages: (count = 10) => {
        const { messages } = get();
        return messages.slice(-count);
      },

      /**
       * Reset store
       */
      reset: () =>
        set({
          messages: [],
          isLoading: false,
          error: null,
          selectedModelId: null,
        }),
    }),
    {
      name: 'ai-chat-store', // localStorage key
      version: 2,
      migrate: (persistedState) => ({
        ...persistedState,
        selectedModelId: null,
      }),
    }
  )
);
