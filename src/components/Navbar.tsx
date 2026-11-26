/**
 * 頂部導覽列元件
 * 採用簡潔單列三區設計：網站標題、單行工具切換連結、深淺色模式切換按鈕。
 */

import { Moon, Sun } from 'lucide-react';
import type { ThemeMode, ToolId } from '../types/workshop';

interface NavbarProps {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const TOOL_NAV_ITEMS: Array<{ id: ToolId; label: string }> = [
  { id: 'picker', label: '抽籤器' },
  { id: 'bom', label: 'BOM 檢查' },
  { id: 'bookmarks', label: '工具入口' },
];

export function Navbar({
  activeTool,
  onSelectTool,
  theme,
  onToggleTheme,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E2DFD7] bg-[#F7F6F2]/92 backdrop-blur-sm dark:border-[#2D3632] dark:bg-[#161A18]/92">
      <div className="mx-auto flex h-16 max-w-[1160px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* 區段一：單一元素網站標題 */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="whitespace-nowrap shrink-0 text-[17px] font-bold tracking-tight text-[#232A27] transition-colors hover:text-[#4A6B5D] dark:text-[#EAECE9] dark:hover:text-[#7CA392]"
        >
          Min 的工具雜貨舖
        </a>

        {/* 區段二：桌面版單行文字導覽連結 */}
        <nav
          aria-label="主要工具導覽"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {TOOL_NAV_ITEMS.map((item) => {
            const isActive = activeTool === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTool(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  isActive
                    ? 'text-[#232A27] dark:text-[#EAECE9]'
                    : 'text-[#5A635E] hover:text-[#232A27] dark:text-[#9AA6A0] dark:hover:text-[#EAECE9]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-[#4A6B5D] dark:bg-[#7CA392]"
                  />
                )}
              </button>
            );
          })}
          <a
            href="#guide"
            className="py-2 whitespace-nowrap shrink-0 text-[#5A635E] transition-colors hover:text-[#232A27] dark:text-[#9AA6A0] dark:hover:text-[#EAECE9]"
          >
            使用說明
          </a>
        </nav>

        {/* 區段三：單一主題切換按鈕 */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? '切換至淺色模式' : '切換至深色模式'}
            className="inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer rounded-lg border border-[#D8D4C9] bg-white px-3.5 py-2 text-xs font-medium text-[#232A27] transition-colors hover:border-[#4A6B5D]/50 hover:bg-[#F2F0E8] dark:border-[#343F3A] dark:bg-[#1F2522] dark:text-[#EAECE9] dark:hover:border-[#7CA392]/60 dark:hover:bg-[#272F2B]"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-[#C6A26B]" aria-hidden="true" />
                <span>淺色模式</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-[#4A6B5D]" aria-hidden="true" />
                <span>深色模式</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
