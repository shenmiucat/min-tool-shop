/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Min 的工具雜貨舖 — 應用程式主進入點
 * 單頁式響應式架構：上方導覽列 -> 中央核心功能操作區 -> 下方使用說明摺疊區。
 */

import { BackupBar } from './components/BackupBar';
import { GuideAccordion } from './components/GuideAccordion';
import { Navbar } from './components/Navbar';
import { BomCheckerTool } from './components/tools/BomCheckerTool';
import { RandomPickerTool } from './components/tools/RandomPickerTool';
import { ToolBookmarksTool } from './components/tools/ToolBookmarksTool';
import { useTheme } from './hooks/useTheme';
import { useWorkshopStore } from './hooks/useWorkshopStore';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    data,
    updateData,
    setActiveTool,
    banner,
    clearBanner,
    handleExportJson,
    handleImportJsonFile,
    handleResetDefaults,
  } = useWorkshopStore();

  return (
    <div
      id="top"
      className="flex min-h-screen flex-col bg-[#F7F6F2] text-[#232A27] transition-colors duration-200 dark:bg-[#161A18] dark:text-[#EAECE9]"
    >
      {/* 上方簡潔導覽列 */}
      <Navbar
        activeTool={data.activeTool}
        onSelectTool={setActiveTool}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* 中央核心功能操作區 */}
      <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <BackupBar
          activeTool={data.activeTool}
          onSelectTool={setActiveTool}
          updatedAt={data.updatedAt}
          banner={banner}
          onClearBanner={clearBanner}
          onExportJson={handleExportJson}
          onImportFile={handleImportJsonFile}
          onResetDefaults={handleResetDefaults}
        />

        <div className="mt-7">
          {data.activeTool === 'picker' && (
            <RandomPickerTool
              pickerState={data.picker}
              onUpdate={(updater) =>
                updateData((prev) => ({
                  ...prev,
                  picker: updater(prev.picker),
                }))
              }
            />
          )}

          {data.activeTool === 'bom' && (
            <BomCheckerTool
              bomState={data.bom}
              onUpdate={(updater) =>
                updateData((prev) => ({
                  ...prev,
                  bom: updater(prev.bom),
                }))
              }
            />
          )}

          {data.activeTool === 'bookmarks' && (
            <ToolBookmarksTool
              bookmarksState={data.bookmarks}
              onUpdate={(updater) =>
                updateData((prev) => ({
                  ...prev,
                  bookmarks: updater(prev.bookmarks),
                }))
              }
            />
          )}
        </div>

        {/* 下方使用說明摺疊區 */}
        <GuideAccordion />
      </main>

      {/* 極簡頁尾 */}
      <footer className="mt-10 border-t border-[#E2DFD7] py-6 dark:border-[#2D3632]">
        <div className="mx-auto flex max-w-[1160px] flex-col items-start justify-between gap-2 px-4 text-xs text-[#6B736E] sm:flex-row sm:items-center sm:px-6 lg:px-8 dark:text-[#8E9B94]">
          <span>Min 的工具雜貨舖 · 純前端靜態應用</span>
          <span>資料僅儲存於個人瀏覽器本機，支援隨時匯出 JSON 備份</span>
        </div>
      </footer>
    </div>
  );
}
