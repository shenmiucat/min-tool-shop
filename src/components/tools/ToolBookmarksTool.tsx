/**
 * 核心工具三：常用小工具捷徑入口
 * 支援自訂網址新增/編輯/刪除、分類篩選、關鍵字搜尋、釘選置頂與一鍵複製網址。
 */

import {
  Check,
  Copy,
  ExternalLink,
  Pencil,
  Pin,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';
import type { ToolBookmark, WorkshopData } from '../../types/workshop';
import { createId } from '../../utils/storage';

interface ToolBookmarksToolProps {
  bookmarksState: WorkshopData['bookmarks'];
  onUpdate: (
    updater: (prev: WorkshopData['bookmarks']) => WorkshopData['bookmarks']
  ) => void;
}

/** 僅允許安全的 http/https 連結 */
function normalizeSafeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function getDomainLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function ToolBookmarksTool({
  bookmarksState,
  onUpdate,
}: ToolBookmarksToolProps) {
  const { copyText, isCopied } = useCopyFeedback(1800);

  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 表單欄位
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('開發工具');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(bookmarksState.items.map((item) => item.category).filter(Boolean))
    );
    return ['全部', ...unique];
  }, [bookmarksState.items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...bookmarksState.items]
      .filter((item) => {
        if (selectedCategory !== '全部' && item.category !== selectedCategory) {
          return false;
        }
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.url.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [bookmarksState.items, selectedCategory, searchQuery]);

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setCategory('開發工具');
    setDescription('');
    setEditingId(null);
    setFormError(null);
    setShowForm(false);
  };

  const openEditForm = (item: ToolBookmark) => {
    setEditingId(item.id);
    setTitle(item.title);
    setUrl(item.url);
    setCategory(item.category);
    setDescription(item.description);
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const safeUrl = normalizeSafeUrl(url);

    if (!cleanTitle) {
      setFormError('請輸入工具名稱。');
      return;
    }
    if (!safeUrl) {
      setFormError('請輸入有效的 http:// 或 https:// 網址。');
      return;
    }

    const cleanCategory = category.trim() || '日常效率';
    const cleanDesc = description.trim() || '個人收藏工具連結';

    if (editingId) {
      onUpdate((prev) => ({
        items: prev.items.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title: cleanTitle,
                url: safeUrl,
                category: cleanCategory,
                description: cleanDesc,
              }
            : item
        ),
      }));
    } else {
      const created: ToolBookmark = {
        id: createId('bm'),
        title: cleanTitle,
        url: safeUrl,
        category: cleanCategory,
        description: cleanDesc,
        pinned: false,
        createdAt: new Date().toISOString(),
      };
      onUpdate((prev) => ({
        items: [created, ...prev.items],
      }));
    }

    resetForm();
  };

  const handleTogglePin = (id: string) => {
    onUpdate((prev) => ({
      items: prev.items.map((item) =>
        item.id === id ? { ...item, pinned: !item.pinned } : item
      ),
    }));
  };

  const handleDelete = (id: string) => {
    onUpdate((prev) => ({
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      {/* 搜尋、分類篩選與新增按鈕 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[36px] cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#4A6B5D] text-white dark:bg-[#4F7565]'
                    : 'border border-[#E2DFD7] bg-white text-[#5A635E] hover:text-[#232A27] dark:border-[#2D3632] dark:bg-[#1F2522] dark:text-[#9AA6A0] dark:hover:text-[#EAECE9]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A918D]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋工具名稱或網址..."
              className="min-h-[40px] w-full rounded-lg border border-[#D8D4C9] bg-white py-2 pl-8 pr-3 text-xs text-[#232A27] placeholder:text-[#8A918D] dark:border-[#343F3A] dark:bg-[#1F2522] dark:text-[#EAECE9]"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (showForm && !editingId) {
                resetForm();
              } else {
                setEditingId(null);
                setTitle('');
                setUrl('');
                setDescription('');
                setFormError(null);
                setShowForm(true);
              }
            }}
            className="inline-flex min-h-[40px] shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#4A6B5D] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#3B574B] dark:bg-[#4F7565]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>新增捷徑</span>
          </button>
        </div>
      </div>

      {/* 新增 / 編輯表單 */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-[#4A6B5D]/40 bg-white p-5 dark:border-[#7CA392]/40 dark:bg-[#1F2522]"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#232A27] dark:text-[#EAECE9]">
              {editingId ? '編輯工具捷徑' : '新增常用工具捷徑'}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              aria-label="關閉表單"
              className="cursor-pointer rounded p-1 text-[#6B736E] hover:text-[#232A27] dark:text-[#9AA6A0] dark:hover:text-[#EAECE9]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#5A635E] dark:text-[#9AA6A0]">
                工具名稱
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：Markdown 線上預覽"
                className="min-h-[40px] w-full rounded-lg border border-[#D8D4C9] bg-[#FAF9F6] px-3 py-2 text-xs text-[#232A27] dark:border-[#343F3A] dark:bg-[#171C1A] dark:text-[#EAECE9]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#5A635E] dark:text-[#9AA6A0]">
                網址 (URL)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="min-h-[40px] w-full rounded-lg border border-[#D8D4C9] bg-[#FAF9F6] px-3 py-2 font-mono text-xs text-[#232A27] dark:border-[#343F3A] dark:bg-[#171C1A] dark:text-[#EAECE9]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#5A635E] dark:text-[#9AA6A0]">
                分類名稱
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="開發工具 / 設計與視覺 / 日常效率"
                className="min-h-[40px] w-full rounded-lg border border-[#D8D4C9] bg-[#FAF9F6] px-3 py-2 text-xs text-[#232A27] dark:border-[#343F3A] dark:bg-[#171C1A] dark:text-[#EAECE9]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#5A635E] dark:text-[#9AA6A0]">
              簡短用途說明
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="一句話記錄這個工具的用途..."
              className="min-h-[40px] w-full rounded-lg border border-[#D8D4C9] bg-[#FAF9F6] px-3 py-2 text-xs text-[#232A27] dark:border-[#343F3A] dark:bg-[#171C1A] dark:text-[#EAECE9]"
            />
          </div>

          {formError && (
            <p className="text-xs text-[#B84A44] dark:text-[#EC9A95]">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="min-h-[38px] cursor-pointer rounded-lg px-4 py-1.5 text-xs font-medium text-[#5A635E] hover:bg-[#F2F0E8] dark:text-[#9AA6A0] dark:hover:bg-[#272F2B]"
            >
              取消
            </button>
            <button
              type="submit"
              className="min-h-[38px] cursor-pointer rounded-lg bg-[#4A6B5D] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#3B574B] dark:bg-[#4F7565]"
            >
              {editingId ? '儲存變更' : '加入捷徑'}
            </button>
          </div>
        </form>
      )}

      {/* 捷徑卡片網格（單層平面設計，無膠囊標籤堆疊） */}
      {filteredItems.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[#DFDCD2] bg-white px-6 py-12 text-center dark:border-[#2E3834] dark:bg-[#1F2522]">
          <p className="text-sm font-medium text-[#424B47] dark:text-[#B9C4BE]">
            找不到符合條件的工具捷徑
          </p>
          <p className="mt-1 text-xs text-[#7B837E] dark:text-[#7D8A84]">
            嘗試切換分類、清除搜尋字詞，或點擊右上角「新增捷徑」。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const copyKey = `bm-${item.id}`;
            const safeHref = normalizeSafeUrl(item.url);

            return (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-[#E2DFD7] bg-white p-5 transition-colors hover:border-[#C9C4B7] dark:border-[#2D3632] dark:bg-[#1F2522] dark:hover:border-[#3D4B45]"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-semibold leading-snug text-[#232A27] dark:text-[#EAECE9]">
                      {item.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleTogglePin(item.id)}
                      aria-label={item.pinned ? '取消釘選' : '釘選置頂'}
                      className={`shrink-0 cursor-pointer rounded p-1 transition-colors ${
                        item.pinned
                          ? 'text-[#4A6B5D] dark:text-[#7CA392]'
                          : 'text-[#9A9F9B] hover:text-[#4A6B5D] dark:text-[#68746E] dark:hover:text-[#7CA392]'
                      }`}
                    >
                      <Pin
                        className={`h-3.5 w-3.5 ${
                          item.pinned ? 'fill-current' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  {/* 純文字中繼資訊（無膠囊框） */}
                  <div className="flex items-center gap-1.5 text-xs text-[#6B736E] dark:text-[#8E9B94]">
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate font-mono text-[11px]">
                      {getDomainLabel(item.url)}
                    </span>
                    {item.pinned && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#4A6B5D] dark:text-[#7CA392]">
                          已釘選
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-xs leading-relaxed text-[#5A635E] dark:text-[#A4B0AA]">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#F0EEE8] pt-3.5 dark:border-[#28302C]">
                  <div className="flex items-center gap-2">
                    {safeHref && (
                      <a
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[32px] items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-[#4A6B5D] transition-colors hover:bg-[#EEF4F0] dark:text-[#7CA392] dark:hover:bg-[#24322B]"
                      >
                        <ExternalLink
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        <span>前往</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => copyText(item.url, copyKey)}
                      className="inline-flex min-h-[32px] cursor-pointer items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-[#5A635E] transition-colors hover:bg-[#F2F0E8] hover:text-[#232A27] dark:text-[#9AA6A0] dark:hover:bg-[#272F2B] dark:hover:text-[#EAECE9]"
                    >
                      {isCopied(copyKey) ? (
                        <>
                          <Check
                            className="h-3.5 w-3.5 text-[#4A6B5D] dark:text-[#7CA392]"
                            aria-hidden="true"
                          />
                          <span className="text-[#4A6B5D] dark:text-[#7CA392]">
                            已複製
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>複製網址</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => openEditForm(item)}
                      aria-label={`編輯 ${item.title}`}
                      className="cursor-pointer rounded p-1.5 text-[#7B837E] transition-colors hover:bg-[#F2F0E8] hover:text-[#232A27] dark:text-[#8E9B94] dark:hover:bg-[#272F2B] dark:hover:text-[#EAECE9]"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      aria-label={`刪除 ${item.title}`}
                      className="cursor-pointer rounded p-1.5 text-[#7B837E] transition-colors hover:bg-[#FDF4F3] hover:text-[#B84A44] dark:text-[#8E9B94] dark:hover:bg-[#2B1D1C] dark:hover:text-[#E89B96]"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
