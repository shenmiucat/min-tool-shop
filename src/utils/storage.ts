/**
 * 本機儲存 (localStorage) 與 JSON 備份/還原工具模組
 * 確保純前端離線可用，並對匯入檔案進行結構檢查以防損毀資料寫入。
 */

import { CURRENT_SCHEMA_VERSION, createDefaultWorkshopData } from '../data/defaults';
import type { WorkshopData } from '../types/workshop';

export const STORAGE_KEY = 'min_workshop_data_v1';
export const THEME_STORAGE_KEY = 'min_workshop_theme_v1';

/**
 * 從 localStorage 讀取資料，若無資料或解析失敗則安全回退為預設值
 */
export function loadWorkshopData(): WorkshopData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultWorkshopData();
    }
    const parsed: unknown = JSON.parse(raw);
    const validated = validateAndNormalizeWorkshopData(parsed);
    return validated ?? createDefaultWorkshopData();
  } catch {
    return createDefaultWorkshopData();
  }
}

/**
 * 將資料寫入 localStorage
 */
export function saveWorkshopData(data: WorkshopData): boolean {
  try {
    const payload: WorkshopData = {
      ...data,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/**
 * 將目前資料下載為帶時間戳記的 JSON 備份檔
 */
export function exportWorkshopDataAsJson(data: WorkshopData): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const filename = `min-workshop-backup-${yyyy}${mm}${dd}-${hh}${min}.json`;

  const payload: WorkshopData = {
    ...data,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    updatedAt: now.toISOString(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * 驗證並補齊匯入的 JSON 物件，避免缺漏欄位導致介面錯誤
 */
export function validateAndNormalizeWorkshopData(input: unknown): WorkshopData | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const candidate = input as Partial<WorkshopData>;
  const fallback = createDefaultWorkshopData();

  const hasPicker =
    candidate.picker &&
    typeof candidate.picker === 'object' &&
    Array.isArray(candidate.picker.lists);
  const hasBom = candidate.bom && typeof candidate.bom === 'object';
  const hasBookmarks =
    candidate.bookmarks &&
    typeof candidate.bookmarks === 'object' &&
    Array.isArray(candidate.bookmarks.items);

  // 至少要符合本應用的其中一項主要資料區段，才視為有效備份
  if (!hasPicker && !hasBom && !hasBookmarks) {
    return null;
  }

  const validToolIds = ['picker', 'bom', 'bookmarks'] as const;
  const activeTool =
    candidate.activeTool && validToolIds.includes(candidate.activeTool)
      ? candidate.activeTool
      : fallback.activeTool;

  const pickerLists =
    hasPicker && candidate.picker!.lists.length > 0
      ? candidate.picker!.lists
      : fallback.picker.lists;

  const activeListExists = pickerLists.some(
    (list) => list.id === candidate.picker?.activeListId
  );

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    updatedAt:
      typeof candidate.updatedAt === 'string'
        ? candidate.updatedAt
        : new Date().toISOString(),
    activeTool,
    picker: {
      activeListId: activeListExists
        ? candidate.picker!.activeListId
        : pickerLists[0].id,
      noRepeat:
        typeof candidate.picker?.noRepeat === 'boolean'
          ? candidate.picker.noRepeat
          : fallback.picker.noRepeat,
      drawnIdsByList:
        candidate.picker?.drawnIdsByList &&
        typeof candidate.picker.drawnIdsByList === 'object'
          ? candidate.picker.drawnIdsByList
          : {},
      lists: pickerLists,
      history: Array.isArray(candidate.picker?.history)
        ? candidate.picker!.history.slice(0, 50)
        : [],
    },
    bom: {
      activeRuleId:
        typeof candidate.bom?.activeRuleId === 'string'
          ? candidate.bom.activeRuleId
          : fallback.bom.activeRuleId,
      customPattern:
        typeof candidate.bom?.customPattern === 'string'
          ? candidate.bom.customPattern
          : fallback.bom.customPattern,
      customCaseSensitive:
        typeof candidate.bom?.customCaseSensitive === 'boolean'
          ? candidate.bom.customCaseSensitive
          : fallback.bom.customCaseSensitive,
      inputText:
        typeof candidate.bom?.inputText === 'string'
          ? candidate.bom.inputText
          : fallback.bom.inputText,
      rules:
        Array.isArray(candidate.bom?.rules) && candidate.bom!.rules.length > 0
          ? candidate.bom!.rules
          : fallback.bom.rules,
    },
    bookmarks: {
      items: hasBookmarks ? candidate.bookmarks!.items : fallback.bookmarks.items,
    },
  };
}

/**
 * 格式化時間顯示（例如 14:32）
 */
export function formatShortTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '--:--';
  }
}

/**
 * 產生簡潔唯一 ID
 */
export function createId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${randomPart}`;
}
