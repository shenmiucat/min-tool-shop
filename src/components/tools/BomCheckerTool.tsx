/**
 * 核心工具二：簡易 BOM 料號格式檢查器
 * 支援預設規則與自訂 Regex、多行料號批次檢驗、重複偵測、篩選檢視與一鍵複製結果。
 */

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  CopyX,
  Eraser,
  FileSpreadsheet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';
import type { WorkshopData } from '../../types/workshop';
import {
  evaluateBomList,
  formatBomReportForCopy,
} from '../../utils/bomValidator';

interface BomCheckerToolProps {
  bomState: WorkshopData['bom'];
  onUpdate: (updater: (prev: WorkshopData['bom']) => WorkshopData['bom']) => void;
}

type StatusFilter = 'all' | 'valid' | 'invalid' | 'duplicate';

const SAMPLE_BOM_LINES = [
  'RES-0603-10K',
  'CAP-0402-100N',
  'IC-1024-A1',
  'res-0603-4K7',
  'CAP-0402-100N',
  'CON-205-01',
  'PCB-2026-V2',
  'MCU-3200-F4',
].join('\n');

export function BomCheckerTool({ bomState, onUpdate }: BomCheckerToolProps) {
  const { copyText, isCopied } = useCopyFeedback(1800);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const activeRule = useMemo(() => {
    return (
      bomState.rules.find((r) => r.id === bomState.activeRuleId) ??
      bomState.rules[0]
    );
  }, [bomState.rules, bomState.activeRuleId]);

  const isCustomRule = activeRule.id === 'rule-custom';
  const effectivePattern = isCustomRule
    ? bomState.customPattern
    : activeRule.pattern;
  const effectiveCaseSensitive = isCustomRule
    ? bomState.customCaseSensitive
    : activeRule.caseSensitive;

  const evaluation = useMemo(
    () =>
      evaluateBomList(
        bomState.inputText,
        effectivePattern,
        effectiveCaseSensitive
      ),
    [bomState.inputText, effectivePattern, effectiveCaseSensitive]
  );

  const visibleRows = useMemo(() => {
    if (filter === 'all') return evaluation.rows;
    return evaluation.rows.filter((row) => row.status === filter);
  }, [evaluation.rows, filter]);

  const validCopyText = useMemo(
    () => formatBomReportForCopy(evaluation.rows, 'valid'),
    [evaluation.rows]
  );
  const issuesCopyText = useMemo(
    () => formatBomReportForCopy(evaluation.rows, 'issues'),
    [evaluation.rows]
  );

  const handleSelectRule = (ruleId: string) => {
    onUpdate((prev) => ({
      ...prev,
      activeRuleId: ruleId,
    }));
  };

  const handlePatternChange = (nextPattern: string) => {
    onUpdate((prev) => ({
      ...prev,
      activeRuleId: 'rule-custom',
      customPattern: nextPattern,
    }));
  };

  const handleCaseToggle = (checked: boolean) => {
    onUpdate((prev) => ({
      ...prev,
      activeRuleId: 'rule-custom',
      customCaseSensitive: checked,
    }));
  };

  const handleInputChange = (value: string) => {
    onUpdate((prev) => ({
      ...prev,
      inputText: value,
    }));
  };

  return (
    <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
      {/* 左欄：格式規則與料號輸入 */}
      <div className="flex flex-col justify-between space-y-5 rounded-xl border border-[#E2DFD7] bg-white p-6 lg:col-span-5 dark:border-[#2D3632] dark:bg-[#1F2522]">
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="bom-rule-select"
              className="block text-sm font-semibold text-[#232A27] dark:text-[#EAECE9]"
            >
              驗證規則設定
            </label>
            <select
              id="bom-rule-select"
              value={activeRule.id}
              onChange={(e) => handleSelectRule(e.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-[#D8D4C9] bg-[#FAF9F6] px-3 py-2 text-sm text-[#232A27] dark:border-[#343F3A] dark:bg-[#171C1A] dark:text-[#EAECE9]"
            >
              {bomState.rules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.name}
                </option>
              ))}
            </select>
            <p className="text-xs leading-relaxed text-[#5A635E] dark:text-[#9AA6A0]">
              {activeRule.description} · 範例：
              <span className="font-mono text-[#232A27] dark:text-[#D4DDD8]">
                {activeRule.example}
              </span>
            </p>
          </div>

          <div className="space-y-2 border-t border-[#ECEAE3] pt-4 dark:border-[#2A332F]">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="bom-regex-input"
                className="text-xs font-medium text-[#5A635E] dark:text-[#9AA6A0]"
              >
                正規表達式 (Regex)
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[#5A635E] select-none dark:text-[#9AA6A0]">
                <input
                  type="checkbox"
                  checked={effectiveCaseSensitive}
                  onChange={(e) => handleCaseToggle(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-[#4A6B5D] dark:accent-[#7CA392]"
                />
                <span>區分大小寫</span>
              </label>
            </div>
            <input
              id="bom-regex-input"
              type="text"
              value={effectivePattern}
              onChange={(e) => handlePatternChange(e.target.value)}
              spellCheck={false}
              className="w-full rounded-lg border border-[#D8D4C9] bg-[#FAF9F6] px-3 py-2 font-mono text-xs text-[#232A27] dark:border-[#343F3A] dark:bg-[#171C1A] dark:text-[#EAECE9]"
            />
            {evaluation.regexError && (
              <p className="flex items-start gap-1.5 text-xs text-[#B84A44] dark:text-[#F09A95]">
                <AlertCircle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>Regex 錯誤：{evaluation.regexError}</span>
              </p>
            )}
          </div>

          {/* 多行料號輸入區 */}
          <div className="space-y-2 border-t border-[#ECEAE3] pt-4 dark:border-[#2A332F]">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="bom-textarea"
                className="text-sm font-semibold text-[#232A27] dark:text-[#EAECE9]"
              >
                待檢查料號清單
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleInputChange(SAMPLE_BOM_LINES)}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#4A6B5D] hover:underline dark:text-[#7CA392]"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>載入範例</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('')}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#6B736E] hover:text-[#B84A44] dark:text-[#8E9B94] dark:hover:text-[#F09A95]"
                >
                  <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>清空</span>
                </button>
              </div>
            </div>

            <textarea
              id="bom-textarea"
              rows={11}
              value={bomState.inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              spellCheck={false}
              placeholder="每行貼上一筆料號（也支援從 Excel / CSV 直接貼上多欄，系統會自動擷取第一欄驗證）"
              className="w-full rounded-lg border border-[#D8D4C9] bg-[#FAF9F6] p-3 font-mono text-xs leading-6 text-[#232A27] placeholder:font-sans placeholder:text-[#8A918D] focus:bg-white dark:border-[#343F3A] dark:bg-[#171C1A] dark:text-[#EAECE9] dark:focus:bg-[#1B211E]"
            />
          </div>
        </div>
      </div>

      {/* 右欄：即時檢查統計與結果明細表 */}
      <div className="flex flex-col rounded-xl border border-[#E2DFD7] bg-white p-6 lg:col-span-7 dark:border-[#2D3632] dark:bg-[#1F2522]">
        {/* 統計摘要列（無膠囊，純結構化數字） */}
        <div className="grid grid-cols-2 gap-4 border-b border-[#ECEAE3] pb-5 sm:grid-cols-4 dark:border-[#2A332F]">
          <div>
            <div className="text-xs text-[#5A635E] dark:text-[#9AA6A0]">
              總檢查筆數
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold text-[#232A27] tabular-nums dark:text-[#EAECE9]">
              {evaluation.stats.total}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#4A6B5D] dark:text-[#7CA392]">
              格式合格
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold text-[#4A6B5D] tabular-nums dark:text-[#7CA392]">
              {evaluation.stats.valid}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#B84A44] dark:text-[#E89B96]">
              格式異常
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold text-[#B84A44] tabular-nums dark:text-[#E89B96]">
              {evaluation.stats.invalid}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#B4690E] dark:text-[#DFAC66]">
              重複料號
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold text-[#B4690E] tabular-nums dark:text-[#DFAC66]">
              {evaluation.stats.duplicate}
            </div>
          </div>
        </div>

        {/* 篩選分頁與一鍵複製按鈕列 */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-[#F2F0E8] p-1 dark:bg-[#171C1A]">
            {(
              [
                { id: 'all', label: `全部 (${evaluation.stats.total})` },
                { id: 'valid', label: `合格 (${evaluation.stats.valid})` },
                { id: 'invalid', label: `異常 (${evaluation.stats.invalid})` },
                {
                  id: 'duplicate',
                  label: `重複 (${evaluation.stats.duplicate})`,
                },
              ] as Array<{ id: StatusFilter; label: string }>
            ).map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium tabular-nums transition-colors ${
                    isActive
                      ? 'bg-white text-[#232A27] shadow-xs dark:bg-[#28312D] dark:text-[#EAECE9]'
                      : 'text-[#5A635E] hover:text-[#232A27] dark:text-[#9AA6A0] dark:hover:text-[#EAECE9]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!validCopyText}
              onClick={() => copyText(validCopyText, 'bom-valid')}
              className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#4A6B5D] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#3B574B] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-[#4F7565]"
            >
              {isCopied('bom-valid') ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>已複製</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>複製合格料號</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={!issuesCopyText}
              onClick={() => copyText(issuesCopyText, 'bom-issues')}
              className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#D8D4C9] bg-white px-3 py-1.5 text-xs font-medium text-[#232A27] transition-colors hover:bg-[#F2F0E8] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#343F3A] dark:bg-[#242B28] dark:text-[#EAECE9] dark:hover:bg-[#2C3531]"
            >
              {isCopied('bom-issues') ? (
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
                  <span>複製異常報告</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 檢查結果表格 */}
        <div className="mt-4 flex-1 overflow-x-auto">
          {evaluation.rows.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-[#DFDCD2] px-4 py-10 text-center dark:border-[#2E3834]">
              <p className="text-sm font-medium text-[#424B47] dark:text-[#B9C4BE]">
                尚未輸入料號資料
              </p>
              <p className="mt-1 text-xs text-[#7B837E] dark:text-[#7D8A84]">
                在左側貼上料號或點擊「載入範例」，系統會自動逐行檢查。
              </p>
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center text-xs text-[#7B837E] dark:text-[#7D8A84]">
              目前篩選條件下沒有符合的料號紀錄。
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto rounded-lg border border-[#ECEAE3] dark:border-[#2A332F]">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-[#F7F6F2] text-[#5A635E] dark:bg-[#171C1A] dark:text-[#9AA6A0]">
                  <tr className="border-b border-[#E6E3DB] dark:border-[#2A332F]">
                    <th className="w-14 px-3 py-2.5 font-medium">行號</th>
                    <th className="px-3 py-2.5 font-medium">料號內容</th>
                    <th className="w-24 px-3 py-2.5 font-medium">狀態</th>
                    <th className="px-3 py-2.5 font-medium">檢查說明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EEE8] dark:divide-[#262E2A]">
                  {visibleRows.map((row) => (
                    <tr
                      key={`${row.lineNumber}-${row.raw}`}
                      className="transition-colors hover:bg-[#FAF9F6] dark:hover:bg-[#232A27]"
                    >
                      <td className="px-3 py-2.5 font-mono text-[#7B837E] tabular-nums dark:text-[#828F88]">
                        {String(row.lineNumber).padStart(2, '0')}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-medium text-[#232A27] dark:text-[#EAECE9]">
                        {row.raw}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {row.status === 'valid' && (
                          <span className="inline-flex items-center gap-1 font-medium text-[#3E6253] dark:text-[#86B39F]">
                            <CheckCircle2
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span>合格</span>
                          </span>
                        )}
                        {row.status === 'invalid' && (
                          <span className="inline-flex items-center gap-1 font-medium text-[#B84A44] dark:text-[#EC9A95]">
                            <AlertCircle
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span>異常</span>
                          </span>
                        )}
                        {row.status === 'duplicate' && (
                          <span className="inline-flex items-center gap-1 font-medium text-[#B4690E] dark:text-[#E2B06B]">
                            <CopyX
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span>重複</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[#5A635E] dark:text-[#9AA6A0]">
                        {row.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
