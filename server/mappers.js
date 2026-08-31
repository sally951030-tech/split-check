function participantToJson(page) {
  return {
    id: page.id,
    name: page.properties["姓名"].title[0]?.plain_text ?? "",
  };
}

function participantToProperties(name) {
  return {
    姓名: { title: [{ text: { content: name } }] },
  };
}

function expenseToJson(page) {
  const props = page.properties;
  return {
    id: page.id,
    desc: props["項目"].title[0]?.plain_text ?? "",
    amount: props["金額"].number ?? 0,
    payerId: props["付款人"].relation[0]?.id ?? null,
    splitIds: props["分攤人"].relation.map((r) => r.id),
  };
}

function expenseToProperties({ desc, amount, payerId, splitIds }) {
  return {
    項目: { title: [{ text: { content: desc } }] },
    金額: { number: amount },
    付款人: { relation: [{ id: payerId }] },
    分攤人: { relation: splitIds.map((id) => ({ id })) },
  };
}

module.exports = {
  participantToJson,
  participantToProperties,
  expenseToJson,
  expenseToProperties,
};
