/**
 * 預設初始資料
 * 首次開啟或使用者選擇重設時載入，提供立即可用的示範清單與規則。
 */

import type { WorkshopData } from '../types/workshop';

export const CURRENT_SCHEMA_VERSION = 1;

export function createDefaultWorkshopData(): WorkshopData {
  const now = new Date().toISOString();

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    updatedAt: now,
    activeTool: 'picker',
    picker: {
      activeListId: 'list-daily-tasks',
      noRepeat: true,
      drawnIdsByList: {},
      lists: [
        {
          id: 'list-daily-tasks',
          name: '今日微待辦',
          description: '卡關不知道先做哪一件時，交給抽籤決定下一步。',
          items: [
            {
              id: 'item-1',
              text: '整理桌面並歸位常用工具',
              note: '限時 10 分鐘',
              enabled: true,
              createdAt: now,
            },
            {
              id: 'item-2',
              text: '回覆尚未處理的重要信件',
              note: '先清掉 3 封即可',
              enabled: true,
              createdAt: now,
            },
            {
              id: 'item-3',
              text: '備份本週專案進度與筆記',
              note: '同步至 GitHub',
              enabled: true,
              createdAt: now,
            },
            {
              id: 'item-4',
              text: '起身伸展並補充一杯溫開水',
              note: '護眼休息 5 分鐘',
              enabled: true,
              createdAt: now,
            },
            {
              id: 'item-5',
              text: '檢視待辦清單並刪減不緊急項目',
              note: '保持專注',
              enabled: true,
              createdAt: now,
            },
          ],
        },
        {
          id: 'list-creative-sparks',
          name: '靈感與創作題目',
          description: '隨手記下的點子庫，隨時抽一個來做 15 分鐘小實驗。',
          items: [
            {
              id: 'spark-1',
              text: '寫一篇 300 字的本週工作心得',
              enabled: true,
              createdAt: now,
            },
            {
              id: 'spark-2',
              text: '設計一個可重用的個人捷徑卡片樣式',
              enabled: true,
              createdAt: now,
            },
            {
              id: 'spark-3',
              text: '整理一份常用快捷鍵小抄',
              enabled: true,
              createdAt: now,
            },
            {
              id: 'spark-4',
              text: '挑選三個值得研究的開源小工具',
              enabled: true,
              createdAt: now,
            },
          ],
        },
        {
          id: 'list-lunch',
          name: '今天吃什麼',
          description: '解決午餐與晚餐的選擇困難。',
          items: [
            { id: 'lunch-1', text: '日式定食與味噌湯', enabled: true, createdAt: now },
            { id: 'lunch-2', text: '清燉牛肉麵加燙青菜', enabled: true, createdAt: now },
            { id: 'lunch-3', text: '烤雞腿健康餐盒', enabled: true, createdAt: now },
            { id: 'lunch-4', text: '泰式打拋豬飯', enabled: true, createdAt: now },
            { id: 'lunch-5', text: '手沖咖啡配酸種麵包三明治', enabled: true, createdAt: now },
          ],
        },
      ],
      history: [],
    },
    bom: {
      activeRuleId: 'rule-standard-pn',
      customPattern: '^[A-Z]{2,3}-\\d{4}-[A-Z0-9]{2}$',
      customCaseSensitive: true,
      inputText: [
        'RES-0603-10K',
        'CAP-0402-100N',
        'IC-1024-A1',
        'res-0603-4K7',
        'CAP-0402-100N',
        'CON-205-01',
        'PCB-2026-V2',
      ].join('\n'),
      rules: [
        {
          id: 'rule-standard-pn',
          name: '標準三段式料號',
          pattern: '^[A-Z]{2,4}-\\d{4}-[A-Z0-9]{2,4}$',
          example: 'RES-0603-10K / IC-1024-A1',
          description: '類別碼(2-4大寫字母) - 4碼數字 - 規格碼(2-4碼英數)',
          caseSensitive: true,
        },
        {
          id: 'rule-numeric-10',
          name: '10 碼純數字料號',
          pattern: '^\\d{10}$',
          example: '2026040199',
          description: '固定 10 碼純阿拉伯數字，不含空白或符號',
          caseSensitive: false,
        },
        {
          id: 'rule-smd-passive',
          name: '被動元件規格碼',
          pattern: '^[RCL]\\d{4}-[0-9A-Z.]+-[15]%$',
          example: 'R0603-10K-1% / C0402-0.1U-5%',
          description: 'R/C/L 封裝四碼 - 數值 - 誤差百分比(1% 或 5%)',
          caseSensitive: true,
        },
        {
          id: 'rule-custom',
          name: '自訂正規表達式 (Regex)',
          pattern: '^[A-Z]{2,3}-\\d{4}-[A-Z0-9]{2}$',
          example: '依自訂 Regex 規則即時驗證',
          description: '可自由輸入任意 JavaScript Regex 進行料號格式比對',
          caseSensitive: true,
        },
      ],
    },
    bookmarks: {
      items: [
        {
          id: 'bm-1',
          title: 'Regex101 正規表達式測試',
          url: 'https://regex101.com/',
          category: '開發工具',
          description: '即時驗證與拆解正規表達式語法，寫料號規則必備。',
          pinned: true,
          createdAt: now,
        },
        {
          id: 'bm-2',
          title: 'Excalidraw 手繪流程圖',
          url: 'https://excalidraw.com/',
          category: '設計與視覺',
          description: '免登入快速繪製系統架構圖、線框稿與筆記圖解。',
          pinned: true,
          createdAt: now,
        },
        {
          id: 'bm-3',
          title: 'JSON Formatter & Validator',
          url: 'https://jsonformatter.curiousconcept.com/',
          category: '開發工具',
          description: '快速格式化、壓縮與檢查 JSON 檔案語法錯誤。',
          pinned: false,
          createdAt: now,
        },
        {
          id: 'bm-4',
          title: 'WebAIM Contrast Checker',
          url: 'https://webaim.org/resources/contrastchecker/',
          category: '設計與視覺',
          description: '檢驗網頁文字與背景的 WCAG 護眼對比度。',
          pinned: false,
          createdAt: now,
        },
        {
          id: 'bm-5',
          title: 'TinyPNG 圖片壓縮',
          url: 'https://tinypng.com/',
          category: '日常效率',
          description: '快速壓縮 PNG / JPG / WebP 檔案大小，維持畫質清晰。',
          pinned: false,
          createdAt: now,
        },
        {
          id: 'bm-6',
          title: 'GitHub Pages 官方文件',
          url: 'https://pages.github.com/',
          category: '文件與部署',
          description: '純靜態網站免費部署指南與自訂網域設定參考。',
          pinned: false,
          createdAt: now,
        },
      ],
    },
  };
}
