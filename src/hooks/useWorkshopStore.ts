/**
 * 雜貨舖資料狀態管理 Hook
 * 自動將所有變動同步至 localStorage，並提供匯出 JSON、匯入還原與重設功能。
 */

import { useCallback, useEffect, useState } from 'react';
import { createDefaultWorkshopData } from '../data/defaults';
import type { ToolId, WorkshopData } from '../types/workshop';
import {
  exportWorkshopDataAsJson,
  loadWorkshopData,
  saveWorkshopData,
  validateAndNormalizeWorkshopData,
} from '../utils/storage';

export interface FeedbackBanner {
  type: 'success' | 'error';
  message: string;
}

export function useWorkshopStore() {
  const [data, setData] = useState<WorkshopData>(() => loadWorkshopData());
  const [banner, setBanner] = useState<FeedbackBanner | null>(null);

  // 任何資料異動即自動寫入 localStorage
  useEffect(() => {
    saveWorkshopData(data);
  }, [data]);

  const showBanner = useCallback((type: 'success' | 'error', message: string) => {
    setBanner({ type, message });
  }, []);

  const clearBanner = useCallback(() => {
    setBanner(null);
  }, []);

  const updateData = useCallback((updater: (prev: WorkshopData) => WorkshopData) => {
    setData((prev) => {
      const next = updater(prev);
      return {
        ...next,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const setActiveTool = useCallback(
    (toolId: ToolId) => {
      updateData((prev) => ({
        ...prev,
        activeTool: toolId,
      }));
    },
    [updateData]
  );

  const handleExportJson = useCallback(() => {
    try {
      const filename = exportWorkshopDataAsJson(data);
      showBanner('success', `已匯出備份檔案：${filename}`);
    } catch {
      showBanner('error', '匯出 JSON 失敗，請稍後再試。');
    }
  }, [data, showBanner]);

  const handleImportJsonFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = typeof reader.result === 'string' ? reader.result : '';
          const parsed: unknown = JSON.parse(text);
          const validated = validateAndNormalizeWorkshopData(parsed);

          if (!validated) {
            showBanner(
              'error',
              '檔案格式不符合「Min 的工具雜貨舖」備份結構，未覆蓋現有資料。'
            );
            return;
          }

          setData(validated);
          showBanner('success', `已成功從「${file.name}」還原所有清單與設定。`);
        } catch {
          showBanner('error', '無法解析 JSON 檔案，請確認檔案內容完整且未損毀。');
        }
      };
      reader.onerror = () => {
        showBanner('error', '讀取檔案時發生錯誤，請重新選擇檔案。');
      };
      reader.readAsText(file, 'utf-8');
    },
    [showBanner]
  );

  const handleResetDefaults = useCallback(() => {
    const fresh = createDefaultWorkshopData();
    setData(fresh);
    showBanner('success', '已還原為預設示範資料。');
  }, [showBanner]);

  return {
    data,
    updateData,
    setActiveTool,
    banner,
    clearBanner,
    handleExportJson,
    handleImportJsonFile,
    handleResetDefaults,
  };
}
