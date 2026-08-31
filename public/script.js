const API_BASE = "/api";

async function loadParticipants() {
  const res = await fetch(`${API_BASE}/participants`);
  return res.json();
}

async function addParticipant(name) {
  await fetch(`${API_BASE}/participants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

async function removeParticipant(participantId, expenses) {
  const inUse = expenses.some(
    (e) => e.payerId === participantId || e.splitIds.includes(participantId)
  );
  if (inUse) {
    alert("這位成員已經出現在花費紀錄裡，要先刪除相關花費紀錄才能移除他。");
    return;
  }
  await fetch(`${API_BASE}/participants/${participantId}`, { method: "DELETE" });
}

async function loadExpenses() {
  const res = await fetch(`${API_BASE}/expenses`);
  return res.json();
}

async function addExpense({ desc, amount, payerId, splitIds }) {
  await fetch(`${API_BASE}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ desc, amount, payerId, splitIds }),
  });
}

async function removeExpense(expenseId) {
  await fetch(`${API_BASE}/expenses/${expenseId}`, { method: "DELETE" });
}

function calculateBalances(participants, expenses) {
  const balances = {};
  participants.forEach((p) => (balances[p.id] = 0));

  expenses.forEach((e) => {
    balances[e.payerId] = (balances[e.payerId] || 0) + e.amount;
    const share = e.amount / e.splitIds.length;
    e.splitIds.forEach((pid) => {
      balances[pid] = (balances[pid] || 0) - share;
    });
  });

  return balances;
}

function calculateSettlements(balances) {
  const creditors = [];
  const debtors = [];

  Object.entries(balances).forEach(([id, balance]) => {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded > 0.01) creditors.push({ id, amount: rounded });
    else if (rounded < -0.01) debtors.push({ id, amount: -rounded });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    settlements.push({ fromId: debtor.id, toId: creditor.id, amount });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return settlements;
}

function findParticipantName(participants, id) {
  const found = participants.find((p) => p.id === id);
  return found ? found.name : "（已刪除的成員）";
}

function renderParticipants(participants, expenses) {
  const list = document.getElementById("participant-list");
  list.innerHTML = "";

  participants.forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${p.name}</span>`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "×";
    btn.addEventListener("click", async () => {
      await removeParticipant(p.id, expenses);
      renderAll();
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function renderPayerSelect(participants) {
  const select = document.getElementById("expense-payer-select");
  const previousValue = select.value;
  select.innerHTML = "";

  participants.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = p.name;
    select.appendChild(option);
  });

  if (participants.some((p) => p.id === previousValue)) {
    select.value = previousValue;
  }
}

function renderSplitCheckboxes(participants) {
  const container = document.getElementById("expense-split-checkboxes");
  container.innerHTML = "";

  participants.forEach((p) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = p.id;
    checkbox.checked = true;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(p.name));
    container.appendChild(label);
  });
}

function renderExpenses(participants, expenses) {
  const list = document.getElementById("expense-list");
  list.innerHTML = "";

  if (expenses.length === 0) {
    list.innerHTML = '<li class="empty-hint">還沒有花費紀錄</li>';
    return;
  }

  expenses.forEach((e) => {
    const payerName = findParticipantName(participants, e.payerId);
    const splitNames = e.splitIds
      .map((id) => findParticipantName(participants, id))
      .join("、");

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="expense-item-main">
        <span class="expense-item-desc">${e.desc}　$${e.amount}</span>
        <span class="expense-item-meta">${payerName} 付的，由 ${splitNames} 分攤</span>
      </div>
    `;
    const btn = document.createElement("button");
    btn.className = "delete-btn";
    btn.textContent = "刪除";
    btn.addEventListener("click", async () => {
      await removeExpense(e.id);
      renderAll();
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function renderBalanceSummary(participants, balances) {
  const container = document.getElementById("balance-summary");
  container.innerHTML = "";

  participants.forEach((p) => {
    const balance = Math.round((balances[p.id] || 0) * 100) / 100;
    const row = document.createElement("div");
    row.className = "balance-row";

    let statusClass = "balance-even";
    let statusText = "打平";
    if (balance > 0.01) {
      statusClass = "balance-owed";
      statusText = `應收 $${balance.toFixed(0)}`;
    } else if (balance < -0.01) {
      statusClass = "balance-owe";
      statusText = `應付 $${Math.abs(balance).toFixed(0)}`;
    }

    row.innerHTML = `<span>${p.name}</span><span class="${statusClass}">${statusText}</span>`;
    container.appendChild(row);
  });
}

function renderSettlements(participants, settlements) {
  const list = document.getElementById("settlement-list");
  const copyBtn = document.getElementById("copy-text-btn");
  list.innerHTML = "";

  if (settlements.length === 0) {
    list.innerHTML = '<li class="empty-hint">目前帳務已經打平，不需要轉帳</li>';
    copyBtn.disabled = participants.length === 0;
    return;
  }

  settlements.forEach((s) => {
    const fromName = findParticipantName(participants, s.fromId);
    const toName = findParticipantName(participants, s.toId);
    const li = document.createElement("li");
    li.innerHTML = `${fromName}<span class="arrow">→</span>${toName}　$${Math.round(s.amount)}`;
    list.appendChild(li);
  });

  copyBtn.disabled = false;
}

function buildBalanceText(participants, balances) {
  const lines = ["📋 分帳結果"];

  participants.forEach((p) => {
    const balance = Math.round((balances[p.id] || 0) * 100) / 100;
    if (balance > 0.01) {
      lines.push(`${p.name}：應收 $${balance.toFixed(0)}`);
    } else if (balance < -0.01) {
      lines.push(`${p.name}：應付 $${Math.abs(balance).toFixed(0)}`);
    } else {
      lines.push(`${p.name}：打平`);
    }
  });

  return lines.join("\n");
}

function buildSettlementText(participants, settlements) {
  const lines = ["💸 建議轉帳"];

  if (settlements.length === 0) {
    lines.push("帳務已經打平，不需要轉帳");
  } else {
    settlements.forEach((s) => {
      const fromName = findParticipantName(participants, s.fromId);
      const toName = findParticipantName(participants, s.toId);
      lines.push(`${fromName} → ${toName}：$${Math.round(s.amount)}`);
    });
  }

  return lines.join("\n");
}

async function copyBalanceText(participants, balances, settlements) {
  const text = [buildBalanceText(participants, balances), buildSettlementText(participants, settlements)].join("\n\n");
  const feedback = document.getElementById("copy-feedback");

  try {
    await navigator.clipboard.writeText(text);
    feedback.textContent = "已複製，可以貼到 IG 囉！";
  } catch (err) {
    feedback.textContent = "複製失敗，請手動選取文字複製。";
  }

  setTimeout(() => {
    feedback.textContent = "";
  }, 3000);
}

async function renderAll() {
  const [participants, expenses] = await Promise.all([loadParticipants(), loadExpenses()]);

  renderParticipants(participants, expenses);
  renderPayerSelect(participants);
  renderSplitCheckboxes(participants);
  renderExpenses(participants, expenses);

  const balances = calculateBalances(participants, expenses);
  const settlements = calculateSettlements(balances);
  renderBalanceSummary(participants, balances);
  renderSettlements(participants, settlements);

  document.getElementById("copy-text-btn").onclick = () => copyBalanceText(participants, balances, settlements);
}

function initApp() {
  document.getElementById("participant-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("participant-name-input");
    const name = input.value.trim();
    if (!name) return;
    await addParticipant(name);
    input.value = "";
    renderAll();
  });

  document.getElementById("expense-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const descInput = document.getElementById("expense-desc-input");
    const amountInput = document.getElementById("expense-amount-input");
    const payerSelect = document.getElementById("expense-payer-select");
    const checkboxes = document.querySelectorAll("#expense-split-checkboxes input[type=checkbox]:checked");

    if (!payerSelect.value) {
      alert("請先新增成員，才能記錄花費。");
      return;
    }
    if (checkboxes.length === 0) {
      alert("至少要選一位分攤的人。");
      return;
    }

    await addExpense({
      desc: descInput.value.trim(),
      amount: Number(amountInput.value),
      payerId: payerSelect.value,
      splitIds: Array.from(checkboxes).map((c) => c.value),
    });

    descInput.value = "";
    amountInput.value = "";
    renderAll();
  });

  renderAll();
}

initApp();
