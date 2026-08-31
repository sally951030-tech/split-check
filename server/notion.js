const NOTION_VERSION = "2022-06-28";
const NOTION_API_BASE = "https://api.notion.com/v1";

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function notionRequest(path, method, body) {
  const response = await fetch(`${NOTION_API_BASE}${path}`, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API 錯誤 (${response.status})：${errorText}`);
  }

  return response.json();
}

async function queryDatabase(databaseId) {
  const results = [];
  let cursor;

  do {
    const data = await notionRequest(`/databases/${databaseId}/query`, "POST", {
      start_cursor: cursor,
    });
    results.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return results;
}

async function createPage(databaseId, properties) {
  return notionRequest("/pages", "POST", {
    parent: { database_id: databaseId },
    properties,
  });
}

async function archivePage(pageId) {
  return notionRequest(`/pages/${pageId}`, "PATCH", { archived: true });
}

module.exports = { queryDatabase, createPage, archivePage };
