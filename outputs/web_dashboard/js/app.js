// Speedcubing Limits Interactive Engine
let summaryData = null;
let currentChart = null;
let currentEventId = "333";
let currentRecordType = "single";

/**
 * Formatea un valor numérico según la unidad y convierte a formato mm:ss.xx si supera los 60 segundos.
 */
function formatTime(val, unit) {
  if (val === null || val === undefined || isNaN(val)) return '--';
  const num = Number(val);
  
  if (unit === 's') {
    if (num >= 60) {
      const minutes = Math.floor(num / 60);
      const seconds = (num % 60).toFixed(2);
      const paddedSeconds = seconds < 10 ? '0' + seconds : seconds;
      return `${minutes}:${paddedSeconds}`;
    }
    return `${num.toFixed(2)}s`;
  }
  
  if (unit === 'movs') {
    return `${Number.isInteger(num) ? num : num.toFixed(2)} movs`;
  }
  
  if (unit === 'pts') {
    return `${Number.isInteger(num) ? num : num.toFixed(2)} pts`;
  }
  
  return `${num} ${unit}`;
}

async function initDashboard() {
  try {
    const savedTheme = localStorage.getItem('speedcubing_theme') || 'dark';
    applyTheme(savedTheme);

    const response = await fetch('limits_summary.json');
    summaryData = await response.json();
    
    populateEventSelect();
    setupEventListeners();
    updateDashboard();
  } catch (error) {
    console.error("Error al cargar los datos:", error);
  }
}

function populateEventSelect() {
  const select = document.getElementById('eventSelect');
  select.innerHTML = '';
  
  for (const [id, info] of Object.entries(summaryData.events)) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = info.name;
    if (id === currentEventId) option.selected = true;
    select.appendChild(option);
  }
}

function setupEventListeners() {
  // Manejo del tema oscuro / claro
  const savedTheme = localStorage.getItem('speedcubing_theme') || 'dark';
  applyTheme(savedTheme);

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';
      applyTheme(newTheme);
      updateDashboard();
    });
  }

  document.getElementById('eventSelect').addEventListener('change', (e) => {
    currentEventId = e.target.value;
    updateDashboard();
  });

  document.querySelectorAll('.segment-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentRecordType = e.target.getAttribute('data-type');
      updateDashboard();
    });
  });
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('speedcubing_theme', theme);
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.setAttribute('title', theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro');
  }
}

function updateDashboard() {
  const eventInfo = summaryData.events[currentEventId];
  if (!eventInfo) return;

  const data = eventInfo[currentRecordType];
  if (!data) return;

  const unit = eventInfo.unit;
  const holders = data.yearly_record_holders || [];
  const latestHolder = holders.length > 0 ? holders[holders.length - 1] : null;

  // Actualizar métricas clave con formateo de minutos
  document.getElementById('mCurrentRecord').innerText = formatTime(data.current_record, unit);
  document.getElementById('mCurrentHolder').innerText = latestHolder ? `Titular: ${latestHolder.person_name}` : 'Marca oficial WCA';
  
  document.getElementById('mHumanLimit').innerText = formatTime(data.human_limit.median, unit);
  document.getElementById('mLimitCI').innerText = `95% CI: [${formatTime(data.human_limit.ci_95_lower, unit)} - ${formatTime(data.human_limit.ci_95_upper, unit)}]`;
  
  const limitYear = data.human_limit.estimated_convergence_year || 2038;
  const limitWindow = data.human_limit.convergence_window || `${limitYear - 3} - ${limitYear + 4}`;
  document.getElementById('mLimitYear').innerText = `~${limitYear}`;
  document.getElementById('mLimitWindow').innerText = `Ventana: ${limitWindow}`;

  // Tarjeta de Saturación (%)
  const satPct = data.saturation_index_pct;
  document.getElementById('mSaturation').innerText = `${satPct}%`;
  
  let satLabel = "Nivel intermedio";
  if (satPct >= 99.0) satLabel = "Hiper-saturada (Frontera final)";
  else if (satPct >= 96.5) satLabel = "Alta saturación (Margen estrecho)";
  else if (satPct >= 90.0) satLabel = "Margen moderado";
  else satLabel = "Alto margen";
  
  document.getElementById('mSaturationDesc').innerText = satLabel;

  renderChart(eventInfo.name, data, unit, holders);
  renderTable(holders, unit);
}

function renderTable(holders, unit) {
  const tbody = document.getElementById('recordHoldersTableBody');
  const countBadge = document.getElementById('tableRecordCount');
  tbody.innerHTML = '';
  
  countBadge.innerText = `${holders.length} años`;

  // Mostrar orden cronológico inverso (el más reciente primero)
  const reversed = [...holders].reverse();
  
  reversed.forEach(h => {
    const tr = document.createElement('tr');
    
    const tagHtml = h.is_new_wr_this_year 
      ? `<span class="badge-wr-new">Récord</span>` 
      : `<span class="badge-wr-hold">Mantenido</span>`;
      
    tr.innerHTML = `
      <td class="cell-year">${h.year}</td>
      <td class="cell-record">${formatTime(h.record, unit)}</td>
      <td class="cell-person" title="${h.person_name}">${h.person_name}</td>
      <td class="cell-date">${h.record_date || '--'}</td>
      <td>${tagHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderChart(eventName, data, unit, holders) {
  const ctx = document.getElementById('trajectoryChart').getContext('2d');
  
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? '#262626' : '#bcc7d5';
  const tickColor = isDark ? '#a3a3a3' : '#334155';
  const scaleBorderColor = isDark ? '#333333' : '#94a3b8';
  const legendTextColor = isDark ? '#e5e5e5' : '#1e293b';
  const uncertaintyBg = isDark ? 'rgba(59, 130, 246, 0.22)' : 'rgba(37, 99, 235, 0.12)';

  const years = data.trajectory.years;
  const means = data.trajectory.mean;
  const stds = data.trajectory.std;
  const histRecords = data.trajectory.historical_records || [];
  const isMBF = (unit === "pts");

  const upper95 = means.map((m, i) => Number((m + 1.96 * stds[i]).toFixed(2)));
  const lower95 = means.map((m, i) => {
    const val = m - 1.96 * stds[i];
    return Number((isMBF ? Math.max(val, 0) : Math.max(val, data.human_limit.ci_95_lower * 0.9)).toFixed(2));
  });

  // Crear serie de récords alineada con los años (null en años futuros)
  const recordPoints = years.map((y, i) => (i < histRecords.length ? histRecords[i] : null));

  // Mapa rápido de holders por año
  const holderMap = {};
  holders.forEach(h => {
    holderMap[h.year] = h;
  });

  if (currentChart) {
    currentChart.destroy();
  }

  currentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Récord Oficial',
          data: recordPoints,
          borderColor: '#dc2626',
          backgroundColor: '#dc2626',
          pointBackgroundColor: '#dc2626',
          pointBorderColor: isDark ? '#141414' : '#ebf0f5',
          pointBorderWidth: 1.5,
          pointRadius: 3.8,
          pointHoverRadius: 6,
          showLine: true,
          borderDash: [3, 3],
          borderWidth: 1.5,
          tension: 0,
          order: 1
        },
        {
          label: 'Récord Esperado (GP)',
          data: means,
          borderColor: '#2563eb',
          borderWidth: 2.2,
          pointBackgroundColor: '#2563eb',
          pointRadius: 1,
          tension: 0.35,
          order: 2
        },
        {
          label: 'Incertidumbre Superior (95% CI)',
          data: upper95,
          borderColor: 'transparent',
          backgroundColor: uncertaintyBg,
          fill: '+1',
          pointRadius: 0,
          order: 3
        },
        {
          label: 'Incertidumbre Inferior (95% CI)',
          data: lower95,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0,
          order: 4
        },
        {
          label: `Límite Asintótico (${formatTime(data.human_limit.median, unit)})`,
          data: Array(years.length).fill(data.human_limit.median),
          borderColor: '#059669',
          borderWidth: 1.5,
          borderDash: [5, 4],
          pointRadius: 0,
          order: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            filter: function(legendItem) {
              return !legendItem.text.includes('Inferior');
            },
            generateLabels: function(chart) {
              const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
              return original.map(item => {
                if (item.text.includes('Superior')) {
                  item.text = 'Banda Incertidumbre (95% CI)';
                  item.fillStyle = isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(37, 99, 235, 0.2)';
                  item.strokeStyle = '#2563eb';
                }
                return item;
              });
            },
            color: legendTextColor,
            font: { family: "'Inter', sans-serif", size: 11, weight: '600' },
            boxWidth: 12,
            padding: 8
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#0a0a0a' : '#1e293b',
          titleColor: '#ffffff',
          bodyColor: isDark ? '#d4d4d4' : '#e2e8f0',
          borderColor: isDark ? '#262626' : '#475569',
          borderWidth: 1,
          padding: 8,
          cornerRadius: 6,
          itemSort: function(a, b) {
            return a.datasetIndex - b.datasetIndex;
          },
          filter: function(tooltipItem) {
            return !tooltipItem.dataset.label.includes('Límite Asintótico');
          },
          callbacks: {
            title: function(tooltipItems) {
              const yr = tooltipItems[0].label;
              const hInfo = holderMap[yr];
              if (hInfo) {
                const status = hInfo.is_new_wr_this_year ? "[RÉCORD ROTO]" : "[RÉCORD RETENIDO]";
                return `Año ${yr} ${status} - ${hInfo.person_name}`;
              }
              return `Año Proyectado ${yr}`;
            },
            label: function(context) {
              const yr = context.label;
              const hInfo = holderMap[yr];
              
              if (context.dataset.label.includes('Récord Oficial')) {
                if (hInfo && context.parsed.y !== null) {
                  return `● Récord Oficial: ${formatTime(context.parsed.y, unit)} (${hInfo.person_name})`;
                }
                return null;
              }
              
              if (context.dataset.label.includes('Récord Esperado')) {
                return `● Récord Esperado (GP): ${formatTime(context.parsed.y, unit)}`;
              }
              
              if (context.dataset.label.includes('Superior')) {
                return `   ↳ Incertidumbre Sup. (95% CI): ${formatTime(context.parsed.y, unit)}`;
              }
              if (context.dataset.label.includes('Inferior')) {
                return `   ↳ Incertidumbre Inf. (95% CI): ${formatTime(context.parsed.y, unit)}`;
              }
              
              return `${context.dataset.label}: ${formatTime(context.parsed.y, unit)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: tickColor, font: { family: "'Inter', sans-serif", size: 11, weight: '500' } },
          border: { color: scaleBorderColor }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
            callback: function(value) { return formatTime(value, unit); }
          },
          border: { color: scaleBorderColor }
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', initDashboard);
