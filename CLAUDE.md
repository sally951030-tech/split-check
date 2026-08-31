# split-check 出遊分帳工具

朋友出遊分攤費用的小工具，跟 [split-bill](../split-bill/CLAUDE.md) 功能一樣。純前端，資料存在瀏覽器 localStorage，不需要伺服器。

已部署到 GitHub Pages：https://sally951030-tech.github.io/split-check/

## 曾經走過的彎路：Notion 版

這個專案原本做過一版「前端 + Node.js 後端 + Notion 資料庫」的架構（練習用小型後端保管 API 密鑰的概念）。後來想把工具部署到 GitHub Pages 才發現：GitHub Pages 只能放純靜態網頁，不能執行 Node.js 後端，所以 Notion 版沒辦法部署上去，只能在自己電腦上用 `npm start` 執行。

為了能公開分享網址給朋友用，改回跟 split-bill 一樣的純前端 + localStorage 架構。Notion 版的程式碼還留在 git 歷史紀錄裡（GitHub repo 的舊 commit），Notion 裡建立的兩個資料庫（成員、花費紀錄）也還在，之後想重新挑戰「前端 + 後端」架構可以回頭參考。

## 資料格式（存在 localStorage）

- `sc_participants`：成員陣列
  ```js
  { id, name }
  ```
- `sc_expenses`：花費紀錄陣列
  ```js
  { id, desc, amount, payerId, splitIds: [participantId, ...] }
  ```
  `splitIds` 是這筆錢由哪些人平均分攤（不一定是全部成員）

## 核心邏輯

- `calculateBalances()`：每人「餘額」= 這人付出的錢總和 − 這人該分攤的錢總和。正數代表別人欠他，負數代表他欠別人
- `calculateSettlements()`：債務簡化演算法，把所有「誰欠誰」簡化成最少次數的轉帳（貪心法：最大債主 vs 最大債務人互相抵銷）
- `buildBalanceText()` / `buildSettlementText()`：把結算結果組成文字，`copyBalanceText()` 負責複製到剪貼簿

## 功能重點

- 新增/移除成員（成員如果已經出現在花費紀錄裡，不能直接移除，要先刪掉相關花費紀錄）
- 新增花費：項目、金額、誰付的、由誰分攤（勾選框，預設全選）
- 花費紀錄列表，可個別刪除；也有「刪除全部花費紀錄」按鈕（按兩次才會真的刪，避免手滑）
- 結算結果：每人應收/應付金額 + 簡化後的轉帳建議
- 複製「應收/應付金額 + 建議轉帳」文字，貼到 IG 群組

## 怎麼打開

用瀏覽器打開 `index.html` 即可，或直接開線上網址。

## 部署到 GitHub Pages

Repo 根目錄要有 `index.html`（GitHub Pages 預設抓根目錄的 index.html 當首頁），所以 `index.html`、`style.css`、`script.js` 都直接放在 `split-check/` 最外層，不能包一層資料夾。Push 到 GitHub 之後，在 repo 的 Settings → Pages 把來源設定成「main branch / root」即可。

## 目前進度 / 之後可以做的事

- [x] MVP：成員管理、花費紀錄、債務簡化結算、複製金額+轉帳文字
- [x] 部署到 GitHub Pages
- [ ] 花費可以不平均分攤（目前只支援平均分攤）
- [ ] 匯出/匯入資料（換裝置用）
