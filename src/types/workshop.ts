/**
 * Min 的工具雜貨舖 — 核心資料型別定義
 * 集中管理所有工具模組的型別與 JSON 備份結構，方便後續透過 GitHub 擴充新工具。
 */

export type ToolId = 'picker' | 'bom' | 'bookmarks';

export type ThemeMode = 'light' | 'dark';

/** 抽籤器：單一項目 */
export interface PickerItem {
  id: string;
  text: string;
  note?: string;
  enabled: boolean;
  createdAt: string;
}

/** 抽籤器：自訂清單 */
export interface PickerList {
  id: string;
  name: string;
  description: string;
  items: PickerItem[];
}

/** 抽籤器：歷史紀錄 */
export interface PickerHistoryEntry {
  id: string;
  listId: string;
  listName: string;
  resultText: string;
  drawnAt: string;
}

/** BOM 料號檢查器：格式規則 */
export interface BomRule {
  id: string;
  name: string;
  pattern: string;
  example: string;
  description: string;
  caseSensitive: boolean;
}

/** BOM 單行檢查結果 */
export interface BomCheckRow {
  lineNumber: number;
  raw: string;
  normalized: string;
  status: 'valid' | 'invalid' | 'duplicate';
  reason: string;
}

/** 常用小工具入口：單一捷徑項目 */
export interface ToolBookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  pinned: boolean;
  createdAt: string;
}

/** 統一的本機儲存與 JSON 備份資料結構 */
export interface WorkshopData {
  schemaVersion: number;
  updatedAt: string;
  activeTool: ToolId;
  picker: {
    activeListId: string;
    noRepeat: boolean;
    drawnIdsByList: Record<string, string[]>;
    lists: PickerList[];
    history: PickerHistoryEntry[];
  };
  bom: {
    activeRuleId: string;
    customPattern: string;
    customCaseSensitive: boolean;
    inputText: string;
    rules: BomRule[];
  };
  bookmarks: {
    items: ToolBookmark[];
  };
}
