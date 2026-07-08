// ============================================
// CaixinhaApp — Dashboard & Reembolsos Executive View
// ============================================

let chartObrasInstance = null;
let chartDonutInstance = null;
let chartTimelineInstance = null;

/**
 * Abre a tela de Dashboard e inicializa os dados
 */
async function openDashboard() {
  navigateTo('screen-dashboard');
  await populateDashboardObrasFilter();
  await renderDashboard();
}

/**
 * Preenche o select de filtro por obra no dashboard
 */
async function populateDashboardObrasFilter() {
  const selectEl = document.getElementById('dash-filter-obra');
  if (!selectEl) return;

  const obras = await getObras();
  const currentVal = selectEl.value || 'all';

  selectEl.innerHTML = `
    <option value="all">🏢 Todas as Obras</option>
    ${obras.map(o => `<option value="${o.id}" ${String(o.id) === currentVal ? 'selected' : ''}>🏗️ ${escapeHtml(o.nome)}</option>`).join('')}
  `;
}

/**
 * Filtra notas por período (compatível com datas no formato YYYY-MM-DD)
 */
function filterDashboardNotasByPeriod(notas, periodo) {
  if (!periodo || periodo === 'all') return notas;
  const now = new Date();

  return notas.filter(nota => {
    if (!nota.data) return true;
    const notaDate = new Date(nota.data + 'T00:00:00');

    if (periodo === '15d') {
      const diffDays = (now - notaDate) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 15;
    }
    if (periodo === '30d') {
      const diffDays = (now - notaDate) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }
    if (periodo === 'mes') {
      return notaDate.getMonth() === now.getMonth() && notaDate.getFullYear() === now.getFullYear();
    }
    if (periodo === 'ano') {
      return notaDate.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

/**
 * Renderiza todos os KPIs, gráficos e tabela do Dashboard
 */
async function renderDashboard() {
  const selectedObraId = document.getElementById('dash-filter-obra')?.value || 'all';
  const selectedPeriodo = document.getElementById('dash-filter-periodo')?.value || 'all';

  const todasObras = await getObras();
  let todasNotas = await getAllNotas();

  // Filtra por obra se selecionado
  if (selectedObraId !== 'all') {
    todasNotas = todasNotas.filter(n => String(n.obraId) === String(selectedObraId));
  }

  // Filtra por período
  const notas = filterDashboardNotasByPeriod(todasNotas, selectedPeriodo);

  // 1. Cálculo de KPIs
  const totalGeral = notas.reduce((sum, n) => sum + (n.valor || 0), 0);
  const totalReembolsado = notas
    .filter(n => n.reembolsado)
    .reduce((sum, n) => sum + (n.valor || 0), 0);
  const totalPendente = totalGeral - totalReembolsado;
  const percReembolsado = totalGeral > 0 ? Math.round((totalReembolsado / totalGeral) * 100) : 0;

  const countPendente = notas.filter(n => !n.reembolsado).length;

  // Obras consideradas (se selecionou uma, é 1, senão total de obras que tem notas ou ativas)
  const obrasExibidasCount = selectedObraId !== 'all' ? 1 : todasObras.length;
  const mediaPorObra = obrasExibidasCount > 0 ? totalGeral / obrasExibidasCount : 0;

  // Atualizar DOM KPIs
  const elTotalGeral = document.getElementById('dash-total-geral');
  if (elTotalGeral) elTotalGeral.textContent = `R$ ${formatCurrency(totalGeral)}`;

  const elCountNotas = document.getElementById('dash-count-notas');
  if (elCountNotas) elCountNotas.textContent = `${notas.length} nota${notas.length !== 1 ? 's' : ''} no período`;

  const elTotalReembolsado = document.getElementById('dash-total-reembolsado');
  if (elTotalReembolsado) elTotalReembolsado.textContent = `R$ ${formatCurrency(totalReembolsado)}`;

  const elPercReembolsado = document.getElementById('dash-perc-reembolsado');
  if (elPercReembolsado) elPercReembolsado.textContent = `${percReembolsado}%`;

  const elProgressFill = document.getElementById('dash-progress-fill');
  if (elProgressFill) elProgressFill.style.width = `${percReembolsado}%`;

  const elTotalPendente = document.getElementById('dash-total-pendente');
  if (elTotalPendente) elTotalPendente.textContent = `R$ ${formatCurrency(totalPendente)}`;

  const elCountPendentes = document.getElementById('dash-count-pendentes');
  if (elCountPendentes) elCountPendentes.textContent = `${countPendente} nota${countPendente !== 1 ? 's' : ''} pendente${countPendente !== 1 ? 's' : ''}`;

  const elCountObras = document.getElementById('dash-count-obras');
  if (elCountObras) elCountObras.textContent = selectedObraId !== 'all' ? '1 obra selecionada' : `${obrasExibidasCount} obra${obrasExibidasCount !== 1 ? 's' : ''}`;

  const elMediaObra = document.getElementById('dash-media-obra');
  if (elMediaObra) elMediaObra.textContent = `Média R$ ${formatCurrency(mediaPorObra)} / obra`;

  // 2. Dados por Obra (para Gráfico de Barras e Resumo Operacional)
  const obrasMap = new Map();
  todasObras.forEach(o => {
    if (selectedObraId === 'all' || String(o.id) === String(selectedObraId)) {
      obrasMap.set(o.id, {
        id: o.id,
        nome: o.nome,
        cliente: o.cliente,
        totalPago: 0,
        totalPendente: 0,
        totalGeral: 0,
        notasCount: 0
      });
    }
  });

  notas.forEach(n => {
    const oData = obrasMap.get(n.obraId);
    if (oData) {
      const val = n.valor || 0;
      oData.totalGeral += val;
      oData.notasCount += 1;
      if (n.reembolsado) {
        oData.totalPago += val;
      } else {
        oData.totalPendente += val;
      }
    }
  });

  const obrasArray = Array.from(obrasMap.values()).sort((a, b) => b.totalGeral - a.totalGeral);

  // Renderizar Gráficos
  renderChartObrasStatus(obrasArray);
  renderChartDonutStatus(totalReembolsado, totalPendente);
  renderChartTimeline(notas);

  // Renderizar Lista / Resumo Operacional
  renderDashboardObrasTable(obrasArray);
}

/**
 * Configuração global do Chart.js para tema Dark moderno
 */
function getChartDefaultConfig() {
  return {
    color: '#94a3b8',
    font: {
      family: "'Inter', system-ui, -apple-system, sans-serif",
      size: 12
    }
  };
}

/**
 * Gráfico 1: Barras comparando Reembolsado vs Pendente por Obra
 */
function renderChartObrasStatus(obrasArray) {
  const canvas = document.getElementById('chartObrasStatus');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (chartObrasInstance) {
    chartObrasInstance.destroy();
  }

  const labels = obrasArray.map(o => o.nome.length > 18 ? o.nome.slice(0, 16) + '…' : o.nome);
  const dataPago = obrasArray.map(o => Number(o.totalPago.toFixed(2)));
  const dataPendente = obrasArray.map(o => Number(o.totalPendente.toFixed(2)));

  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

  chartObrasInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['Sem dados'],
      datasets: [
        {
          label: 'Reembolsado (Baixado)',
          data: labels.length > 0 ? dataPago : [0],
          backgroundColor: '#10b981',
          borderRadius: 6,
          borderSkipped: false
        },
        {
          label: 'Pendente a Reembolsar',
          data: labels.length > 0 ? dataPendente : [0],
          backgroundColor: '#f59e0b',
          borderRadius: 6,
          borderSkipped: false
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
          position: 'top',
          labels: {
            boxWidth: 12,
            usePointStyle: true,
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              return ` ${label}: R$ ${formatCurrency(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#94a3b8',
            callback: (val) => 'R$ ' + (val >= 1000 ? (val/1000).toFixed(1) + 'k' : val)
          }
        }
      }
    }
  });
}

/**
 * Gráfico 2: Donut com proporção Reembolsado vs Pendente
 */
function renderChartDonutStatus(totalPago, totalPendente) {
  const canvas = document.getElementById('chartDonutStatus');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (chartDonutInstance) {
    chartDonutInstance.destroy();
  }

  const hasData = (totalPago + totalPendente) > 0;

  chartDonutInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Reembolsado (Baixado)', 'Pendente a Reembolsar'],
      datasets: [{
        data: hasData ? [Number(totalPago.toFixed(2)), Number(totalPendente.toFixed(2))] : [1, 0],
        backgroundColor: hasData ? ['#10b981', '#f59e0b'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'],
        borderColor: '#111827',
        borderWidth: 3,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            usePointStyle: true,
            padding: 14
          }
        },
        tooltip: {
          enabled: hasData,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const val = context.parsed;
              const total = totalPago + totalPendente;
              const perc = total > 0 ? Math.round((val / total) * 100) : 0;
              return ` ${label}: R$ ${formatCurrency(val)} (${perc}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Gráfico 3: Linha do Tempo (Evolução de Despesas no Tempo)
 */
function renderChartTimeline(notas) {
  const canvas = document.getElementById('chartTimeline');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (chartTimelineInstance) {
    chartTimelineInstance.destroy();
  }

  // Agrupar por data (YYYY-MM-DD ou YYYY-MM)
  const dateMap = new Map();
  notas.forEach(n => {
    if (!n.data) return;
    const dateKey = n.data; // formato YYYY-MM-DD
    const cur = dateMap.get(dateKey) || 0;
    dateMap.set(dateKey, cur + (n.valor || 0));
  });

  const sortedDates = Array.from(dateMap.keys()).sort();
  const labels = sortedDates.map(d => {
    const parts = d.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
  });
  const values = sortedDates.map(d => Number(dateMap.get(d).toFixed(2)));

  // Gradiente azul/índigo para área
  const gradient = ctx.createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

  chartTimelineInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ['Sem dados'],
      datasets: [{
        label: 'Despesas Registradas no Dia (R$)',
        data: labels.length > 0 ? values : [0],
        borderColor: '#3b82f6',
        backgroundColor: gradient,
        borderWidth: 3,
        pointBackgroundColor: '#60a5fa',
        pointRadius: labels.length > 15 ? 2 : 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context) => ` Custo registrado: R$ ${formatCurrency(context.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#94a3b8',
            callback: (val) => 'R$ ' + (val >= 1000 ? (val/1000).toFixed(1) + 'k' : val)
          }
        }
      }
    }
  });
}

/**
 * Renderiza o resumo de obras em tabela/cards operacionais
 */
function renderDashboardObrasTable(obrasArray) {
  const container = document.getElementById('dash-obras-table-container');
  if (!container) return;

  if (obrasArray.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px;">
        <p class="text-tertiary">Nenhuma obra para exibir neste filtro</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="dash-obra-list">
      ${obrasArray.map(obra => {
        const perc = obra.totalGeral > 0 ? Math.round((obra.totalPago / obra.totalGeral) * 100) : 0;
        return `
          <div class="dash-obra-item" onclick="openObra(${obra.id})">
            <div class="dash-obra-main">
              <div class="dash-obra-title">${escapeHtml(obra.nome)}</div>
              <div class="dash-obra-sub">${obra.cliente ? escapeHtml(obra.cliente) : 'Sem cliente'} • ${obra.notasCount} nota${obra.notasCount !== 1 ? 's' : ''}</div>
              <div class="dash-obra-progress">
                <div class="dash-progress-track">
                  <div class="dash-progress-bar-inner" style="width: ${perc}%"></div>
                </div>
                <span class="dash-progress-label">${perc}% reembolsado</span>
              </div>
            </div>
            <div class="dash-obra-metrics">
              <div class="dash-metric-col">
                <span class="dash-metric-label">Pago</span>
                <span class="dash-metric-val val-green">R$ ${formatCurrency(obra.totalPago)}</span>
              </div>
              <div class="dash-metric-col">
                <span class="dash-metric-label">Pendente</span>
                <span class="dash-metric-val val-yellow">R$ ${formatCurrency(obra.totalPendente)}</span>
              </div>
              <div class="dash-metric-col">
                <span class="dash-metric-label">Total</span>
                <span class="dash-metric-val">R$ ${formatCurrency(obra.totalGeral)}</span>
              </div>
              <div class="dash-metric-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
