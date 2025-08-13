// ============ IndexedDB ============
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

// ============ Навигация ============
document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('section').forEach(sec => sec.hidden = true);
    document.querySelector(`#${btn.dataset.page}`).hidden = false;
    document.querySelectorAll('nav button').forEach(b => b.removeAttribute('data-active'));
    btn.setAttribute('data-active', '');
    // при переходе в отчёты обновить график
    if (btn.dataset.page === "reports-section") setTimeout(drawProductChart, 80);
  });
});

// ============ Быстрые кнопки количества ============
function renderQtyQuickBtns() {
  const saved = localStorage.getItem('qtyPresets') || '10,20,50,100,200,300,400,500';
  const values = saved.split(',').map(v => +v.trim()).filter(Boolean);
  const container = document.getElementById('qty-quick-btns');
  container.innerHTML = '';
  values.forEach(v => {
    const btn = document.createElement('button');
    btn.textContent = `+${v}`;
    btn.type = 'button';
    btn.style.background = '#fff';
    btn.style.color = 'var(--main-color)';
    btn.style.border = '1px solid var(--main-color)';
    btn.style.padding = '0.5rem 1rem';
    btn.style.borderRadius = '6px';
    btn.style.fontWeight = 'bold';
    btn.style.flex = '1 0 32%';
    btn.onclick = () => {
      const input = document.getElementById('qty-input');
      input.value = ((parseFloat(input.value)||0) + v);
      input.focus();
    };
    container.appendChild(btn);
  });
}
// -------- Сохранение пресетов ---------
document.getElementById('save-qty-presets-btn').onclick = () => {
  const val = document.getElementById('qty-presets').value.trim();
  localStorage.setItem('qtyPresets', val);
  renderQtyQuickBtns();
  updateStatus('✅ Быстрые значения сохранены');
};
function loadQtyPresetsUI() {
  document.getElementById('qty-presets').value = localStorage.getItem('qtyPresets') || '10,20,50,100,200,300,400,500';
}

// ============ Персонализация интерфейса ============
function applyUIPrefs() {
  const prefs = JSON.parse(localStorage.getItem('uiPrefs') || '{}');
  ['add','products','reports','settings'].forEach(id => {
    const sec = document.getElementById(id+'-section');
    if (sec) sec.style.display = (prefs['show-'+id] === false) ? 'none' : '';
    document.querySelectorAll('nav button[data-page="'+id+'-section"]').forEach(btn =>
      btn.style.display = (prefs['show-'+id] === false) ? 'none' : ''
    );
  });
}
function loadUIPrefsUI() {
  const prefs = JSON.parse(localStorage.getItem('uiPrefs') || '{}');
  ['add','products','reports','settings'].forEach(id => {
    document.getElementById('show-'+id).checked = prefs['show-'+id] !== false;
  });
}
document.getElementById('save-ui-prefs-btn').onclick = function() {
  const prefs = {};
  ['add','products','reports','settings'].forEach(id => {
    prefs['show-'+id] = document.getElementById('show-'+id).checked;
  });
  localStorage.setItem('uiPrefs', JSON.stringify(prefs));
  applyUIPrefs();
  updateStatus('✅ Отображение разделов обновлено');
};

// ============ Режим "одной руки" ============
document.getElementById('save-one-hand-btn').onclick = function() {
  const enabled = document.getElementById('one-hand-mode').checked;
  localStorage.setItem('oneHandMode', enabled ? '1' : '');
  setOneHandMode(enabled);
  updateStatus('✅ Режим одной руки ' + (enabled ? 'включён' : 'выключен'));
};
function setOneHandMode(flag) {
  document.body.classList.toggle('one-hand', !!flag);
}
function loadOneHandModeUI() {
  const flag = !!localStorage.getItem('oneHandMode');
  document.getElementById('one-hand-mode').checked = flag;
  setOneHandMode(flag);
}

// ============ Темы и оформление ============
const trendyColors = [
  {name: 'Синий',      code: '#1976d2'},
  {name: 'Оранжевый',  code: '#fd6f21'},
  {name: 'Фиолетовый', code: '#9b45e4'},
  {name: 'Изумруд',    code: '#43a047'},
  {name: 'Красный',    code: '#ef5350'},
  {name: 'Тёмный',     code: '#373737'},
  {name: 'Классика',   code: '#222'},
  {name: 'Белый',      code: '#fff'},
  {name: 'Розовый',    code: '#ff80ab'}
];
function renderColorPalette() {
  const palette = document.getElementById('color-palette');
  const savedColor = localStorage.getItem('themeColor') || '#1976d2';
  palette.innerHTML = '';
  trendyColors.forEach((col) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = col.name;
    btn.style.background = col.code;
    btn.style.border = (savedColor===col.code) ? '2px solid #555': '1px solid #aaa';
    btn.style.width = '28px';
    btn.style.height = '28px';
    btn.style.borderRadius = '50%';
    btn.style.marginRight = '2px';
    btn.onclick = () => {
      document.getElementById('custom-color').value = col.code;
      [...palette.children].forEach(x=>x.style.border='1px solid #aaa');
      btn.style.border = '2px solid #555';
    };
    palette.appendChild(btn);
  });
  document.getElementById('custom-color').value = savedColor;
}
function applyTheme(theme, mainColor) {
  document.body.setAttribute('data-theme', theme);
  document.documentElement.style.setProperty('--main-color', mainColor);
}
function loadThemeSettings() {
  const savedTheme = localStorage.getItem('themeMode') || 'light';
  const savedColor = localStorage.getItem('themeColor') || '#1976d2';
  document.getElementById('theme-select').value = savedTheme;
  document.getElementById('custom-color').value = savedColor;
  applyTheme(savedTheme, savedColor);
  renderColorPalette();
}
document.getElementById('save-theme-btn').onclick = function() {
  const theme = document.getElementById('theme-select').value;
  const color = document.getElementById('custom-color').value;
  localStorage.setItem('themeMode', theme);
  localStorage.setItem('themeColor', color);
  applyTheme(theme, color);
  renderColorPalette();
  updateStatus('🎨 Оформление применено');
};

// ============ Учёт зарплаты ============
document.getElementById('save-salary-btn').onclick = function() {
  localStorage.setItem('salary', JSON.stringify({
    salary: +$('#salary-salary').value,
    advance: +$('#salary-advance').value,
    tax: +$('#salary-tax').value
  }));
  updateStatus('✅ Данные по окладу сохранены');
};
function loadSalarySettingsUI() {
  const st = JSON.parse(localStorage.getItem('salary') || '{}');
  $('#salary-salary').value = st.salary || '';
  $('#salary-advance').value = st.advance || '';
  $('#salary-tax').value = st.tax || '13';
}

// ============ Учёт смен ============
function getMonthKey() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1);
}
function getShiftStats() {
  const all = JSON.parse(localStorage.getItem('shiftStats') || '{}');
  return all[getMonthKey()] || { shifts: 0, hours: 0 };
}
function setShiftStats(data) {
  const all = JSON.parse(localStorage.getItem('shiftStats') || '{}');
  all[getMonthKey()] = data;
  localStorage.setItem('shiftStats', JSON.stringify(all));
}
function loadShiftSettingsUI() {
  document.getElementById('shift-hours').value =
    localStorage.getItem('shiftHours') || '8';
  updateAddShiftBtnText();
}
function updateAddShiftBtnText() {
  const hrs = localStorage.getItem('shiftHours') || '8';
  document.getElementById('add-shift-btn').textContent =
    `Добавить смену (${hrs} ч.)`;
}
document.getElementById('save-shift-btn').onclick = function() {
  const hrs = document.getElementById('shift-hours').value || '8';
  localStorage.setItem('shiftHours', hrs);
  updateAddShiftBtnText();
  updateStatus('✅ Параметры смены сохранены');
};
document.getElementById('add-shift-btn').onclick = function() {
  const hrs = +(localStorage.getItem('shiftHours') || 8);
  const stat = getShiftStats();
  stat.shifts += 1;
  stat.hours += hrs;
  setShiftStats(stat);
  updateStatus(`✅ Добавлена смена (${hrs} ч.)`);
  updateSalaryStats();
};
document.getElementById('clear-shift-stats-btn').onclick = function() {
  if (confirm('Сбросить все учёты смен и часов за текущий месяц?')) {
    setShiftStats({shifts: 0, hours: 0});
    updateSalaryStats();
    updateStatus('🗑️ Статистика смен сброшена');
  }
}

// ============ Основные интерфейсные функции ============
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
  const start = new Date(); start.setHours(0,0,0,0);
  const entries = await db('entries', 'readonly', os => os.getAll());
  const todayEntries = entries.filter(e => e.ts >= start.getTime());
  $('#today-list').innerHTML = todayEntries.map(e => {
    const t = new Date(e.ts).toLocaleTimeString();
    return `<li data-id="${e.id}">
      ${t} — ${e.productName} x${e.qty} = ${e.sum} ₽
      ${e.comment ? `<span style="font-style:italic;color:#999;">(${e.comment})</span>` : ""}
      <button onclick="deleteEntry(${e.id})">✕</button></li>`;
  }).join('') || '<li>Нет записей</li>';
}
async function loadMonthSum() {
  const first = new Date(); first.setDate(1); first.setHours(0,0,0,0);
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
window.deleteProduct = async function(id) {
  if (confirm('Удалить товар?')) {
    await db('products', 'readwrite', os => os.delete(id));
    refreshProducts();
    updateStatus('Товар удалён');
  }
}
window.deleteEntry = async function(id) {
  if (confirm('Удалить запись?')) {
    await db('entries', 'readwrite', os => os.delete(id));
    loadToday(); loadMonthSum(); loadRecentEntries(); drawProductChart();
    updateStatus('Запись удалена');
  }
}

// ============ CRUD =======
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
// ============ Автодополнение комментариев ============
function getCommentStats() {
  return JSON.parse(localStorage.getItem('commentStats') || '{}');
}
function saveCommentStats(stats) {
  localStorage.setItem('commentStats', JSON.stringify(stats));
}
const commentInput = document.getElementById('comment-input');
commentInput.addEventListener('input', () => {
  const cur = commentInput.value.toLowerCase();
  const stats = getCommentStats();
  const matches = Object.keys(stats)
    .filter(txt => txt.toLowerCase().includes(cur))
    .sort((a,b)=>stats[b]-stats[a]).slice(0,5);
  const suggest = document.getElementById('comment-suggest');
  suggest.innerHTML = '';
  for(let txt of matches) {
    const opt = document.createElement('div');
    opt.classList.add('suggest-item');
    opt.textContent = txt;
    opt.style.padding = '4px 10px';
    opt.style.cursor = 'pointer';
    opt.style.background = '#ececec';
    opt.style.borderRadius = '3px';
    opt.onclick = ()=>{ commentInput.value=txt; suggest.innerHTML=''; };
    suggest.appendChild(opt);
  }
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
  const comment = commentInput.value.trim();
  await db('entries', 'readwrite', os => os.add({
    pid, qty, sum, ts: Date.now(), productName: sel.textContent, comment
  }));
  if (comment) {
    const stats = getCommentStats();
    stats[comment] = (stats[comment] || 0) + 1;
    saveCommentStats(stats);
  }
  $('#qty-input').value = '';
  commentInput.value = '';
  $('#comment-suggest').innerHTML = '';
  loadToday();
  loadMonthSum();
  loadRecentEntries();
  drawProductChart();
  updateStatus('✅ Запись добавлена');
});

// ============ Экспорт JSON ============
$('#export-btn').addEventListener('click', async () => {
  const products = await db('products', 'readonly', os => os.getAll());
  const entries = await db('entries', 'readonly', os => os.getAll());
  const data = {products, entries, exported: new Date().toISOString()};
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `products_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  updateStatus('✅ Данные экспортированы');
});

// ============ Экспорт CSV ============
document.getElementById('export-csv-btn').addEventListener('click', async () => {
  const entries = await db('entries', 'readonly', os => os.getAll());
  if (!entries.length) {
    alert('Нет записей для экспорта');
    return;
  }
  const header = ['Дата', 'Наименование продукции', 'Цена за шт', 'Количество', 'Сумма'];
  const rows = entries.map(e => [
    new Date(e.ts).toLocaleString('ru'),
    e.productName || '',
    (e.qty>0 ? (e.sum/e.qty).toFixed(2) : ''),
    e.qty,
    e.sum.toFixed(2)
  ]);
  const csv = [header, ...rows].map(row =>
    row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';')
  ).join('\r\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `products_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  updateStatus('✅ CSV экспорт готов');
});

// ============ Экспорт в красивую таблицу ============
document.getElementById('export-period').addEventListener('change', function() {
  document.getElementById('custom-period').style.display =
    (this.value === 'custom') ? 'block' : 'none';
});
function getPeriodDates(period) {
  const now = new Date();
  let dateFrom, dateTo;
  switch (period) {
    case 'today':
      dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateTo   = new Date(dateFrom); dateTo.setDate(dateTo.getDate() + 1); break;
    case 'week':
      const day = now.getDay() || 7;
      dateFrom = new Date(now);
      dateFrom.setDate(now.getDate() - day + 1);
      dateFrom.setHours(0,0,0,0);
      dateTo = new Date(now); dateTo.setDate(now.getDate() + 1); dateTo.setHours(0,0,0,0);
      break;
    case 'month':
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      dateTo   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case 'year':
      dateFrom = new Date(now.getFullYear(), 0, 1);
      dateTo   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case 'custom':
      const f = document.getElementById('date-from').value;
      const t = document.getElementById('date-to').value;
      if (f && t) {
        dateFrom = new Date(f);
        dateTo   = new Date(t); dateTo.setDate(dateTo.getDate() + 1);
      }
      break;
    default:
      dateFrom = new Date(0);
      dateTo = new Date();
  }
  return [dateFrom, dateTo];
}
document.getElementById('export-html-btn').addEventListener('click', async () => {
  const period = document.getElementById('export-period').value;
  const [dateFrom, dateTo] = getPeriodDates(period);
  const entries = await db('entries', 'readonly', os => os.getAll());
  const filtered = entries.filter(e =>
    e.ts >= dateFrom.getTime() && e.ts < dateTo.getTime()
  );
  if (filtered.length === 0) {
    alert('За выбранный период нет записей');
    return;
  }
  filtered.sort((a, b) => a.ts - b.ts);
  let html = `
    <style>
    table.export-table{border-collapse:collapse;width:100%;}
    table.export-table th,table.export-table td{border:1px solid #ccc;padding:8px;}
    table.export-table th{background:#f7f7f7;}
    </style>
    <table class="export-table">
      <thead>
      <tr>
        <th>Дата</th>
        <th>Наименование продукции</th>
        <th>Цена&nbsp;за&nbsp;шт</th>
        <th>Сумма</th>
      </tr>
      </thead>
      <tbody>
  `;
  let total = 0;
  for (let e of filtered) {
    html += `<tr>
      <td>${new Date(e.ts).toLocaleString('ru')}</td>
      <td>${e.productName || ''}</td>
      <td>${typeof e.sum === 'number' && typeof e.qty === 'number' && +e.qty > 0
            ? (e.sum / e.qty).toFixed(2) : ''}</td>
      <td>${e.sum.toFixed(2)}</td>
    </tr>`;
    total += e.sum;
  }
  html += `
      </tbody>
      <tfoot>
        <tr>
          <th colspan="3" style="text-align:right;">Итого за период:</th>
          <th>${total.toFixed(2)}</th>
        </tr>
      </tfoot>
    </table>
  `;
  const win = window.open('', '', 'width=900,height=700');
  win.document.write(
    `<html><head><title>Выгрузка данных</title>
    <meta charset="UTF-8">
    <style>body{font-family:sans-serif;padding:24px;background:#f6f6f6;}</style>
    </head><body>
    <h2>Учёт продукции за период: ${dateFrom.toLocaleDateString('ru')} — ${new Date(dateTo.getTime()-1).toLocaleDateString('ru')}</h2>
    ${html}
    </body></html>`
  );
  win.document.close();
});

// ============ Очистка данных ============
$('#clear-data-btn').addEventListener('click', async () => {
  if (confirm('Удалить ВСЕ данные? Это действие нельзя отменить!')) {
    await db('products', 'readwrite', os => os.clear());
    await db('entries', 'readwrite', os => os.clear());
    refreshAll();
    updateStatus('🗑️ Все данные удалены');
  }
});

// ============ Статус-бар ============
function updateStatus(msg) {
  $('#sync-status').textContent = msg;
  setTimeout(() => {
    $('#sync-status').textContent = 'Готов к работе';
  }, 3000);
}

// ============ Зарплатная статистика и смены ============
async function updateSalaryStats() {
  const st = JSON.parse(localStorage.getItem('salary') || '{}');
  const salary = Number(st.salary) || 0;
  const advance = Number(st.advance) || 0;
  const taxPercent = Number(st.tax) || 13;
  const first = new Date(); first.setDate(1); first.setHours(0,0,0,0);
  const entries = await db('entries', 'readonly', os => os.getAll());
  const sumDeal = entries.filter(e => e.ts >= first.getTime()).reduce((sum, e) => sum + e.sum, 0);
  const tax = ((sumDeal + salary) * taxPercent) / 100;
  const netto = (sumDeal + salary) - tax - advance;
  const {shifts = 0, hours = 0} = getShiftStats();

  document.getElementById('month-sum').textContent = sumDeal + ' ₽';
  document.getElementById('salary-sum').textContent = salary + ' ₽';
  document.getElementById('advance-sum').textContent = advance + ' ₽';
  document.getElementById('tax-sum').textContent = tax.toFixed(2) + ' ₽';
  document.getElementById('tax-pct').textContent = taxPercent + ' %';
  document.getElementById('netto-sum').textContent = netto.toFixed(2) + ' ₽';
  document.getElementById('shifts-count').textContent = shifts;
  document.getElementById('shifts-hours').textContent = hours;
  document.getElementById('shifts-avg').textContent = shifts ? (netto / shifts).toFixed(2) + ' ₽' : '0 ₽';
  document.getElementById('hour-avg').textContent = hours ? (netto / hours).toFixed(2) + ' ₽' : '0 ₽';
}

// ============ График Chart.js ============
async function drawProductChart() {
  const ctx = document.getElementById('product-chart').getContext('2d');
  const entries = await db('entries', 'readonly', os => os.getAll());
  const dates = {};
  entries.forEach(e => {
    const d = new Date(e.ts);
    const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    dates[key] = (dates[key] || 0) + e.sum;
  });
  const labels = Object.keys(dates).sort();
  const data = labels.map(l => dates[l]);
  if (window.statChart) window.statChart.destroy();
  window.statChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Сделка, ₽',
        data,
        backgroundColor: '#1976d277'
      }]
    },
    options: {
      plugins: { legend: {display: false}},
      scales: { x: { title: {display: true, text: 'Дата'} },
                y: { title: {display: true, text: '₽'} } }
    }
  });
}

// ============ Голосовой ввод количества ============
document.getElementById('voice-btn').onclick = function() {
  if (!('webkitSpeechRecognition' in window)) {
    alert('Голосовой ввод не поддерживается в вашем браузере!');
    return;
  }
  const r = new webkitSpeechRecognition();
  r.lang = 'ru-RU';
  r.onresult = function(e){
    let txt = (e.results[0][0].transcript || '').replace(',', '.');
    let qty = parseFloat((txt.match(/\d+([\.,]\d+)?/)||[])[0]);
    if (qty) document.getElementById('qty-input').value = qty;
    updateStatus('🎤 Распознано: ' + txt);
  };
  r.onerror = () => updateStatus('🎤 Ошибка распознавания');
  r.start();
}

// ============ Свайп по записи для удаления/редактирования ============
let touchStartX = null;
document.getElementById('today-list').addEventListener('touchstart', (e) => {
  if (e.target.tagName !== 'LI' && !e.target.closest('li')) return;
  touchStartX = e.changedTouches[0].pageX;
}, false);
document.getElementById('today-list').addEventListener('touchend', (e) => {
  if (touchStartX === null) return;
  const li = e.target.tagName === 'LI' ? e.target : e.target.closest('li');
  if (!li) return;
  let delta = e.changedTouches[0].pageX - touchStartX;
  if (Math.abs(delta) > 60) {
    if (delta < 0) {
      // Свайп влево — удалить
      li.style.background = '#f44336';
      setTimeout(() => { li.querySelector('button').click(); }, 150);
    } else if (delta > 0) {
      // Свайп вправо — редактировать (заготовка)
      li.style.background = '#1976d2';
      setTimeout(() => {
        updateStatus('✏️ Открыть форму редактирования (допишите по желанию)');
        // Можно реализовать showEditDialog(+li.dataset.id);
      }, 150);
    }
  }
  touchStartX = null;
}, false);

// ============ Обновление всех данных ============
async function refreshAll() {
  await refreshProducts();
  await loadToday();
  await loadMonthSum();
  await loadRecentEntries();
  await updateSalaryStats();
  setTimeout(drawProductChart, 80);
  renderQtyQuickBtns();
  loadQtyPresetsUI();
  applyUIPrefs();
  loadOneHandModeUI();
  loadThemeSettings();
  loadSalarySettingsUI();
  loadShiftSettingsUI();
}
(async function init() {
  await refreshAll();
  updateStatus('🚀 Приложение готово');
})();

// ============ Service Worker ============
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('SW registered'))
      .catch(() => console.log('SW registration failed'));
  });
}
