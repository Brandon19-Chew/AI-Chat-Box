import AsyncStorage from "@react-native-async-storage/async-storage";

const DRAFT_KEY_PREFIX = "message-draft-";

/**
 * Save a message draft for a specific conversation
 */
export async function saveDraft(conversationId: number, text: string): Promise<void> {
  try {
    const key = `${DRAFT_KEY_PREFIX}${conversationId}`;
    if (text.trim()) {
      await AsyncStorage.setItem(key, text);
    } else {
      // Clear draft if text is empty
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error("Error saving draft:", error);
  }
}

/**
 * Load a message draft for a specific conversation
 */
export async function loadDraft(conversationId: number): Promise<string> {
  try {
    const key = `${DRAFT_KEY_PREFIX}${conversationId}`;
    const draft = await AsyncStorage.getItem(key);
    return draft || "";
  } catch (error) {
    console.error("Error loading draft:", error);
    return "";
  }
}

/**
 * Clear a message draft for a specific conversation
 */
export async function clearDraft(conversationId: number): Promise<void> {
  try {
    const key = `${DRAFT_KEY_PREFIX}${conversationId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing draft:", error);
  }
}

/**
 * Clear all message drafts
 */
export async function clearAllDrafts(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const draftKeys = keys.filter((key) => key.startsWith(DRAFT_KEY_PREFIX));
    await AsyncStorage.multiRemove(draftKeys);
  } catch (error) {
    console.error("Error clearing all drafts:", error);
  }
}
