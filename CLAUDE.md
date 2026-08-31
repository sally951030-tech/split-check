# split-check 出遊分帳工具（Notion 版）

朋友出遊分攤費用的小工具，跟 [split-bill](../split-bill/CLAUDE.md) 功能一樣，但資料改存在 Notion，不是瀏覽器 localStorage。這是第一個「前端 + 後端」的練習專案。

## 架構

- `public/`：前端，純 HTML/CSS/原生 JavaScript，畫面本身
- `server/`：後端，Node.js + Express，負責保管 Notion API 密鑰，幫前端讀寫 Notion 資料
- 前端不會直接呼叫 Notion API，而是呼叫自己後端的 `/api/...`，由後端轉發給 Notion。這樣密鑰不會出現在瀏覽器看得到的程式碼裡

## Notion 資料庫

已經建立在 Notion 裡：[Split Check 分帳](https://app.notion.com/p/3cddd29e30d381ddb278c6c11e011f35)

- **成員**（`NOTION_PARTICIPANTS_DB_ID`）：欄位「姓名」
- **花費紀錄**（`NOTION_EXPENSES_DB_ID`）：欄位「項目」「金額」「付款人」（關聯到成員）「分攤人」（關聯到成員，可多選）

## 第一次啟動前的準備

### 1. 安裝 Node.js

到 https://nodejs.org 下載 LTS 版本安裝，裝完重開一個新的終端機視窗。

### 2. 申請 Notion Integration 密鑰

1. 打開 https://www.notion.so/my-integrations
2. 點「New integration」，取個名字（例如 split-check），Associated workspace 選你自己的工作區
3. 建立後，在「Configuration」頁籤裡找到「Internal Integration Secret」，複製起來（這組是密鑰，不要分享給別人）
4. 打開 [Split Check 分帳](https://app.notion.com/p/3cddd29e30d381ddb278c6c11e011f35) 頁面，右上角「⋯」→「Connections」（連結）→ 把剛剛建立的 integration 加進去，這樣後端程式才有權限讀寫這個頁面下的資料庫

### 3. 設定密鑰

在 `server/` 資料夾裡：

1. 複製 `.env.example`，改名成 `.env`
2. 打開 `.env`，把 `NOTION_API_KEY=` 後面貼上剛剛複製的密鑰

### 4. 安裝套件並啟動

```bash
cd server
npm install
npm start
```

看到「split-check 伺服器啟動了」，就打開瀏覽器到 `http://localhost:3000` 使用。

## 資料格式

跟 split-bill 概念一樣，只是存放位置從 localStorage 換成 Notion：

- 成員：`{ id, name }`
- 花費紀錄：`{ id, desc, amount, payerId, splitIds: [participantId, ...] }`

`server/mappers.js` 負責把 Notion 的頁面格式（`properties.姓名.title[0].plain_text` 這種寫法）轉成上面這種簡單的 JSON，前端完全不用知道 Notion 的資料格式長怎樣。

## 程式撰寫原則：模組化（積木化）

跟其他專案一樣，每個功能寫成獨立函式：

- `server/notion.js`：只負責跟 Notion API 溝通（查詢、新增、封存頁面），不管資料格式
- `server/mappers.js`：只負責把 Notion 格式 ↔ 前端好用的簡單格式互相轉換
- `server/server.js`：只負責定義 API 路由，串接上面兩個模組
- `public/script.js`：前端邏輯，`calculateBalances()` / `calculateSettlements()` 這兩個核心結算函式維持跟 split-bill 一樣的純函式寫法（給資料、算結果，不碰畫面、不碰網路）

## 功能重點

- 新增/移除成員（成員如果已經出現在花費紀錄裡，不能直接移除，要先刪掉相關花費紀錄）
- 新增花費：項目、金額、誰付的、由誰分攤（勾選框，預設全選）
- 花費紀錄列表，可個別刪除
- 結算結果：每人應收/應付金額 + 簡化後的轉帳建議
- 複製「每人應收/應付金額」文字，貼到 IG 群組

## 目前進度 / 之後可以做的事

- [x] MVP：成員管理、花費紀錄、Notion 讀寫、債務簡化結算、複製金額文字
- [ ] 正式部署到雲端（現在只能在自己電腦上跑 `npm start`）
- [ ] 資料改為即時同步（目前要重新整理頁面才會抓 Notion 最新資料）
- [ ] 花費可以不平均分攤（目前只支援平均分攤）
