/**
 * 使用說明摺疊區元件
 * 置於頁面底部，提供清晰的操作指引、本機儲存備份教學與靜態網站部署說明。
 */

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface GuideItem {
  id: string;
  title: string;
  summary: string;
  points: string[];
}

const GUIDE_ITEMS: GuideItem[] = [
  {
    id: 'guide-tools',
    title: '01. 三個內建小工具怎麼使用？',
    summary: '抽籤器、BOM 料號檢查器與工具入口的快速操作方式',
    points: [
      '靈感與待辦隨機抽籤器：可在右側建立多個自訂清單（支援單筆或批次貼上多行新增），勾選是否納入抽籤池；點擊「開始抽籤」取得結果，並可隨時「一鍵複製結果」。',
      '簡易 BOM 料號格式檢查器：選擇預設料號規則或切換至「自訂正規表達式」，直接貼上單欄或由 Excel / CSV 複製來的多行料號，右側會即時標示合格、格式異常與重複料號，並支援一鍵複製合格清單或異常報告。',
      '常用小工具捷徑入口：用來收納日常高頻使用的網頁工具與文件網址，支援分類篩選、關鍵字搜尋、釘選置頂與一鍵複製網址。',
    ],
  },
  {
    id: 'guide-storage',
    title: '02. 資料存在哪裡？如何備份與跨裝置還原？',
    summary: '純前端 localStorage 儲存機制與 JSON 匯出／匯入說明',
    points: [
      '所有清單項目、BOM 自訂規則、工具捷徑與深淺色偏好皆直接儲存在你目前瀏覽器的 localStorage 中，不會上傳至任何外部伺服器。',
      '若要更換電腦、手機或清除瀏覽器快取前，請點擊上方的「匯出 JSON 備份」，下載帶日期時間的 .json 檔案保存。',
      '在新裝置開啟網站後，點擊「匯入還原」並選取該備份檔，系統會自動檢查格式完整性並還原所有設定。',
    ],
  },
  {
    id: 'guide-deploy',
    title: '03. 如何部署到 GitHub Pages、Vercel 或持續擴充？',
    summary: '純靜態前端架構與模組化檔案路徑指引',
    points: [
      '本專案為純前端 React + Vite + Tailwind CSS 應用，無需後端資料庫。執行 npm run build 產生的 dist 資料夾可直接部署至 GitHub Pages、Vercel、Cloudflare Pages 或 Neocities。',
      '專案結構已依職責拆分：核心資料型別位於 src/types/workshop.ts、本機儲存與 JSON 驗證位於 src/utils/storage.ts、各工具元件獨立放於 src/components/tools/。',
      '後續若想透過 GitHub 新增第四個工具，只需在 src/components/tools/ 新增元件，並在 Navbar 與 App 註冊對應分頁即可。',
    ],
  },
];

export function GuideAccordion() {
  const [openIds, setOpenIds] = useState<string[]>(['guide-tools']);

  const toggleItem = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section
      id="guide"
      aria-labelledby="guide-heading"
      className="mt-12 border-t border-[#E2DFD7] pt-10 dark:border-[#2D3632]"
    >
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2
          id="guide-heading"
          className="text-lg font-semibold tracking-tight text-[#232A27] dark:text-[#EAECE9]"
        >
          使用說明與部署指引
        </h2>
        <p className="text-xs text-[#6B736E] dark:text-[#8E9B94]">
          點擊標題可展開或收合詳細說明
        </p>
      </div>

      <div className="divide-y divide-[#E2DFD7] rounded-xl border border-[#E2DFD7] bg-white dark:divide-[#2D3632] dark:border-[#2D3632] dark:bg-[#1F2522]">
        {GUIDE_ITEMS.map((item) => {
          const isOpen = openIds.includes(item.id);
          return (
            <div key={item.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${item.id}-panel`}
                onClick={() => toggleItem(item.id)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F7F6F2]/70 dark:hover:bg-[#252D29]"
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-[#232A27] dark:text-[#EAECE9]">
                    {item.title}
                  </div>
                  <div className="text-xs text-[#5A635E] dark:text-[#9AA6A0]">
                    {item.summary}
                  </div>
                </div>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 text-[#5A635E] transition-transform duration-200 dark:text-[#9AA6A0] ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div
                  id={`${item.id}-panel`}
                  className="border-t border-[#ECEAE3] bg-[#FAF9F6] px-5 py-4 dark:border-[#2A332F] dark:bg-[#1A1F1D]"
                >
                  <ul className="space-y-2.5 text-sm leading-relaxed text-[#424B47] dark:text-[#B9C4BE]">
                    {item.points.map((point, idx) => (
                      <li key={idx} className="flex gap-2.5">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 font-mono text-xs text-[#4A6B5D] tabular-nums dark:text-[#7CA392]"
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
