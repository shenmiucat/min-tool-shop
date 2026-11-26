/**
 * BOM 料號格式檢查核心邏輯
 * 獨立純函式模組，支援自訂正規表達式、空白偵測、重複料號偵測與 CSV 輸出。
 */

import type { BomCheckRow } from '../types/workshop';

export interface BomEvaluationResult {
  regexError: string | null;
  rows: BomCheckRow[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
    duplicate: number;
  };
}

/**
 * 逐行驗證輸入的 BOM 料號清單
 */
export function evaluateBomList(
  rawText: string,
  pattern: string,
  caseSensitive: boolean
): BomEvaluationResult {
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, caseSensitive ? '' : 'i');
  } catch (err) {
    return {
      regexError:
        err instanceof Error ? err.message : '正規表達式語法有誤，請檢查括號或跳脫字元。',
      rows: [],
      stats: { total: 0, valid: 0, invalid: 0, duplicate: 0 },
    };
  }

  const lines = rawText.split(/\r?\n/);
  const seenMap = new Map<string, number>();
  const rows: BomCheckRow[] = [];

  let valid = 0;
  let invalid = 0;
  let duplicate = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const lineNumber = index + 1;
    // 若使用者貼上 CSV/Tab 分隔資料，預設取第一欄作為料號
    const firstColumn = trimmed.split(/[\t,]/)[0].trim();
    const compareKey = caseSensitive ? firstColumn : firstColumn.toUpperCase();

    if (/\s/.test(firstColumn)) {
      invalid += 1;
      rows.push({
        lineNumber,
        raw: firstColumn,
        normalized: firstColumn.replace(/\s+/g, ''),
        status: 'invalid',
        reason: '料號中間包含空白字元',
      });
      return;
    }

    const isFormatValid = regex.test(firstColumn);
    if (!isFormatValid) {
      invalid += 1;
      const hint =
        caseSensitive && new RegExp(pattern, 'i').test(firstColumn)
          ? '大小寫不符合規則（需大寫）'
          : '不符合目前料號格式規則';

      rows.push({
        lineNumber,
        raw: firstColumn,
        normalized: firstColumn.toUpperCase(),
        status: 'invalid',
        reason: hint,
      });
      return;
    }

    const firstSeenLine = seenMap.get(compareKey);
    if (firstSeenLine !== undefined) {
      duplicate += 1;
      rows.push({
        lineNumber,
        raw: firstColumn,
        normalized: firstColumn,
        status: 'duplicate',
        reason: `與第 ${firstSeenLine} 行料號重複`,
      });
      return;
    }

    seenMap.set(compareKey, lineNumber);
    valid += 1;
    rows.push({
      lineNumber,
      raw: firstColumn,
      normalized: firstColumn,
      status: 'valid',
      reason: '格式正確',
    });
  });

  return {
    regexError: null,
    rows,
    stats: {
      total: rows.length,
      valid,
      invalid,
      duplicate,
    },
  };
}

/**
 * 組合可複製的純文字報告
 */
export function formatBomReportForCopy(rows: BomCheckRow[], mode: 'valid' | 'issues'): string {
  if (mode === 'valid') {
    return rows
      .filter((row) => row.status === 'valid')
      .map((row) => row.raw)
      .join('\n');
  }

  return rows
    .filter((row) => row.status !== 'valid')
    .map(
      (row) =>
        `第 ${row.lineNumber} 行 | ${row.raw} | ${
          row.status === 'duplicate' ? '重複' : '格式異常'
        }：${row.reason}`
    )
    .join('\n');
}
