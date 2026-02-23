import { useEffect, useRef } from 'react';

interface UseDraftResponseOptions {
  formId: string;
  sessionId: string;
  answers: Record<number, any>;
  enabled?: boolean;
  autosaveInterval?: number;
}

interface DraftResponseData {
  answers: Record<number, any>;
  updated_at: string;
}

export function useDraftResponse({
  formId,
  sessionId,
  answers,
  enabled = true,
  autosaveInterval = 10000, // 10 seconds
}: UseDraftResponseOptions) {
  const savingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedAnswersRef = useRef<Record<number, any>>({});

  // Local storage key
  const storageKey = `draft_${formId}_${sessionId}`;

  // Load draft from local storage on mount
  useEffect(() => {
    if (!enabled) return;

    const loadFromLocalStorage = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const draft: DraftResponseData = JSON.parse(saved);
          return draft.answers;
        }
      } catch (error) {
        console.error('Failed to load draft from local storage:', error);
      }
      return null;
    };

    const localDraft = loadFromLocalStorage();
    if (localDraft && Object.keys(localDraft).length > 0) {
      lastSavedAnswersRef.current = localDraft;
    }
  }, [enabled, storageKey]);

  // Load draft from server on mount
  useEffect(() => {
    if (!enabled) return;

    const loadFromServer = async () => {
      try {
        const response = await fetch(`/api/forms/${formId}/draft?session_id=${sessionId}`);
        if (response.ok) {
          const data: DraftResponseData = await response.json();
          if (data.answers && Object.keys(data.answers).length > 0) {
            return data.answers;
          }
        }
      } catch (error) {
        console.error('Failed to load draft from server:', error);
      }
      return null;
    };

    loadFromServer().then(serverDraft => {
      if (serverDraft && Object.keys(serverDraft).length > 0) {
        // Server draft takes priority over local storage
        lastSavedAnswersRef.current = serverDraft;
      }
    });
  }, [enabled, formId, sessionId]);

  // Save to both local storage and server
  const saveDraft = async (answersToSave: Record<number, any>) => {
    if (!enabled) return;

    // Skip if answers haven't changed
    if (JSON.stringify(answersToSave) === JSON.stringify(lastSavedAnswersRef.current)) {
      return;
    }

    lastSavedAnswersRef.current = answersToSave;

    // Save to local storage immediately
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          answers: answersToSave,
          updated_at: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Failed to save draft to local storage:', error);
    }

    // Save to server with debounce
    if (savingTimeoutRef.current) {
      clearTimeout(savingTimeoutRef.current);
    }

    savingTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/forms/${formId}/draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            answers: answersToSave,
          }),
        });

        if (!response.ok) {
          console.error('Failed to save draft to server');
        }
      } catch (error) {
        console.error('Failed to save draft to server:', error);
      }
    }, 1000); // 1 second debounce for server save
  };

  // Auto-save when answers change
  useEffect(() => {
    if (!enabled) return;

    saveDraft(answers);
  }, [answers, enabled]);

  // Delete draft
  const deleteDraft = async () => {
    // Clear local storage
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to delete draft from local storage:', error);
    }

    // Clear from server
    try {
      await fetch(`/api/forms/${formId}/draft`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch (error) {
      console.error('Failed to delete draft from server:', error);
    }

    if (savingTimeoutRef.current) {
      clearTimeout(savingTimeoutRef.current);
    }
  };

  return {
    deleteDraft,
  };
}
