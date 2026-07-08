// ============================================
// CaixinhaApp — Database Layer (Dexie.js / IndexedDB)
// ============================================

const DB_NAME = 'CaixinhaAppDB';
const DB_VERSION = 1;

let db;

/**
 * Initialize the database
 */
function initDB() {
  db = new Dexie(DB_NAME);

  db.version(DB_VERSION).stores({
    obras: '++id, nome, status, criadoEm',
    notas: '++id, obraId, loja, valor, data, criadoEm',
    config: 'chave'
  });

  return db;
}

// --- Obras ---

async function addObra(obra) {
  const now = new Date().toISOString();
  return await db.obras.add({
    nome: obra.nome,
    cliente: obra.cliente || '',
    status: 'ativa',
    criadoEm: now
  });
}

async function getObras() {
  return await db.obras.orderBy('criadoEm').reverse().toArray();
}

async function getObra(id) {
  return await db.obras.get(id);
}

async function updateObra(id, changes) {
  return await db.obras.update(id, changes);
}

async function deleteObra(id) {
  // Delete all notas for this obra first
  await db.notas.where('obraId').equals(id).delete();
  return await db.obras.delete(id);
}

// --- Notas ---

async function addNota(nota) {
  const now = new Date().toISOString();
  return await db.notas.add({
    obraId: nota.obraId,
    imagemBlob: nota.imagemBlob || null,
    loja: nota.loja || '',
    valor: parseFloat(nota.valor) || 0,
    itens: nota.itens || '',
    descricao: nota.descricao || '',
    data: nota.data || new Date().toISOString().split('T')[0],
    reembolsado: !!nota.reembolsado,
    criadoEm: now
  });
}

async function toggleNotaReembolso(id, status) {
  return await db.notas.update(id, { reembolsado: status });
}

async function markNotasReembolsadas(idsArray, status = true) {
  for (const id of idsArray) {
    await db.notas.update(id, { reembolsado: status });
  }
}

async function getNotasByObra(obraId) {
  return await db.notas.where('obraId').equals(obraId).reverse().sortBy('criadoEm');
}

async function getNota(id) {
  return await db.notas.get(id);
}

async function updateNota(id, changes) {
  if (changes.valor !== undefined) {
    changes.valor = parseFloat(changes.valor) || 0;
  }
  return await db.notas.update(id, changes);
}

async function deleteNota(id) {
  return await db.notas.delete(id);
}

async function getTotalByObra(obraId) {
  const notas = await db.notas.where('obraId').equals(obraId).toArray();
  return notas.reduce((sum, n) => sum + (n.valor || 0), 0);
}

async function getNotasCountByObra(obraId) {
  return await db.notas.where('obraId').equals(obraId).count();
}

// --- Config ---

async function getConfig(chave) {
  const item = await db.config.get(chave);
  return item ? item.valor : null;
}

async function setConfig(chave, valor) {
  return await db.config.put({ chave, valor });
}

async function getApiKey() {
  const custom = await getConfig('apiKey');
  return custom || '';
}

async function setApiKey(key) {
  return await setConfig('apiKey', key);
}

async function getLogo() {
  const custom = await getConfig('logoBase64');
  if (custom) return custom;
  try {
    const res = await fetch('assets/logo.jpeg');
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {
    console.warn('Erro ao carregar assets/logo.jpeg padrão:', e);
  }
  return null;
}

async function setLogo(base64) {
  return await setConfig('logoBase64', base64);
}

// --- Backup / Restore ---

async function exportAllData() {
  const obras = await db.obras.toArray();
  const notas = await db.notas.toArray();

  // Convert image blobs to base64 for export
  const notasExport = await Promise.all(notas.map(async (nota) => {
    let imagemBase64 = null;
    if (nota.imagemBlob instanceof Blob) {
      imagemBase64 = await blobToBase64(nota.imagemBlob);
    } else if (typeof nota.imagemBlob === 'string') {
      imagemBase64 = nota.imagemBlob;
    }
    return { ...nota, imagemBlob: imagemBase64 };
  }));

  const config = await db.config.toArray();

  return {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    obras,
    notas: notasExport,
    config
  };
}

async function importAllData(data) {
  if (!data || !data.obras || !data.notas) {
    throw new Error('Arquivo de backup inválido.');
  }

  // Clear existing data
  await db.obras.clear();
  await db.notas.clear();
  await db.config.clear();

  // Restore obras
  await db.obras.bulkAdd(data.obras);

  // Restore notas — convert base64 images back to blobs
  const notasImport = await Promise.all(data.notas.map(async (nota) => {
    if (nota.imagemBlob && typeof nota.imagemBlob === 'string' && nota.imagemBlob.startsWith('data:')) {
      nota.imagemBlob = await base64ToBlob(nota.imagemBlob);
    }
    return nota;
  }));
  await db.notas.bulkAdd(notasImport);

  // Restore config
  if (data.config) {
    await db.config.bulkAdd(data.config);
  }
}

// --- Helpers ---

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64) {
  return fetch(base64).then(r => r.blob());
}

// Get summary stats for each obra (for the home screen)
async function getObrasSummary() {
  const obras = await getObras();
  const summaries = await Promise.all(obras.map(async (obra) => {
    const total = await getTotalByObra(obra.id);
    const count = await getNotasCountByObra(obra.id);
    return { ...obra, total, notasCount: count };
  }));
  return summaries;
}

// Get all notas across all obras (for dashboard)
async function getAllNotas() {
  return await db.notas.orderBy('data').reverse().toArray();
}
