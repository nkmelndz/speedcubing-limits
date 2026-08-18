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
      ? `<span class="badge-wr-new">🔥 Roto</span>` 
      : `<span class="badge-wr-hold">Meseta</span>`;
      
    tr.innerHTML = `
      <td style="font-weight: 700; color: #fff;">${h.year}</td>
      <td style="font-weight: 700; color: #60a5fa;">${formatTime(h.record, unit)}</td>
      <td style="font-weight: 600; color: #f8fafc; max-width: 160px; overflow: hidden; text-overflow: ellipsis;">${h.person_name}</td>
      <td style="color: #94a3b8; font-size: 0.78rem;">${h.record_date || '--'}</td>
      <td>${tagHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderChart(eventName, data, unit, holders) {
  const ctx = document.getElementById('trajectoryChart').getContext('2d');
  
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
          borderColor: '#ef4444',
          backgroundColor: '#ef4444',
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: 4.5,
          pointHoverRadius: 7.5,
          showLine: true,
          borderDash: [3, 3],
          borderWidth: 1.5,
          tension: 0,
          order: 1
        },
        {
          label: 'Récord Esperado (GP)',
          data: means,
          borderColor: '#3b82f6',
          borderWidth: 2.75,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 1.5,
          tension: 0.35,
          order: 2
        },
        {
          label: 'Incertidumbre Superior (95% CI)',
          data: upper95,
          borderColor: 'transparent',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
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
          borderColor: '#10b981',
          borderWidth: 1.75,
          borderDash: [5, 5],
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
                  item.fillStyle = 'rgba(59, 130, 246, 0.35)';
                  item.strokeStyle = '#3b82f6';
                }
                return item;
              });
            },
            color: '#94a3b8',
            font: { family: 'system-ui', size: 12 },
            boxWidth: 14,
            padding: 10
          }
        },
        tooltip: {
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
                const status = hInfo.is_new_wr_this_year ? "⚡ [RÉCORD ROTO]" : "⏳ [RÉCORD RETENIDO]";
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
          grid: { color: '#1f2937' },
          ticks: { color: '#9ca3af', font: { size: 11 } }
        },
        y: {
          grid: { color: '#1f2937' },
          ticks: {
            color: '#9ca3af',
            font: { size: 11 },
            callback: function(value) { return formatTime(value, unit); }
          }
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', initDashboard);
