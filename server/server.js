require("dotenv").config();
const express = require("express");
const path = require("path");
const { queryDatabase, createPage, archivePage } = require("./notion");
const {
  participantToJson,
  participantToProperties,
  expenseToJson,
  expenseToProperties,
} = require("./mappers");

const PARTICIPANTS_DB_ID = process.env.NOTION_PARTICIPANTS_DB_ID;
const EXPENSES_DB_ID = process.env.NOTION_EXPENSES_DB_ID;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/participants", async (req, res, next) => {
  try {
    const pages = await queryDatabase(PARTICIPANTS_DB_ID);
    res.json(pages.map(participantToJson));
  } catch (err) {
    next(err);
  }
});

app.post("/api/participants", async (req, res, next) => {
  try {
    const page = await createPage(PARTICIPANTS_DB_ID, participantToProperties(req.body.name));
    res.json(participantToJson(page));
  } catch (err) {
    next(err);
  }
});

app.delete("/api/participants/:id", async (req, res, next) => {
  try {
    await archivePage(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.get("/api/expenses", async (req, res, next) => {
  try {
    const pages = await queryDatabase(EXPENSES_DB_ID);
    res.json(pages.map(expenseToJson));
  } catch (err) {
    next(err);
  }
});

app.post("/api/expenses", async (req, res, next) => {
  try {
    const page = await createPage(EXPENSES_DB_ID, expenseToProperties(req.body));
    res.json(expenseToJson(page));
  } catch (err) {
    next(err);
  }
});

app.delete("/api/expenses/:id", async (req, res, next) => {
  try {
    await archivePage(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`split-check 伺服器啟動了：http://localhost:${PORT}`);
});
