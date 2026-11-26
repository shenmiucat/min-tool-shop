/**
 * 一鍵複製與「已複製」狀態提示 Hook
 * 優先使用 Clipboard API，並內建 textarea 回退方案以確保在各種瀏覽器與 iframe 環境皆能穩定複製。
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export function useCopyFeedback(durationMs = 1800) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copyText = useCallback(
    async (text: string, key = 'default'): Promise<boolean> => {
      if (!text) return false;

      let success = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          success = true;
        }
      } catch {
        success = false;
      }

      if (!success) {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          textarea.style.pointerEvents = 'none';
          document.body.appendChild(textarea);
          textarea.select();
          success = document.execCommand('copy');
          document.body.removeChild(textarea);
        } catch {
          success = false;
        }
      }

      if (success) {
        setCopiedKey(key);
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => {
          setCopiedKey(null);
        }, durationMs);
      }

      return success;
    },
    [durationMs]
  );

  const isCopied = useCallback(
    (key = 'default') => copiedKey === key,
    [copiedKey]
  );

  return { copyText, isCopied, copiedKey };
}
