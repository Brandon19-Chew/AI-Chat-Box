import { useEffect, useCallback, useRef } from "react";
import { saveDraft, loadDraft, clearDraft } from "@/lib/draft-manager";

/**
 * Hook for managing message drafts with auto-save
 * Saves draft to AsyncStorage after a debounce delay
 */
export function useDraft(conversationId: number | null, text: string) {
  const saveTimeoutRef = useRef<any>(null);

  // Auto-save draft with debounce (500ms after user stops typing)
  useEffect(() => {
    if (!conversationId) return;

    // Clear previous timeout
    if (saveTimeoutRef.current !== null) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      await saveDraft(conversationId, text);
    }, 500);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current !== null) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [conversationId, text]);

  // Load draft when conversation changes
  const loadDraftForConversation = useCallback(
    async (convId: number): Promise<string> => {
      return await loadDraft(convId);
    },
    []
  );

  // Clear draft when message is sent
  const clearDraftForConversation = useCallback(
    async (convId: number) => {
      await clearDraft(convId);
    },
    []
  );

  return {
    loadDraftForConversation,
    clearDraftForConversation,
  };
}
