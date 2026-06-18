const STORAGE_KEY = "householdFinanceBills.v1";

let state = loadState();

const $ = (id) => document.getElementById(id);
const money = (n) => Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.ceil((new Date(a) - new Date(b)) / 86400000);

function cloneSeed() {
  return JSON.parse(JSON.stringify(SEED_DATA));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return cloneSeed();
  try {
    return JSON.parse(saved);
  } catch {
    return cloneSeed();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function optionList(select, items, includeAll = false) {
  select.innerHTML = "";
  if (includeAll) {
    const opt = document.createElement("option");
    opt.value = "All";
    opt.textContent = `All ${select.dataset.label || "items"}`;
    select.appendChild(opt);
  }
  items.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  });
}

function initSelects() {
  optionList($("category"), state.categories);
  optionList($("frequency"), state.frequencies);
  optionList($("account"), state.accounts);
  optionList($("status"), state.statuses);
  optionList($("priority"), state.priorities);
  optionList($("classification"), state.classifications);
  optionList($("statusFilter"), state.statuses, true);
  optionList($("classFilter"), state.classifications, true);
}

function renderDashboard() {
  const today = todayISO();
  const activeBills = state.bills.filter((b) => b.status !== "Paid" && b.status !== "Paused");
  const dueSoon = activeBills.filter((b) => {
    const d = daysBetween(b.dueDate, today);
    return d >= 0 && d <= 7;
  }).length;
  const overdue = activeBills.filter((b) => daysBetween(b.dueDate, today) < 0).length;
  const monthlyTotal = state.bills
    .filter((b) => ["Monthly", "Variable"].includes(b.frequency) && b.status !== "Paused")
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const autopay = state.bills.filter((b) => b.autopay === "Yes").length;

  $("dueSoonCount").textContent = dueSoon;
  $("overdueCount").textContent = overdue;
  $("monthlyTotal").textContent = money(monthlyTotal);
  $("autopayCount").textContent = autopay;
}

function getFilteredBills() {
  const query = $("searchInput").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const klass = $("classFilter").value;
  return state.bills
    .filter((b) => !query || [b.name, b.category, b.account, b.notes].join(" ").toLowerCase().includes(query))
    .filter((b) => status === "All" || b.status === status)
    .filter((b) => klass === "All" || b.classification === klass)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function renderBills() {
  const tbody = $("billTableBody");
  tbody.innerHTML = "";

  getFilteredBills().forEach((bill) => {
    const tr = document.createElement("tr");
    const days = daysBetween(bill.dueDate, todayISO());
    const statusClass = days < 0 && bill.status !== "Paid" ? "tag danger-tag" : days <= 7 && bill.status !== "Paid" ? "tag warn-tag" : "tag";
    tr.innerHTML = `
      <td><span class="${statusClass}">${bill.dueDate}</span></td>
      <td><strong>${escapeHtml(bill.name)}</strong><br><small>${escapeHtml(bill.notes || "")}</small></td>
      <td>${escapeHtml(bill.category)}</td>
      <td>${money(bill.amount)}</td>
      <td>${escapeHtml(bill.account)}</td>
      <td>${escapeHtml(bill.autopay)}</td>
      <td>${escapeHtml(bill.status)}</td>
      <td>${escapeHtml(bill.classification)}</td>
      <td class="actions">
        <button data-action="edit" data-id="${bill.id}" class="secondary small">Edit</button>
        <button data-action="paid" data-id="${bill.id}" class="primary small">Paid</button>
        <button data-action="delete" data-id="${bill.id}" class="danger small">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPayments() {
  const tbody = $("paymentTableBody");
  tbody.innerHTML = "";
  [...state.payments].sort((a, b) => b.date.localeCompare(a.date)).forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(p.date)}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${money(p.amount)}</td>
      <td>${escapeHtml(p.account)}</td>
      <td>${escapeHtml(p.notes || "")}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAll() {
  initSelects();
  renderDashboard();
  renderBills();
  renderPayments();
}

function readForm() {
  return {
    id: $("billId").value || `bill-${Date.now()}`,
    name: $("name").value.trim(),
    category: $("category").value,
    amount: Number($("amount").value || 0),
    dueDate: $("dueDate").value,
    frequency: $("frequency").value,
    account: $("account").value,
    autopay: $("autopay").value,
    status: $("status").value,
    priority: $("priority").value,
    classification: $("classification").value,
    notes: $("notes").value.trim()
  };
}

function fillForm(bill) {
  $("billId").value = bill.id;
  $("name").value = bill.name;
  $("category").value = bill.category;
  $("amount").value = bill.amount;
  $("dueDate").value = bill.dueDate;
  $("frequency").value = bill.frequency;
  $("account").value = bill.account;
  $("autopay").value = bill.autopay;
  $("status").value = bill.status;
  $("priority").value = bill.priority;
  $("classification").value = bill.classification;
  $("notes").value = bill.notes || "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearForm() {
  $("billForm").reset();
  $("billId").value = "";
  $("dueDate").value = todayISO();
  $("status").value = "Upcoming";
  $("priority").value = "Medium";
  $("classification").value = "Review";
}

function nextDueDate(date, frequency) {
  const d = new Date(date + "T00:00:00");
  if (frequency === "Weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "Biweekly") d.setDate(d.getDate() + 14);
  else if (frequency === "Monthly" || frequency === "Variable") d.setMonth(d.getMonth() + 1);
  else if (frequency === "Quarterly") d.setMonth(d.getMonth() + 3);
  else if (frequency === "Annual") d.setFullYear(d.getFullYear() + 1);
  else return date;
  return d.toISOString().slice(0, 10);
}

function markPaid(id) {
  const bill = state.bills.find((b) => b.id === id);
  if (!bill) return;
  const note = prompt("Confirmation number or payment note:", "");
  state.payments.push({
    id: `payment-${Date.now()}`,
    billId: bill.id,
    name: bill.name,
    amount: bill.amount,
    account: bill.account,
    date: todayISO(),
    notes: note || ""
  });
  bill.status = bill.frequency === "One-time" ? "Paid" : "Upcoming";
  if (bill.frequency !== "One-time") bill.dueDate = nextDueDate(bill.dueDate, bill.frequency);
  saveState();
  renderAll();
}

function deleteBill(id) {
  if (!confirm("Delete this bill?")) return;
  state.bills = state.bills.filter((b) => b.id !== id);
  saveState();
  renderAll();
}

function csvEscape(value) {
  const v = String(value ?? "");
  return `"${v.replaceAll('"', '""')}"`;
}

function exportCsv(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(","))].join("\n");
  downloadFile(csv, filename, "text/csv");
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

$("billForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const bill = readForm();
  const idx = state.bills.findIndex((b) => b.id === bill.id);
  if (idx >= 0) state.bills[idx] = bill;
  else state.bills.push(bill);
  saveState();
  clearForm();
  renderAll();
});

$("billTableBody").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const { action, id } = btn.dataset;
  const bill = state.bills.find((b) => b.id === id);
  if (action === "edit" && bill) fillForm(bill);
  if (action === "paid") markPaid(id);
  if (action === "delete") deleteBill(id);
});

$("clearFormBtn").addEventListener("click", clearForm);
$("searchInput").addEventListener("input", renderBills);
$("statusFilter").addEventListener("change", renderBills);
$("classFilter").addEventListener("change", renderBills);

$("exportCsvBtn").addEventListener("click", () => exportCsv(state.bills, "household-finance-bills.csv"));
$("exportPaymentsBtn").addEventListener("click", () => exportCsv(state.payments, "household-finance-payments.csv"));
$("exportJsonBtn").addEventListener("click", () => downloadFile(JSON.stringify(state, null, 2), "household-finance-backup.json", "application/json"));

$("restoreJsonInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const restored = JSON.parse(text);
    if (!restored.bills || !restored.accounts) throw new Error("Invalid backup");
    state = restored;
    saveState();
    renderAll();
    alert("Backup restored.");
  } catch {
    alert("That JSON file did not look like a valid Household Finance backup.");
  }
});

$("resetBtn").addEventListener("click", () => {
  if (!confirm("Reset all local tracker data back to the seeded starter data?")) return;
  state = cloneSeed();
  saveState();
  clearForm();
  renderAll();
});

clearForm();
renderAll();
