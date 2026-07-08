// ============================================
// CaixinhaApp — Main Application Controller
// ============================================

// --- State ---
let currentScreen = 'home';
let currentObraId = null;
let capturedImageBase64 = null;

// --- Icons (SVG) ---
const ICONS = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="6" x2="9" y2="6.01"></line><line x1="15" y1="6" x2="15" y2="6.01"></line><line x1="9" y1="10" x2="9" y2="10.01"></line><line x1="15" y1="10" x2="15" y2="10.01"></line><line x1="9" y1="14" x2="9" y2="14.01"></line><line x1="15" y1="14" x2="15" y2="14.01"></line><line x1="9" y1="18" x2="15" y2="18"></line></svg>',
  receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"></path><line x1="8" y1="8" x2="16" y2="8"></line><line x1="8" y1="12" x2="16" y2="12"></line><line x1="8" y1="16" x2="12" y2="16"></line></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'
};

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  initDB();
  await renderHome();
  checkApiKey();
});

// --- Navigation ---
function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('active');
    currentScreen = screenId;
  }
}

// --- Toast ---
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// --- Check API Key ---
async function checkApiKey() {
  const key = await getApiKey();
  if (!key) {
    // Show a hint on first load
    setTimeout(() => {
      showToast('Configure sua API Key do Gemini em ⚙️ Configurações', 'success');
    }, 1000);
  }
}

// ============================================
// HOME SCREEN — Lista de Obras
// ============================================

async function renderHome() {
  const container = document.getElementById('obras-list');
  const obras = await getObrasSummary();

  if (obras.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        ${ICONS.building}
        <h3>Nenhuma obra cadastrada</h3>
        <p>Crie sua primeira obra para começar a registrar notas fiscais</p>
        <button class="btn btn-primary mt-lg" onclick="showCreateObraModal()">
          ${ICONS.plus} Nova Obra
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = obras.map(obra => `
    <div class="card" onclick="openObra(${obra.id})">
      <div class="card-title">${escapeHtml(obra.nome)}</div>
      <div class="card-subtitle">${obra.cliente ? escapeHtml(obra.cliente) : 'Sem cliente definido'}</div>
      <div class="card-value">R$ ${formatCurrency(obra.total)}</div>
      <div class="card-footer">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="card-badge ${obra.status === 'ativa' ? 'badge-active' : 'badge-finished'}">
            <span class="status-dot ${obra.status === 'ativa' ? 'active' : 'inactive'}"></span>
            ${obra.status === 'ativa' ? 'Ativa' : 'Finalizada'}
          </span>
          <span class="text-tertiary" style="font-size:0.8rem">${obra.notasCount} nota${obra.notasCount !== 1 ? 's' : ''}</span>
        </div>
        <div class="card-actions" onclick="event.stopPropagation()">
          <button class="btn-card-action" onclick="showEditObraModal(${obra.id})" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-card-action btn-card-action-danger" onclick="confirmDeleteObra(${obra.id})" title="Excluir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  navigateTo('screen-home');
}

// --- Create Obra Modal ---
function showCreateObraModal() {
  document.getElementById('modal-create-obra').classList.add('active');
  document.getElementById('input-obra-nome').value = '';
  document.getElementById('input-obra-cliente').value = '';
  setTimeout(() => document.getElementById('input-obra-nome').focus(), 300);
}

function closeCreateObraModal() {
  document.getElementById('modal-create-obra').classList.remove('active');
}

async function handleCreateObra(e) {
  e.preventDefault();
  const nome = document.getElementById('input-obra-nome').value.trim();
  if (!nome) {
    showToast('Digite o nome da obra', 'error');
    return;
  }
  const cliente = document.getElementById('input-obra-cliente').value.trim();
  const statusEl = document.getElementById('input-obra-status');
  const status = statusEl ? statusEl.value : 'ativa';

  await addObra({ nome, cliente, status });
  closeCreateObraModal();
  showToast('Obra criada com sucesso!');
  await renderHome();
}

// --- Edit Obra Modal ---
async function showEditObraModal(obraId) {
  const id = obraId || currentObraId;
  if (!id) return;
  currentObraId = id;
  const obra = await getObra(id);
  if (!obra) return;

  document.getElementById('input-edit-obra-nome').value = obra.nome || '';
  document.getElementById('input-edit-obra-cliente').value = obra.cliente || '';
  document.getElementById('input-edit-obra-status').value = obra.status || 'ativa';
  document.getElementById('modal-edit-obra').classList.add('active');
  setTimeout(() => document.getElementById('input-edit-obra-nome').focus(), 300);
}

function closeEditObraModal() {
  document.getElementById('modal-edit-obra').classList.remove('active');
}

async function handleEditObra(e) {
  e.preventDefault();
  if (!currentObraId) return;
  const nome = document.getElementById('input-edit-obra-nome').value.trim();
  if (!nome) {
    showToast('Digite o nome da obra', 'error');
    return;
  }
  const cliente = document.getElementById('input-edit-obra-cliente').value.trim();
  const status = document.getElementById('input-edit-obra-status').value;

  await updateObra(currentObraId, { nome, cliente, status });
  closeEditObraModal();
  showToast('Obra atualizada com sucesso!');
  // Refresh whichever screen is visible
  const detailScreen = document.getElementById('screen-obra-detail');
  if (detailScreen && detailScreen.classList.contains('active')) {
    await openObra(currentObraId);
  } else {
    await renderHome();
  }
}

// ============================================
// OBRA DETAIL SCREEN
// ============================================

let currentFilterStatus = 'todos';
let currentFilterPeriodo = 'todos';
let currentNotasCache = [];

function filterNotasByPeriod(notas, periodo) {
  if (periodo === 'todos') return notas;
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
    return true;
  });
}

function setFilterStatus(status) {
  currentFilterStatus = status;
  ['todos', 'pendente', 'reembolsado'].forEach(s => {
    const chip = document.getElementById(`chip-filter-${s}`);
    if (chip) chip.classList.toggle('active', s === status);
  });
  renderNotasFiltered();
}

function setFilterPeriodo(periodo) {
  currentFilterPeriodo = periodo;
  renderNotasFiltered();
}

async function handleToggleReembolso(notaId, novoStatus) {
  await toggleNotaReembolso(notaId, novoStatus);
  showToast(novoStatus ? '🟢 Baixada / Reembolsada!' : '🟡 Pendente de Reembolso');
  await openObra(currentObraId);
}

function renderNotasFiltered() {
  let notas = currentNotasCache;
  if (currentFilterStatus === 'pendente') {
    notas = notas.filter(n => !n.reembolsado);
  } else if (currentFilterStatus === 'reembolsado') {
    notas = notas.filter(n => n.reembolsado);
  }
  notas = filterNotasByPeriod(notas, currentFilterPeriodo);

  const total = notas.reduce((sum, n) => sum + (n.valor || 0), 0);
  document.getElementById('obra-total-value').textContent = `R$ ${formatCurrency(total)}`;
  document.getElementById('obra-total-count').textContent = `${notas.length} nota${notas.length !== 1 ? 's exibidas' : ' exibida'} (${currentNotasCache.length} total)`;

  const listContainer = document.getElementById('notas-list');
  if (notas.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        ${ICONS.receipt}
        <h3>Nenhuma nota encontrada</h3>
        <p>Tente ajustar os filtros de status ou período acima</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = notas.map(nota => {
    let thumbSrc = '';
    if (nota.imagemBlob instanceof Blob) {
      thumbSrc = URL.createObjectURL(nota.imagemBlob);
    } else if (typeof nota.imagemBlob === 'string' && nota.imagemBlob.startsWith('data:')) {
      thumbSrc = nota.imagemBlob;
    }

    return `
      <div class="nota-item" style="${nota.reembolsado ? 'opacity: 0.75;' : ''}">
        ${thumbSrc
          ? `<img class="nota-thumb" src="${thumbSrc}" alt="Nota" onclick="viewImage('${thumbSrc}')">`
          : `<div class="nota-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--text-tertiary)">${ICONS.receipt}</div>`
        }
        <div class="nota-info">
          <div class="nota-loja">${escapeHtml(nota.loja || 'Loja não identificada')}</div>
          <div class="nota-desc">${escapeHtml(nota.itens ? (nota.descricao ? `${nota.itens} — ${nota.descricao}` : nota.itens) : nota.descricao || '')}</div>
          <div class="nota-meta" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px;">
            <span>${formatDateDisplay(nota.data)}</span>
            <button type="button" onclick="event.stopPropagation(); handleToggleReembolso(${nota.id}, ${!nota.reembolsado})" 
              style="background: ${nota.reembolsado ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}; border: 1px solid ${nota.reembolsado ? 'var(--accent)' : '#f59e0b'}; color: ${nota.reembolsado ? 'var(--accent-light)' : '#f59e0b'}; border-radius: 12px; padding: 2px 8px; font-size: 0.72rem; cursor: pointer; font-weight: 600;">
              ${nota.reembolsado ? '🟢 Já Reembolsada' : '🟡 Pendente'}
            </button>
          </div>
        </div>
        <div class="nota-valor">R$ ${formatCurrency(nota.valor || 0)}</div>
        <div class="nota-actions" style="display: flex; gap: 6px;">
          <button class="btn btn-icon btn-secondary btn-sm" onclick="event.stopPropagation(); showEditNotaModal(${nota.id})" title="Editar Nota">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn btn-icon btn-secondary btn-sm" onclick="event.stopPropagation(); confirmDeleteNota(${nota.id})" title="Excluir" style="color: var(--danger-light);">
            ${ICONS.trash}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function openObra(obraId) {
  currentObraId = obraId;
  const obra = await getObra(obraId);
  if (!obra) return;

  const notas = await getNotasByObra(obraId);
  currentNotasCache = notas;

  // Header
  document.getElementById('obra-detail-title').innerHTML = `${escapeHtml(obra.nome)} <span class="card-badge ${obra.status === 'ativa' ? 'badge-active' : 'badge-finished'}" style="font-size:0.75rem;vertical-align:middle;margin-left:8px;"><span class="status-dot ${obra.status === 'ativa' ? 'active' : 'inactive'}"></span>${obra.status === 'ativa' ? 'Ativa' : 'Finalizada'}</span>`;

  renderNotasFiltered();
  navigateTo('screen-obra-detail');
}

// View image fullscreen
function viewImage(src) {
  const viewer = document.getElementById('image-viewer');
  document.getElementById('image-viewer-img').src = src;
  viewer.classList.add('active');
}

function closeImageViewer() {
  document.getElementById('image-viewer').classList.remove('active');
}

// Delete nota
async function confirmDeleteNota(notaId) {
  if (confirm('Tem certeza que deseja excluir esta nota?')) {
    await deleteNota(notaId);
    showToast('Nota excluída');
    await openObra(currentObraId);
  }
}

// Delete obra
async function confirmDeleteObra(obraId) {
  const id = obraId || currentObraId;
  if (!id) return;
  if (confirm('Tem certeza? Isso excluirá a obra e TODAS as notas associadas.')) {
    await deleteObra(id);
    showToast('Obra excluída');
    currentObraId = null;
    await renderHome();
  }
}

// Generate PDF Modal handlers
async function showGeneratePDFModal() {
  const notas = currentNotasCache.length > 0 ? currentNotasCache : await getNotasByObra(currentObraId);
  if (notas.length === 0) {
    showToast('Adicione notas antes de gerar o relatório', 'error');
    return;
  }

  const container = document.getElementById('pdf-manual-list-container');
  container.innerHTML = notas.map(nota => `
    <label style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.82rem; cursor: pointer;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" class="manual-pdf-check" value="${nota.id}" ${!nota.reembolsado ? 'checked' : ''} onchange="updatePDFModalSummary()">
        <span><b>${escapeHtml(nota.loja || 'Nota')}</b> (${formatDateDisplay(nota.data)}) ${nota.reembolsado ? '<small style="color:var(--text-tertiary)">(Baixada)</small>' : ''}</span>
      </div>
      <span style="font-weight: 600;">R$ ${formatCurrency(nota.valor || 0)}</span>
    </label>
  `).join('');

  const temPendente = notas.some(n => !n.reembolsado);
  const radios = document.getElementsByName('pdf-scope');
  for (let r of radios) {
    if (r.value === 'pendentes') r.checked = temPendente;
    if (r.value === 'todas') r.checked = !temPendente;
  }

  updatePDFModalSummary();
  document.getElementById('modal-generate-pdf').classList.add('active');
}

function closeGeneratePDFModal() {
  document.getElementById('modal-generate-pdf').classList.remove('active');
}

function updatePDFModalSummary() {
  const scope = document.querySelector('input[name="pdf-scope"]:checked')?.value || 'pendentes';
  const container = document.getElementById('pdf-manual-list-container');
  container.style.display = (scope === 'manual') ? 'block' : 'none';

  let filtered = [];
  if (scope === 'pendentes') {
    filtered = currentNotasCache.filter(n => !n.reembolsado);
  } else if (scope === '15d') {
    filtered = filterNotasByPeriod(currentNotasCache, '15d');
  } else if (scope === '30d') {
    filtered = filterNotasByPeriod(currentNotasCache, '30d');
  } else if (scope === 'manual') {
    const checkedIds = Array.from(document.querySelectorAll('.manual-pdf-check:checked')).map(cb => Number(cb.value));
    filtered = currentNotasCache.filter(n => checkedIds.includes(n.id));
  } else {
    filtered = currentNotasCache;
  }

  const total = filtered.reduce((sum, n) => sum + (n.valor || 0), 0);
  document.getElementById('pdf-modal-summary-text').textContent = `${filtered.length} nota${filtered.length !== 1 ? 's selecionadas' : ' selecionada'}`;
  document.getElementById('pdf-modal-summary-total').textContent = `Total: R$ ${formatCurrency(total)}`;
}

async function executeGeneratePDF() {
  const scope = document.querySelector('input[name="pdf-scope"]:checked')?.value || 'pendentes';
  let filtered = [];
  let scopeSubtitle = '';

  if (scope === 'pendentes') {
    filtered = currentNotasCache.filter(n => !n.reembolsado);
    scopeSubtitle = 'Prestação de Contas — Notas Pendentes de Reembolso';
  } else if (scope === '15d') {
    filtered = filterNotasByPeriod(currentNotasCache, '15d');
    scopeSubtitle = 'Relatório de Despesas — Últimos 15 Dias';
  } else if (scope === '30d') {
    filtered = filterNotasByPeriod(currentNotasCache, '30d');
    scopeSubtitle = 'Relatório de Despesas — Últimos 30 Dias';
  } else if (scope === 'manual') {
    const checkedIds = Array.from(document.querySelectorAll('.manual-pdf-check:checked')).map(cb => Number(cb.value));
    filtered = currentNotasCache.filter(n => checkedIds.includes(n.id));
    scopeSubtitle = 'Relatório Selecionado de Despesas';
  } else {
    filtered = currentNotasCache;
    scopeSubtitle = 'Relatório Completo da Obra';
  }

  if (filtered.length === 0) {
    showToast('Nenhuma nota selecionada para o relatório', 'error');
    return;
  }

  closeGeneratePDFModal();

  const obra = await getObra(currentObraId);
  const logoBase64 = await getLogo();
  const pixKey = await getConfig('pixKey');
  const pixName = await getConfig('pixName') || 'BENEFICIARIO';
  const pixCity = await getConfig('pixCity') || 'SAO PAULO';
  const pixConfig = pixKey ? { key: pixKey, name: pixName, city: pixCity } : null;

  try {
    await generatePDF(obra, filtered, logoBase64, pixConfig, scopeSubtitle);
    showToast('PDF gerado com sucesso!');

    const autoBaixa = document.getElementById('check-auto-baixa')?.checked;
    if (autoBaixa) {
      const idsToMark = filtered.map(n => n.id);
      await markNotasReembolsadas(idsToMark, true);
      showToast('🟢 Notas marcadas como Baixadas/Reembolsadas!');
      await openObra(currentObraId);
    }
  } catch (e) {
    console.error('Erro detalhado PDF:', e);
    showToast('Erro ao gerar PDF: ' + (e.message || e), 'error');
  }
}

// ============================================
// ADD NOTA SCREEN
// ============================================

function openAddNota() {
  capturedImageBase64 = null;
  document.getElementById('nota-image-upload-area').classList.remove('hidden');
  document.getElementById('nota-image-preview-container').classList.add('hidden');
  document.getElementById('nota-ocr-loading').classList.add('hidden');
  document.getElementById('nota-form-fields').classList.add('hidden');
  document.getElementById('nota-form-fields').classList.add('hidden');
  document.getElementById('btn-save-nota').classList.add('hidden');

  // Clear form
  document.getElementById('input-nota-loja').value = '';
  document.getElementById('input-nota-valor').value = '';
  document.getElementById('input-nota-itens').value = '';
  document.getElementById('input-nota-descricao').value = '';
  document.getElementById('input-nota-data').value = new Date().toISOString().split('T')[0];

  navigateTo('screen-add-nota');
}

function triggerImageInput() {
  document.getElementById('nota-image-input').click();
}

async function handleImageSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // Resize & convert to base64
    const base64 = await resizeImage(file, 1024);
    capturedImageBase64 = base64;

    // Show preview
    document.getElementById('nota-image-preview').src = base64;
    document.getElementById('nota-image-upload-area').classList.add('hidden');
    document.getElementById('nota-image-preview-container').classList.remove('hidden');

    // Start OCR
    await runOCR(base64);
  } catch (e) {
    console.error(e);
    showToast('Erro ao processar imagem', 'error');
  }

  // Reset file input so same file can be re-selected
  event.target.value = '';
}

function removeImage() {
  capturedImageBase64 = null;
  document.getElementById('nota-image-upload-area').classList.remove('hidden');
  document.getElementById('nota-image-preview-container').classList.add('hidden');
  document.getElementById('nota-form-fields').classList.add('hidden');
  document.getElementById('btn-save-nota').classList.add('hidden');
}

async function runOCR(imageBase64) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    showToast('Configure sua API Key em ⚙️ Configurações', 'error');
    // Still show the form for manual input
    showFormFields();
    return;
  }

  // Show loading
  document.getElementById('nota-ocr-loading').classList.remove('hidden');
  document.getElementById('nota-form-fields').classList.add('hidden');
  document.getElementById('btn-save-nota').classList.add('hidden');

  try {
    const result = await analyzeReceipt(imageBase64, apiKey);

    // Fill form with OCR results
    if (result.loja) document.getElementById('input-nota-loja').value = result.loja;
    if (result.valor) document.getElementById('input-nota-valor').value = result.valor.toFixed(2);
    if (result.itens) document.getElementById('input-nota-itens').value = result.itens;
    if (result.data) document.getElementById('input-nota-data').value = result.data;

    showToast('Nota analisada com sucesso!');
  } catch (e) {
    console.error(e);
    showToast(e.message || 'Erro ao analisar nota', 'error');
  }

  // Hide loading, show form
  document.getElementById('nota-ocr-loading').classList.add('hidden');
  showFormFields();
}

function showFormFields() {
  document.getElementById('nota-form-fields').classList.remove('hidden');
  document.getElementById('btn-save-nota').classList.remove('hidden');
}

async function handleSaveNota(e) {
  e.preventDefault();

  const valor = parseFloat(document.getElementById('input-nota-valor').value);
  if (!valor || valor <= 0) {
    showToast('Informe o valor da nota', 'error');
    return;
  }

  // Convert base64 to blob for storage
  let imagemBlob = null;
  if (capturedImageBase64) {
    try {
      imagemBlob = await base64ToBlob(capturedImageBase64);
    } catch {
      imagemBlob = capturedImageBase64; // fallback to storing as string
    }
  }

  const nota = {
    obraId: currentObraId,
    imagemBlob,
    loja: document.getElementById('input-nota-loja').value.trim(),
    valor,
    itens: document.getElementById('input-nota-itens').value.trim(),
    descricao: document.getElementById('input-nota-descricao').value.trim(),
    data: document.getElementById('input-nota-data').value
  };

  await addNota(nota);
  showToast('Nota salva com sucesso!');
  await openObra(currentObraId);
}

// --- Edit Nota Modal ---
let currentNotaId = null;

async function showEditNotaModal(notaId) {
  currentNotaId = notaId;
  const nota = await getNota(notaId);
  if (!nota) return;

  document.getElementById('input-edit-nota-loja').value = nota.loja || '';
  document.getElementById('input-edit-nota-valor').value = nota.valor !== undefined && nota.valor !== null ? nota.valor : '';
  document.getElementById('input-edit-nota-itens').value = nota.itens || '';
  document.getElementById('input-edit-nota-descricao').value = nota.descricao || '';
  document.getElementById('input-edit-nota-data').value = nota.data || '';

  document.getElementById('modal-edit-nota').classList.add('active');
  setTimeout(() => document.getElementById('input-edit-nota-loja').focus(), 300);
}

function closeEditNotaModal() {
  document.getElementById('modal-edit-nota').classList.remove('active');
  currentNotaId = null;
}

async function handleEditNota(e) {
  e.preventDefault();
  if (!currentNotaId) return;

  const valor = parseFloat(document.getElementById('input-edit-nota-valor').value);
  if (isNaN(valor) || valor < 0) {
    showToast('Informe um valor válido', 'error');
    return;
  }

  const loja = document.getElementById('input-edit-nota-loja').value.trim();
  const itens = document.getElementById('input-edit-nota-itens').value.trim();
  const descricao = document.getElementById('input-edit-nota-descricao').value.trim();
  const data = document.getElementById('input-edit-nota-data').value;

  await updateNota(currentNotaId, { loja, valor, itens, descricao, data });
  closeEditNotaModal();
  showToast('Nota atualizada com sucesso!');
  if (currentObraId) {
    await openObra(currentObraId);
  }
}

// ============================================
// SETTINGS SCREEN
// ============================================

async function openSettings() {
  const apiKey = await getApiKey() || '';
  const pixKey = await getConfig('pixKey') || '';
  const pixName = await getConfig('pixName') || '';
  const pixCity = await getConfig('pixCity') || 'SAO PAULO';
  if (document.getElementById('input-api-key')) document.getElementById('input-api-key').value = apiKey;
  if (document.getElementById('input-pix-key')) document.getElementById('input-pix-key').value = pixKey;
  if (document.getElementById('input-pix-name')) document.getElementById('input-pix-name').value = pixName;
  if (document.getElementById('input-pix-city')) document.getElementById('input-pix-city').value = pixCity;

  navigateTo('screen-settings');
}

async function handleSaveApiKey() {
  const key = document.getElementById('input-api-key').value.trim();
  await setApiKey(key);
  showToast('Conexão IA salva com sucesso!');
}

async function handleSavePix() {
  const key = document.getElementById('input-pix-key').value.trim();
  const name = document.getElementById('input-pix-name').value.trim() || 'BENEFICIARIO';
  const city = document.getElementById('input-pix-city').value.trim() || 'SAO PAULO';
  await setConfig('pixKey', key);
  await setConfig('pixName', name);
  await setConfig('pixCity', city);
  showToast('Dados para recebimento Pix salvos!');
}

// Backup
async function handleExportBackup() {
  try {
    const data = await exportAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `caixinha_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showToast('Backup exportado!');
  } catch (e) {
    console.error(e);
    showToast('Erro ao exportar backup', 'error');
  }
}

function triggerImportBackup() {
  document.getElementById('input-backup-file').click();
}

async function handleImportBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!confirm('Isso substituirá TODOS os dados atuais. Deseja continuar?')) {
    event.target.value = '';
    return;
  }

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    await importAllData(data);
    showToast('Backup restaurado com sucesso!');
    await renderHome();
  } catch (e) {
    console.error(e);
    showToast('Erro ao importar backup: arquivo inválido', 'error');
  }
  event.target.value = '';
}

// ============================================
// HELPERS
// ============================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatCurrency(value) {
  return (value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  } catch { return dateStr; }
}

// Go back logic
function goBack() {
  if (currentScreen === 'screen-obra-detail') {
    renderHome();
  } else if (currentScreen === 'screen-add-nota') {
    openObra(currentObraId);
  } else if (currentScreen === 'screen-settings') {
    renderHome();
  } else {
    renderHome();
  }
}
