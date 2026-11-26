/**
 * 核心工具一：靈感與待辦隨機抽籤器
 * 支援多組自訂清單、單筆/批次新增、項目編輯與刪除、不重複抽籤、歷史紀錄與一鍵複製結果。
 */

import {
  Check,
  Copy,
  ListPlus,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Shuffle,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';
import type { PickerItem, PickerList, WorkshopData } from '../../types/workshop';
import { createId, formatShortTime } from '../../utils/storage';

interface RandomPickerToolProps {
  pickerState: WorkshopData['picker'];
  onUpdate: (
    updater: (prev: WorkshopData['picker']) => WorkshopData['picker']
  ) => void;
}

export function RandomPickerTool({
  pickerState,
  onUpdate,
}: RandomPickerToolProps) {
  const { copyText, isCopied } = useCopyFeedback(1800);

  // 抽籤顯示與動畫狀態
  const [currentResult, setCurrentResult] = useState<PickerItem | null>(null);
  const [rollingPreview, setRollingPreview] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const rollTimerRef = useRef<number | null>(null);

  // 清單與項目操作 UI 狀態
  const [newItemText, setNewItemText] = useState('');
  const [newItemNote, setNewItemNote] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 新增清單表單與刪除確認
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [confirmDeleteList, setConfirmDeleteList] = useState(false);

  // 項目行內編輯狀態
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingNote, setEditingNote] = useState('');

  useEffect(() => {
    return () => {
      if (rollTimerRef.current !== null) {
        window.clearTimeout(rollTimerRef.current);
      }
    };
  }, []);

  const activeList: PickerList = useMemo(() => {
    return (
      pickerState.lists.find((l) => l.id === pickerState.activeListId) ??
      pickerState.lists[0]
    );
  }, [pickerState.lists, pickerState.activeListId]);

  const drawnIds = useMemo(
    () => pickerState.drawnIdsByList[activeList.id] ?? [],
    [pickerState.drawnIdsByList, activeList.id]
  );

  const enabledItems = useMemo(
    () => activeList.items.filter((item) => item.enabled),
    [activeList.items]
  );

  const availablePool = useMemo(() => {
    if (!pickerState.noRepeat) return enabledItems;
    return enabledItems.filter((item) => !drawnIds.includes(item.id));
  }, [enabledItems, pickerState.noRepeat, drawnIds]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeList.items;
    return activeList.items.filter(
      (item) =>
        item.text.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q))
    );
  }, [activeList.items, searchQuery]);

  const listHistory = useMemo(
    () => pickerState.history.slice(0, 8),
    [pickerState.history]
  );

  // 切換清單時清理暫存 UI 狀態
  const handleSelectList = (listId: string) => {
    setCurrentResult(null);
    setRollingPreview(null);
    setEditingItemId(null);
    setConfirmDeleteList(false);
    setSearchQuery('');
    onUpdate((prev) => ({
      ...prev,
      activeListId: listId,
    }));
  };

  // 執行隨機抽籤
  const handleDraw = () => {
    if (isRolling || enabledItems.length === 0) return;

    // 若啟用不重複模式且本輪已全數抽完，先自動重設本輪再抽
    let pool = availablePool;
    let shouldResetRound = false;
    if (pool.length === 0 && pickerState.noRepeat && enabledItems.length > 0) {
      pool = enabledItems;
      shouldResetRound = true;
    }
    if (pool.length === 0) return;

    const picked = pool[Math.floor(Math.random() * pool.length)];
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const finalizePick = () => {
      setIsRolling(false);
      setRollingPreview(null);
      setCurrentResult(picked);

      onUpdate((prev) => {
        const existingDrawn = shouldResetRound
          ? []
          : prev.drawnIdsByList[activeList.id] ?? [];
        const nextDrawn = prev.noRepeat
          ? Array.from(new Set([...existingDrawn, picked.id]))
          : existingDrawn;

        const nextHistory = [
          {
            id: createId('hist'),
            listId: activeList.id,
            listName: activeList.name,
            resultText: picked.text,
            drawnAt: new Date().toISOString(),
          },
          ...prev.history,
        ].slice(0, 30);

        return {
          ...prev,
          drawnIdsByList: {
            ...prev.drawnIdsByList,
            [activeList.id]: nextDrawn,
          },
          history: nextHistory,
        };
      });
    };

    if (prefersReducedMotion || pool.length === 1) {
      finalizePick();
      return;
    }

    // 快速 3 幀切換（共 180ms，維持高回應速度）
    setIsRolling(true);
    let step = 0;
    const tick = () => {
      if (step < 3) {
        const previewItem = pool[Math.floor(Math.random() * pool.length)];
        setRollingPreview(previewItem.text);
        step += 1;
        rollTimerRef.current = window.setTimeout(tick, 55);
      } else {
        finalizePick();
      }
    };
    tick();
  };

  const handleResetRound = () => {
    onUpdate((prev) => ({
      ...prev,
      drawnIdsByList: {
        ...prev.drawnIdsByList,
        [activeList.id]: [],
      },
    }));
  };

  const handleToggleNoRepeat = () => {
    onUpdate((prev) => ({
      ...prev,
      noRepeat: !prev.noRepeat,
    }));
  };

  // 新增單筆項目
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemText.trim();
    if (!trimmed) return;

    const newItem: PickerItem = {
      id: createId('item'),
      text: trimmed,
      note: newItemNote.trim() || undefined,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    onUpdate((prev) => ({
      ...prev,
      lists: prev.lists.map((list) =>
        list.id === activeList.id
          ? { ...list, items: [newItem, ...list.items] }
          : list
      ),
    }));

    setNewItemText('');
    setNewItemNote('');
  };

  // 批次新增多行項目
  const handleBatchAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = batchText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const now = new Date().toISOString();
    const createdItems: PickerItem[] = lines.map((text) => ({
      id: createId('item'),
      text,
      enabled: true,
      createdAt: now,
    }));

    onUpdate((prev) => ({
      ...prev,
      lists: prev.lists.map((list) =>
        list.id === activeList.id
          ? { ...list, items: [...createdItems, ...list.items] }
          : list
      ),
    }));

    setBatchText('');
    setBatchMode(false);
  };

  const handleToggleItemEnabled = (itemId: string) => {
    onUpdate((prev) => ({
      ...prev,
      lists: prev.lists.map((list) =>
        list.id === activeList.id
          ? {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, enabled: !item.enabled } : item
              ),
            }
          : list
      ),
    }));
  };

  const handleDeleteItem = (itemId: string) => {
    if (currentResult?.id === itemId) {
      setCurrentResult(null);
    }
    onUpdate((prev) => ({
      ...prev,
      drawnIdsByList: {
        ...prev.drawnIdsByList,
        [activeList.id]: (prev.drawnIdsByList[activeList.id] ?? []).filter(
          (id) => id !== itemId
        ),
      },
      lists: prev.lists.map((list) =>
        list.id === activeList.id
          ? {
              ...list,
              items: list.items.filter((item) => item.id !== itemId),
            }
          : list
      ),
    }));
  };

  const startEditingItem = (item: PickerItem) => {
    setEditingItemId(item.id);
    setEditingText(item.text);
    setEditingNote(item.note ?? '');
  };

  const handleSaveEdit = (itemId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;

    onUpdate((prev) => ({
      ...prev,
      lists: prev.lists.map((list) =>
        list.id === activeList.id
          ? {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      text: trimmed,
                      note: editingNote.trim() || undefined,
                    }
                  : item
              ),
            }
          : list
      ),
    }));

    if (currentResult?.id === itemId) {
      setCurrentResult((prev) =>
        prev
          ? { ...prev, text: trimmed, note: editingNote.trim() || undefined }
          : null
      );
    }
    setEditingItemId(null);
  };

  // 建立自訂清單
  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newListName.trim();
    if (!name) return;

    const newList: PickerList = {
      id: createId('list'),
      name,
      description: newListDesc.trim() || '自訂抽籤清單',
      items: [],
    };

    onUpdate((prev) => ({
      ...prev,
      activeListId: newList.id,
      lists: [...prev.lists, newList],
    }));

    setNewListName('');
    setNewListDesc('');
    setShowNewListForm(false);
    setCurrentResult(null);
  };

  // 刪除目前清單（保留至少一組清單）
  const handleDeleteCurrentList = () => {
    if (pickerState.lists.length <= 1) return;
    const remaining = pickerState.lists.filter((l) => l.id !== activeList.id);
    onUpdate((prev) => {
      const nextDrawn = { ...prev.drawnIdsByList };
      delete nextDrawn[activeList.id];
      return {
        ...prev,
        activeListId: remaining[0].id,
        drawnIdsByList: nextDrawn,
        lists: remaining,
      };
    });
    setCurrentResult(null);
    setConfirmDeleteList(false);
  };

  const handleClearHistory = () => {
    onUpdate((prev) => ({
      ...prev,
      history: [],
    }));
  };

  const resultCopyPayload = currentResult
    ? currentResult.note
      ? `${currentResult.text}（${currentResult.note}）`
      : currentResult.text
    : '';

  return (
    <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
      {/* 左欄：主抽籤區與近期紀錄 */}
      <div className="flex flex-col justify-between rounded-xl border border-[#E2DFD7] bg-white p-6 sm:p-7 lg:col-span-7 dark:border-[#2D3632] dark:bg-[#1F2522]">
        <div className="space-y-6">
          {/* 清單資訊與狀態文字（無膠囊外框） */}
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#232A27] dark:text-[#EAECE9]">
                {activeList.name}
              </h2>
              <p className="mt-0.5 text-xs text-[#5A635E] dark:text-[#9AA6A0]">
                {activeList.description}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#5A635E] tabular-nums dark:text-[#9AA6A0]">
              <span>
                候選 {availablePool.length} / {enabledItems.length} 項
              </span>
              <span aria-hidden="true">·</span>
              <span>共 {activeList.items.length} 項</span>
            </div>
          </div>

          {/* 抽籤結果焦點顯示舞台 */}
          <div className="flex min-h-[210px] flex-col items-center justify-center rounded-lg border border-[#E6E3DB] bg-[#F7F6F2] px-6 py-8 text-center dark:border-[#2C3531] dark:bg-[#171C1A]">
            {enabledItems.length === 0 ? (
              <div className="max-w-sm space-y-1.5">
                <p className="text-sm font-medium text-[#232A27] dark:text-[#EAECE9]">
                  目前清單沒有可抽取的項目
                </p>
                <p className="text-xs leading-relaxed text-[#5A635E] dark:text-[#9AA6A0]">
                  請於右側新增項目，或勾選啟用至少一個現有項目後即可開始抽籤。
                </p>
              </div>
            ) : isRolling && rollingPreview ? (
              <div className="space-y-2">
                <p className="text-xs text-[#5A635E] dark:text-[#9AA6A0]">
                  隨機挑選中
                </p>
                <p className="text-balance text-2xl font-bold text-[#4A6B5D] sm:text-3xl dark:text-[#7CA392]">
                  {rollingPreview}
                </p>
              </div>
            ) : currentResult ? (
              <div className="space-y-2.5">
                <p className="text-xs text-[#4A6B5D] dark:text-[#7CA392]">
                  本次抽中結果
                </p>
                <p className="text-balance text-2xl font-bold tracking-tight text-[#232A27] sm:text-[30px] dark:text-[#EAECE9]">
                  {currentResult.text}
                </p>
                {currentResult.note && (
                  <p className="text-sm text-[#5A635E] dark:text-[#9AA6A0]">
                    備註：{currentResult.note}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-base font-medium text-[#232A27] dark:text-[#EAECE9]">
                  準備好了嗎？
                </p>
                <p className="text-xs text-[#5A635E] dark:text-[#9AA6A0]">
                  點擊下方「開始抽籤」，從目前啟用的 {enabledItems.length}{' '}
                  個項目中隨機挑出一個。
                </p>
              </div>
            )}
          </div>

          {/* 主要操作列 */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDraw}
              disabled={enabledItems.length === 0 || isRolling}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 whitespace-nowrap cursor-pointer rounded-lg bg-[#4A6B5D] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3B574B] disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none dark:bg-[#4F7565] dark:hover:bg-[#5B8574]"
            >
              <Shuffle className="h-4 w-4" aria-hidden="true" />
              <span>
                {availablePool.length === 0 &&
                pickerState.noRepeat &&
                enabledItems.length > 0
                  ? '開始新一輪抽籤'
                  : '開始抽籤'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => copyText(resultCopyPayload, 'main-result')}
              disabled={!currentResult}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap cursor-pointer rounded-lg border border-[#D8D4C9] bg-white px-4 py-2.5 text-sm font-medium text-[#232A27] transition-colors hover:border-[#4A6B5D]/60 hover:bg-[#F2F0E8] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#343F3A] dark:bg-[#242B28] dark:text-[#EAECE9] dark:hover:border-[#7CA392]/60 dark:hover:bg-[#2B3430]"
            >
              {isCopied('main-result') ? (
                <>
                  <Check
                    className="h-4 w-4 text-[#4A6B5D] dark:text-[#7CA392]"
                    aria-hidden="true"
                  />
                  <span className="text-[#4A6B5D] dark:text-[#7CA392]">
                    已複製
                  </span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  <span>一鍵複製結果</span>
                </>
              )}
            </button>

            {pickerState.noRepeat && drawnIds.length > 0 && (
              <button
                type="button"
                onClick={handleResetRound}
                className="inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-[#5A635E] transition-colors hover:bg-[#EFEDE7] hover:text-[#232A27] dark:text-[#9AA6A0] dark:hover:bg-[#272F2B] dark:hover:text-[#EAECE9]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>重設本輪（已抽 {drawnIds.length}）</span>
              </button>
            )}
          </div>

          {/* 抽籤偏好設定 */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ECEAE3] pt-4 dark:border-[#2A332F]">
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-xs text-[#424B47] select-none dark:text-[#B9C4BE]">
              <input
                type="checkbox"
                checked={pickerState.noRepeat}
                onChange={handleToggleNoRepeat}
                className="h-4 w-4 rounded border-[#C8C3B8] accent-[#4A6B5D] dark:accent-[#7CA392]"
              />
              <span>抽過暫不重複（直到整份清單抽完或手動重設）</span>
            </label>
          </div>
        </div>

        {/* 近期抽籤紀錄 */}
        <div className="mt-6 border-t border-[#ECEAE3] pt-5 dark:border-[#2A332F]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#5A635E] dark:text-[#9AA6A0]">
              近期抽籤紀錄
            </h3>
            {listHistory.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="cursor-pointer text-xs text-[#6B736E] transition-colors hover:text-[#B84A44] dark:text-[#8E9B94] dark:hover:text-[#E89B96]"
              >
                清空紀錄
              </button>
            )}
          </div>

          {listHistory.length === 0 ? (
            <p className="text-xs text-[#7B837E] dark:text-[#7D8A84]">
              尚未有抽籤紀錄，抽出的結果會自動保留於此並方便再次複製。
            </p>
          ) : (
            <ul className="divide-y divide-[#F0EEE8] dark:divide-[#28302C]">
              {listHistory.map((entry) => {
                const copyKey = `hist-${entry.id}`;
                return (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-[#232A27] dark:text-[#EAECE9]">
                        {entry.resultText}
                      </span>
                      <span className="text-[11px] text-[#6B736E] tabular-nums dark:text-[#8E9B94]">
                        {entry.listName} · {formatShortTime(entry.drawnAt)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(entry.resultText, copyKey)}
                      className="inline-flex min-h-[32px] shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium text-[#5A635E] transition-colors hover:bg-[#F2F0E8] hover:text-[#232A27] dark:text-[#9AA6A0] dark:hover:bg-[#272F2B] dark:hover:text-[#EAECE9]"
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
                          <span>複製</span>
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* 右欄：清單管理與項目編輯區 */}
      <div className="flex flex-col rounded-xl border border-[#E2DFD7] bg-white p-6 lg:col-span-5 dark:border-[#2D3632] dark:bg-[#1F2522]">
        {/* 清單切換器 */}
        <div className="space-y-3 border-b border-[#ECEAE3] pb-4 dark:border-[#2A332F]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#232A27] dark:text-[#EAECE9]">
              自訂清單管理
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowNewListForm((v) => !v)}
                className="inline-flex min-h-[34px] cursor-pointer items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium text-[#4A6B5D] transition-colors hover:bg-[#EEF4F0] dark:text-[#7CA392] dark:hover:bg-[#24322B]"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>新增清單</span>
              </button>

              {pickerState.lists.length > 1 && !confirmDeleteList && (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteList(true)}
                  aria-label="刪除此清單"
                  className="inline-flex min-h-[34px] cursor-pointer items-center rounded-md px-2 py-1 text-xs text-[#6B736E] transition-colors hover:bg-[#FDF4F3] hover:text-[#B84A44] dark:text-[#8E9B94] dark:hover:bg-[#2B1D1C] dark:hover:text-[#E89B96]"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {confirmDeleteList && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[#B84A44]/35 bg-[#FDF5F4] px-3 py-2 text-xs dark:border-[#D97A75]/35 dark:bg-[#2A1D1C]">
              <span className="text-[#963833] dark:text-[#F0B4B0]">
                刪除「{activeList.name}」清單？
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDeleteCurrentList}
                  className="cursor-pointer rounded bg-[#B84A44] px-2.5 py-1 font-medium text-white hover:bg-[#9E3C37]"
                >
                  確認刪除
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteList(false)}
                  className="cursor-pointer rounded px-2 py-1 text-[#5A635E] hover:text-[#232A27] dark:text-[#B9C4BE]"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 清單按鈕列 */}
          <div className="flex flex-wrap gap-1.5">
            {pickerState.lists.map((list) => {
              const isSelected = list.id === activeList.id;
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => handleSelectList(list.id)}
                  className={`min-h-[34px] cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#4A6B5D] text-white dark:bg-[#4F7565]'
                      : 'bg-[#F2F0E8] text-[#424B47] hover:bg-[#E7E4DA] dark:bg-[#262E2A] dark:text-[#B9C4BE] dark:hover:bg-[#303A35]'
                  }`}
                >
                  {list.name}
                </button>
              );
            })}
          </div>

          {/* 新增清單折疊表單 */}
          {showNewListForm && (
            <form
              onSubmit={handleCreateList}
              className="space-y-2.5 rounded-lg border border-[#E2DFD7] bg-[#F7F6F2] p-3 dark:border-[#2D3632] dark:bg-[#171C1A]"
            >
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="輸入新清單名稱（例如：週末電影清單）"
                className="w-full rounded-md border border-[#D8D4C9] bg-white px-3 py-2 text-xs text-[#232A27] placeholder:text-[#8A918D] dark:border-[#343F3A] dark:bg-[#1F2522] dark:text-[#EAECE9]"
                required
              />
              <input
                type="text"
                value={newListDesc}
                onChange={(e) => setNewListDesc(e.target.value)}
                placeholder="簡短說明（選填）"
                className="w-full rounded-md border border-[#D8D4C9] bg-white px-3 py-2 text-xs text-[#232A27] placeholder:text-[#8A918D] dark:border-[#343F3A] dark:bg-[#1F2522] dark:text-[#EAECE9]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewListForm(false)}
                  className="cursor-pointer rounded-md px-3 py-1.5 text-xs text-[#5A635E] hover:text-[#232A27] dark:text-[#9AA6A0]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-md bg-[#4A6B5D] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#3B574B] dark:bg-[#4F7565]"
                >
                  建立清單
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 新增項目表單（支援單筆與批次模式） */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5A635E] dark:text-[#9AA6A0]">
              {batchMode ? '批次新增（每行一項）' : '新增抽籤項目'}
            </span>
            <button
              type="button"
              onClick={() => setBatchMode((v) => !v)}
              className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#4A6B5D] hover:underline dark:text-[#7CA392]"
            >
              <ListPlus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{batchMode ? '切換單筆新增' : '批次貼上多筆'}</span>
            </button>
          </div>

          {!batchMode ? (
            <form onSubmit={handleAddItem} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="輸入待辦或靈感項目..."
                  className="min-h-[40px] flex-1 rounded-lg border border-[#D8D4C9] bg-[#FAF9F6] px-3 py-2 text-sm text-[#232A27] placeholder:text-[#8A918D] focus:bg-white dark:border-[#343F3A] dark:bg-[#171C1A] dark:text-[#EAECE9] dark:focus:bg-[#1B211E]"
                />
                <button
                  type="submit"
                  disabled={!newItemText.trim()}
                  className="inline-flex min-h-[40px] shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg bg-[#4A6B5D] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#3B574B] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-[#4F7565]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>新增</span>
                </button>
              </div>
              <input
                type="text"
                value={newItemNote}
                onChange={(e) => setNewItemNote(e.target.value)}
                placeholder="補充備註（選填，例如：預計 15 分鐘）"
                className="w-full rounded-lg border border-[#E6E3DB] bg-transparent px-3 py-1.5 text-xs text-[#424B47] placeholder:text-[#969D98] dark:border-[#2C3531] dark:text-[#B9C4BE] dark:placeholder:text-[#6E7A74]"
              />
            </form>
          ) : (
            <form onSubmit={handleBatchAdd} className="space-y-2">
              <textarea
                rows={4}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={'每行輸入一個項目，例如：\n閱讀技術文章 15 分鐘\n整理書籤資料夾\n散步 20 分鐘'}
                className="w-full rounded-lg border border-[#D8D4C9] bg-[#FAF9F6] p-3 text-xs leading-relaxed text-[#232A27] placeholder:text-[#8A918D] dark:border-[#343F3A] dark:bg-[#171C1A] dark:text-[#EAECE9]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBatchMode(false)}
                  className="cursor-pointer rounded-md px-3 py-1.5 text-xs text-[#5A635E] dark:text-[#9AA6A0]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!batchText.trim()}
                  className="cursor-pointer rounded-md bg-[#4A6B5D] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#3B574B] disabled:opacity-45 dark:bg-[#4F7565]"
                >
                  批次加入清單
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 項目搜尋與清單列表 */}
        <div className="mt-4 flex flex-1 flex-col border-t border-[#ECEAE3] pt-4 dark:border-[#2A332F]">
          {activeList.items.length > 0 && (
            <div className="relative mb-3">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A918D]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="篩選清單項目..."
                className="w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] py-1.5 pl-8 pr-3 text-xs text-[#232A27] placeholder:text-[#8A918D] dark:border-[#2D3632] dark:bg-[#171C1A] dark:text-[#EAECE9]"
              />
            </div>
          )}

          {activeList.items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
              <p className="text-xs font-medium text-[#424B47] dark:text-[#B9C4BE]">
                這份清單目前是空的
              </p>
              <p className="mt-1 text-xs text-[#7B837E] dark:text-[#7D8A84]">
                從上方輸入框新增第一個項目吧。
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#7B837E] dark:text-[#7D8A84]">
              找不到符合「{searchQuery}」的項目。
            </p>
          ) : (
            <ul className="max-h-[340px] divide-y divide-[#F0EEE8] overflow-y-auto pr-1 dark:divide-[#28302C]">
              {filteredItems.map((item) => {
                const isAlreadyDrawn =
                  pickerState.noRepeat && drawnIds.includes(item.id);
                const isEditing = editingItemId === item.id;

                if (isEditing) {
                  return (
                    <li key={item.id} className="space-y-2 py-2.5">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full rounded-md border border-[#4A6B5D] bg-white px-2.5 py-1.5 text-xs text-[#232A27] dark:border-[#7CA392] dark:bg-[#171C1A] dark:text-[#EAECE9]"
                      />
                      <input
                        type="text"
                        value={editingNote}
                        onChange={(e) => setEditingNote(e.target.value)}
                        placeholder="備註（選填）"
                        className="w-full rounded-md border border-[#D8D4C9] bg-white px-2.5 py-1 text-xs text-[#5A635E] dark:border-[#343F3A] dark:bg-[#171C1A] dark:text-[#9AA6A0]"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingItemId(null)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs text-[#5A635E] hover:bg-[#F2F0E8] dark:text-[#9AA6A0] dark:hover:bg-[#272F2B]"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>取消</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item.id)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded bg-[#4A6B5D] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#3B574B] dark:bg-[#4F7565]"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>儲存</span>
                        </button>
                      </div>
                    </li>
                  );
                }

                return (
                  <li
                    key={item.id}
                    className="group flex items-start justify-between gap-2.5 py-2.5"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={() => handleToggleItemEnabled(item.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C8C3B8] accent-[#4A6B5D] dark:accent-[#7CA392]"
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block break-words text-sm leading-snug ${
                            !item.enabled
                              ? 'text-[#969D98] line-through dark:text-[#66736D]'
                              : 'text-[#232A27] dark:text-[#EAECE9]'
                          }`}
                        >
                          {item.text}
                        </span>
                        {(item.note || isAlreadyDrawn) && (
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#6B736E] dark:text-[#8E9B94]">
                            {item.note && <span>{item.note}</span>}
                            {item.note && isAlreadyDrawn && (
                              <span aria-hidden="true">·</span>
                            )}
                            {isAlreadyDrawn && (
                              <span className="text-[#4A6B5D] dark:text-[#7CA392]">
                                本輪已抽過
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                    </label>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => startEditingItem(item)}
                        aria-label={`編輯 ${item.text}`}
                        className="cursor-pointer rounded p-1.5 text-[#7B837E] transition-colors hover:bg-[#F2F0E8] hover:text-[#232A27] dark:text-[#8E9B94] dark:hover:bg-[#272F2B] dark:hover:text-[#EAECE9]"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        aria-label={`刪除 ${item.text}`}
                        className="cursor-pointer rounded p-1.5 text-[#7B837E] transition-colors hover:bg-[#FDF4F3] hover:text-[#B84A44] dark:text-[#8E9B94] dark:hover:bg-[#2B1D1C] dark:hover:text-[#E89B96]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
