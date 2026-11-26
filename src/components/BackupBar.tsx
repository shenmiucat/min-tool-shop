/**
 * 資料備份與工具標題列
 * 提供本機最後儲存時間顯示、一鍵匯出 JSON 備份、匯入還原與兩段式確認重設功能。
 */

import { Download, RotateCcw, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { FeedbackBanner } from '../hooks/useWorkshopStore';
import type { ToolId } from '../types/workshop';
import { formatShortTime } from '../utils/storage';

interface BackupBarProps {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  updatedAt: string;
  banner: FeedbackBanner | null;
  onClearBanner: () => void;
  onExportJson: () => void;
  onImportFile: (file: File) => void;
  onResetDefaults: () => void;
}

const TOOL_META: Record<ToolId, { title: string; subtitle: string }> = {
  picker: {
    title: '靈感與待辦隨機抽籤器',
    subtitle: '管理自訂清單並隨機抽出下一個行動項目，支援不重複抽籤與一鍵複製結果。',
  },
  bom: {
    title: '簡易 BOM 料號格式檢查器',
    subtitle: '批次貼上料號清單，即時驗證編碼規則、找出格式異常與重複項，並複製整理後的結果。',
  },
  bookmarks: {
    title: '常用小工具捷徑入口',
    subtitle: '集中收藏個人常用的線上工具與參考連結，支援分類篩選、釘選與快速複製網址。',
  },
};

const MOBILE_TOOLS: Array<{ id: ToolId; label: string }> = [
  { id: 'picker', label: '抽籤器' },
  { id: 'bom', label: 'BOM 檢查' },
  { id: 'bookmarks', label: '工具入口' },
];

export function BackupBar({
  activeTool,
  onSelectTool,
  updatedAt,
  banner,
  onClearBanner,
  onExportJson,
  onImportFile,
  onResetDefaults,
}: BackupBarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const meta = TOOL_META[activeTool];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportFile(file);
    }
    // 重置 input 值，確保可連續匯入同名檔案
    event.target.value = '';
  };

  return (
    <section className="space-y-4">
      {/* 手機與平板端非固定式工具切換條 */}
      <div
        role="tablist"
        aria-label="切換工具模組"
        className="flex items-center gap-1 rounded-lg border border-[#E2DFD7] bg-[#EFEDE7] p-1 md:hidden dark:border-[#2D3632] dark:bg-[#1A1F1D]"
      >
        {MOBILE_TOOLS.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTool(tool.id)}
              className={`min-h-[40px] flex-1 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-white text-[#232A27] shadow-xs dark:bg-[#27302C] dark:text-[#EAECE9]'
                  : 'text-[#5A635E] hover:text-[#232A27] dark:text-[#9AA6A0] dark:hover:text-[#EAECE9]'
              }`}
            >
              {tool.label}
            </button>
          );
        })}
      </div>

      {/* 工具主標題與備份操作列 */}
      <div className="flex flex-col gap-4 border-b border-[#E2DFD7] pb-6 lg:flex-row lg:items-end lg:justify-between dark:border-[#2D3632]">
        <div className="max-w-2xl space-y-1.5">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-[#232A27] sm:text-[28px] dark:text-[#EAECE9]">
            {meta.title}
          </h1>
          <p className="text-sm leading-relaxed text-[#5A635E] dark:text-[#9AA6A0]">
            {meta.subtitle}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2.5 lg:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer rounded-lg border border-[#D8D4C9] bg-white px-3.5 py-2 text-xs font-medium text-[#232A27] transition-colors hover:border-[#4A6B5D]/50 hover:bg-[#F2F0E8] dark:border-[#343F3A] dark:bg-[#1F2522] dark:text-[#EAECE9] dark:hover:border-[#7CA392]/60 dark:hover:bg-[#272F2B]"
            >
              <Download className="h-3.5 w-3.5 text-[#4A6B5D] dark:text-[#7CA392]" aria-hidden="true" />
              <span>匯出 JSON 備份</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer rounded-lg border border-[#D8D4C9] bg-white px-3.5 py-2 text-xs font-medium text-[#232A27] transition-colors hover:border-[#4A6B5D]/50 hover:bg-[#F2F0E8] dark:border-[#343F3A] dark:bg-[#1F2522] dark:text-[#EAECE9] dark:hover:border-[#7CA392]/60 dark:hover:bg-[#272F2B]"
            >
              <Upload className="h-3.5 w-3.5 text-[#3D5A73] dark:text-[#86A8C4]" aria-hidden="true" />
              <span>匯入還原</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
              aria-label="選擇 JSON 備份檔進行還原"
            />

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer rounded-lg px-2.5 py-2 text-xs font-medium text-[#6B736E] transition-colors hover:bg-[#EFEDE7] hover:text-[#232A27] dark:text-[#9AA6A0] dark:hover:bg-[#252C29] dark:hover:text-[#EAECE9]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>重設預設</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#B84A44]/40 bg-[#FDF5F4] px-2.5 py-1.5 text-xs dark:border-[#D97A75]/40 dark:bg-[#2A1D1C]">
                <span className="whitespace-nowrap text-[#9A3A35] dark:text-[#E8A09B]">
                  確定清空並還原預設？
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onResetDefaults();
                    setConfirmReset(false);
                  }}
                  className="cursor-pointer whitespace-nowrap rounded px-2 py-0.5 font-medium text-white bg-[#B84A44] hover:bg-[#9E3C37] dark:bg-[#C25953]"
                >
                  確定
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="cursor-pointer whitespace-nowrap rounded px-1.5 py-0.5 text-[#5A635E] hover:text-[#232A27] dark:text-[#B5C0BA] dark:hover:text-white"
                >
                  取消
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#6B736E] tabular-nums dark:text-[#8E9B94]">
            <span>已自動儲存於本機瀏覽器</span>
            <span aria-hidden="true">·</span>
            <span>最後更新 {formatShortTime(updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* 備份/還原操作回饋訊息條 */}
      {banner && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-sm ${
            banner.type === 'success'
              ? 'border-[#4A6B5D]/35 bg-[#EEF4F0] text-[#2F4A3E] dark:border-[#7CA392]/35 dark:bg-[#1D2B25] dark:text-[#C8DFD4]'
              : 'border-[#B84A44]/35 bg-[#FDF4F3] text-[#963833] dark:border-[#D97A75]/35 dark:bg-[#2B1D1C] dark:text-[#F0B4B0]'
          }`}
        >
          <span>{banner.message}</span>
          <button
            type="button"
            onClick={onClearBanner}
            aria-label="關閉通知"
            className="shrink-0 cursor-pointer rounded p-1 opacity-75 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
