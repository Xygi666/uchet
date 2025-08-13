// ===== IndexedDB =====
const dbPromise = new Promise((resolve, reject) => {
  const open = indexedDB.open('productionDB', 1);
  open.onupgradeneeded = () => {
    const db = open.result;
    db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
    db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
  };
  open.onsuccess = () => resolve(open.result);
  open.onerror = () => reject(open.error);
});

async function db(store, mode, cb) {
  const database = await dbPromise;
  return new Promise((res, rej) => {
    const tx = database.transaction(store, mode);
    const req = cb(tx.objectStore(store));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

const $ = s => document.querySelector(s);

// ===== Навигация =====
document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('section').forEach(sec => sec.hidden = true);
    document.querySelector(`#${btn.dataset.page}`).hidden = false;
    document.querySelectorAll('nav button').forEach(b => b.removeAttribute('data-active'));
    btn.setAttribute('data-active', '');
  });
});

// ===== Интерфейс =====
async function refreshProducts() {
  const products = await db('products', 'readonly', os => os.getAll());
  $('#product-select').innerHTML = '<option value="">Выберите товар</option>' +
    products.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name}</option>`).join('');
  
  $('#product-list').innerHTML = products.map(
    p => `<li>${p.name} — ${p.price} ₽ <button onclick="deleteProduct(${p.id})">✕</button></li>`
  ).join('') || '<li>Нет товаров</li>';
  
  $('#total-products').textContent = products.length;
}

async function loadToday() {
  const start = new Date();
  start.setHours(0,0,0,0);
  const entries = await db('entries', 'readonly', os => os.getAll());
  const todayEntries = entries.filter(e => e.ts >= start.getTime());
  
  $('#today-list').innerHTML = todayEntries.map(e => {
    const t = new Date(e.ts).toLocaleTimeString();
    return `<li>${t} — ${e.productName} x${e.qty} = ${e.sum} ₽
      <button onclick="deleteEntry(${e.id})">✕</button></li>`;
  }).join('') || '<li>Нет записей</li>';
}

async function loadMonthSum() {
  const first = new Date();
  first.setDate(1);
  first.setHours(0,0,0,0);
  const entries = await db('entries', 'readonly', os => os.getAll());
  const monthEntries = entries.filter(e => e.ts >= first.getTime());
  
  const total = monthEntries.reduce((sum, e) => sum + e.sum, 0);
  $('#month-total').textContent = total + ' ₽';
  $('#month-sum').textContent = total + ' ₽';
  $('#month-count').textContent = monthEntries.length;
  $('#total-entries').textContent = entries.length;
}

async function loadRecentEntries() {
  const entries = await db('entries', 'readonly', os => os.getAll());
  const recent = entries.sort((a,b) => b.ts - a.ts).slice(0, 10);
  
  $('#recent-list').innerHTML = recent.map(e => {
    const date = new Date(e.ts).toLocaleDateString();
    const time = new Date(e.ts).toLocaleTimeString();
    return `<li>${date} ${time}<br>${e.productName} x${e.qty} = ${e.sum} ₽</li>`;
  }).join('') || '<li>Нет записей</li>';
}

// ===== CRUD =====
async function deleteProduct(id) {
  if (confirm('Удалить товар?')) {
    await db('products', 'readwrite', os => os.delete(id));
    refreshProducts();
    updateStatus('Товар удалён');
  }
}

async function deleteEntry(id) {
  if (confirm('Удалить запись?')) {
    await db('entries', 'readwrite', os => os.delete(id));
    loadToday();
    loadMonthSum();
    loadRecentEntries();
    updateStatus('Запись удалена');
  }
}

$('#add-product-btn').addEventListener('click', async () => {
  const name = $('#new-name').value.trim();
  const price = parseFloat($('#new-price').value);
  if (!name || !price) {
    updateStatus('⚠️ Заполните все поля');
    return;
  }
  await db('products', 'readwrite', os => os.add({ name, price }));
  $('#new-name').value = '';
  $('#new-price').value = '';
  refreshProducts();
  updateStatus('✅ Товар добавлен');
});

$('#add-btn').addEventListener('click', async () => {
  const pid = +$('#product-select').value;
  const qty = parseFloat($('#qty-input').value);
  if (!pid || !qty) {
    updateStatus('⚠️ Выберите товар и количество');
    return;
  }
  
  const sel = $('#product-select').selectedOptions[0];
  const price = parseFloat(sel.dataset.price);
  const sum = price * qty;
  
  await db('entries', 'readwrite', os => os.add({
    pid, qty, sum, ts: Date.now(), productName: sel.textContent
  }));
  
  $('#qty-input').value = '';
  loadToday();
  loadMonthSum();
  loadRecentEntries();
  updateStatus('✅ Запись добавлена');
});

// ===== Экспорт и очистка =====
$('#export-btn').addEventListener('click', async () => {
  const products = await db('products', 'readonly', os => os.getAll());
  const entries = await db('entries', 'readonly', os => os.getAll());
  const data = {
    products,
    entries,
    exported: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `products_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  updateStatus('✅ Данные экспортированы');
});

$('#clear-data-btn').addEventListener('click', async () => {
  if (confirm('Удалить ВСЕ данные? Это действие нельзя отменить!')) {
    await db('products', 'readwrite', os => os.clear());
    await db('entries', 'readwrite', os => os.clear());
    refreshAll();
    updateStatus('🗑️ Все данные удалены');
  }
});

// ===== Статус =====
function updateStatus(msg) {
  $('#sync-status').textContent = msg;
  setTimeout(() => {
    $('#sync-status').textContent = 'Готов к работе';
  }, 3000);
}

// ===== Обновление всех данных =====
async function refreshAll() {
  await refreshProducts();
  await loadToday();
  await loadMonthSum();
  await loadRecentEntries();
}

// ===== Инициализация =====
(async function init() {
  await refreshAll();
  updateStatus('🚀 Приложение готово');
})();

// ===== Service Worker =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('SW registered'))
      .catch(() => console.log('SW registration failed'));
  });
}
