import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CachedMessage {
  id: number;
  conversationId: number;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
  isEdited?: boolean;
  editedAt?: string;
}

export interface CachedConversation {
  id: number;
  title: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

const CACHE_KEYS = {
  MESSAGES: (conversationId: number) => `cache:messages:${conversationId}`,
  CONVERSATIONS: 'cache:conversations',
  LAST_SYNC: (conversationId: number) => `cache:last_sync:${conversationId}`,
};

/**
 * Offline Cache Service
 * Manages local storage of messages and conversations for offline access
 */
export const offlineCache = {
  /**
   * Cache messages for a conversation
   */
  async cacheMessages(conversationId: number, messages: CachedMessage[]): Promise<void> {
    try {
      const key = CACHE_KEYS.MESSAGES(conversationId);
      await AsyncStorage.setItem(key, JSON.stringify(messages));
      await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC(conversationId), new Date().toISOString());
    } catch (error) {
      console.error('Error caching messages:', error);
    }
  },

  /**
   * Get cached messages for a conversation
   */
  async getCachedMessages(conversationId: number): Promise<CachedMessage[]> {
    try {
      const key = CACHE_KEYS.MESSAGES(conversationId);
      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error retrieving cached messages:', error);
      return [];
    }
  },

  /**
   * Cache conversations list
   */
  async cacheConversations(conversations: CachedConversation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error caching conversations:', error);
    }
  },

  /**
   * Get cached conversations
   */
  async getCachedConversations(): Promise<CachedConversation[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.CONVERSATIONS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error retrieving cached conversations:', error);
      return [];
    }
  },

  /**
   * Add a single message to cache
   */
  async addMessageToCache(conversationId: number, message: CachedMessage): Promise<void> {
    try {
      const messages = await this.getCachedMessages(conversationId);
      const existingIndex = messages.findIndex(m => m.id === message.id);
      
      if (existingIndex >= 0) {
        messages[existingIndex] = message;
      } else {
        messages.push(message);
      }
      
      await this.cacheMessages(conversationId, messages);
    } catch (error) {
      console.error('Error adding message to cache:', error);
    }
  },

  /**
   * Clear cache for a specific conversation
   */
  async clearConversationCache(conversationId: number): Promise<void> {
    try {
      const key = CACHE_KEYS.MESSAGES(conversationId);
      const syncKey = CACHE_KEYS.LAST_SYNC(conversationId);
      await AsyncStorage.multiRemove([key, syncKey]);
    } catch (error) {
      console.error('Error clearing conversation cache:', error);
    }
  },

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache:'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  },

  /**
   * Get last sync time for a conversation
   */
  async getLastSyncTime(conversationId: number): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC(conversationId));
    } catch (error) {
      console.error('Error retrieving last sync time:', error);
      return null;
    }
  },
};
