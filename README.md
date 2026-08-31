# split-check 出遊分帳工具

朋友出遊分攤費用的小工具：成員管理、花費紀錄（付款人、分攤人可不同）、自動結算，並可一鍵複製結算文字分享到 IG 群組。資料存在 Notion，不是瀏覽器暫存，重新整理不會消失。

## 功能

- 新增/移除成員
- 新增花費：項目、金額、誰付的、由誰分攤（可勾選部分成員，不一定要全體均攤）
- 花費紀錄列表，可個別刪除，也可一鍵刪除全部（有二次確認保護）
- 自動結算：算出每人應收/應付金額，並用債務簡化演算法給出最少次數的轉帳建議
- 複製「應收/應付金額 + 建議轉帳」文字，方便貼到 IG 群組

## 架構

- `public/`：前端，純 HTML/CSS/原生 JavaScript
- `server/`：後端，Node.js + Express，負責保管 Notion API 密鑰並代為讀寫資料，前端不會直接接觸 Notion API 或密鑰

## 開始使用

### 1. 安裝 Node.js

到 [nodejs.org](https://nodejs.org) 下載 LTS 版本安裝。

### 2. 申請 Notion Integration 密鑰

1. 打開 [Notion Integrations](https://www.notion.so/my-integrations)，點「New integration」建立一個新的 integration，複製它的「Internal Integration Secret」
2. 在 Notion 裡建立兩個資料庫：「成員」（欄位：姓名）與「花費紀錄」（欄位：項目、金額、付款人〔關聯到成員〕、分攤人〔關聯到成員，可多選〕）
3. 把上層頁面分享（Connections）給剛剛建立的 integration，讓它有讀寫權限

### 3. 設定環境變數

```bash
cd server
cp .env.example .env
```

打開 `.env`，填入：

```
NOTION_API_KEY=你的 Notion Integration 密鑰
NOTION_PARTICIPANTS_DB_ID=成員資料庫的 ID
NOTION_EXPENSES_DB_ID=花費紀錄資料庫的 ID
```

### 4. 安裝套件並啟動

```bash
npm install
npm start
```

打開瀏覽器到 `http://localhost:3000` 即可使用。

## 資料格式

- 成員：`{ id, name }`
- 花費紀錄：`{ id, desc, amount, payerId, splitIds: [participantId, ...] }`

`server/mappers.js` 負責把 Notion 頁面格式轉換成上面這種簡單的 JSON，前端不需要知道 Notion 的資料格式。

## 之後可以做的事

- [ ] 正式部署到雲端（目前只能在自己電腦上跑 `npm start`）
- [ ] 資料即時同步（目前要重新整理頁面才會抓 Notion 最新資料）
- [ ] 花費可以不平均分攤
