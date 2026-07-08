// ============================================
// CaixinhaApp — PDF Generation (jsPDF + autoTable)
// ============================================

/**
 * Generate a PDF report for an obra
 * @param {Object} obra - Obra object
 * @param {Array} notas - Array of nota objects for this obra
 * @param {string|null} logoBase64 - Logo image as base64 data URL
 */
async function generatePDF(obra, notas, logoBase64, pixConfig, scopeSubtitle = '') {
  const jsPDF = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;
  if (!jsPDF) {
    throw new Error("A biblioteca jsPDF não foi carregada. Verifique se as bibliotecas CDN no index.html carregaram corretamente.");
  }
  const doc = new jsPDF('p', 'mm', 'a4');

  if (typeof doc.autoTable !== 'function') {
    if (window.jspdf && typeof window.jspdf.autoTable === 'function') {
      doc.autoTable = function(opts) { return window.jspdf.autoTable(this, opts); };
    } else if (typeof window.autoTable === 'function') {
      doc.autoTable = function(opts) { return window.autoTable(this, opts); };
    } else {
      throw new Error("O plugin jsPDF-AutoTable não foi encontrado.");
    }
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // --- Header with Logo ---
  let logoWidth = 0;
  let logoHeight = 0;

  if (logoBase64) {
    try {
      let format = 'JPEG';
      if (typeof logoBase64 === 'string' && (logoBase64.includes('image/png') || logoBase64.endsWith('.png'))) {
        format = 'PNG';
      }

      // Calculate aspect ratio so the logo is never distorted!
      let targetW = 40;
      let targetH = 22;
      try {
        const props = doc.getImageProperties(logoBase64);
        if (props && props.width && props.height) {
          const ratio = props.width / props.height;
          if (ratio >= 1) { // Landscape / wider (e.g. Zenit Engenharia)
            targetW = Math.min(46, 22 * ratio);
            targetH = targetW / ratio;
            if (targetH > 24) {
              targetH = 24;
              targetW = targetH * ratio;
            }
          } else { // Portrait or square
            targetH = 24;
            targetW = targetH * ratio;
          }
        }
      } catch (propErr) {
        console.warn('Não foi possível ler proporções da imagem, usando tamanho preservado padrão:', propErr);
        targetW = 38;
        targetH = 20;
      }

      logoWidth = targetW;
      logoHeight = targetH;

      doc.addImage(logoBase64, format, margin, yPos, logoWidth, logoHeight);
      yPos += 2;
    } catch (e) {
      console.warn('Failed to add logo to PDF with explicit format, trying auto:', e);
      try {
        logoWidth = 38;
        logoHeight = 20;
        doc.addImage(logoBase64, undefined, margin, yPos, logoWidth, logoHeight);
        yPos += 2;
      } catch (e2) {
        console.error('Could not add logo to PDF:', e2);
        logoWidth = 0;
        logoHeight = 0;
      }
    }
  }

  // Title - right aligned or centered based on logo
  const titleX = logoWidth > 0 ? margin + logoWidth + 8 : margin;
  const titleMaxWidth = logoWidth > 0 ? contentWidth - (logoWidth + 8) : contentWidth;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text('Relatório de Despesas', titleX, yPos + 8, { maxWidth: titleMaxWidth });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Obra: ${obra.nome}`, titleX, yPos + 16, { maxWidth: titleMaxWidth });

  if (obra.cliente) {
    doc.text(`Cliente: ${obra.cliente}`, titleX, yPos + 22, { maxWidth: titleMaxWidth });
  }

  const dataGeracao = new Date().toLocaleDateString('pt-BR');
  doc.text(`Gerado em: ${dataGeracao}`, titleX, yPos + (obra.cliente ? 28 : 22), { maxWidth: titleMaxWidth });

  if (scopeSubtitle) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(scopeSubtitle, titleX, yPos + (obra.cliente ? 34 : 28), { maxWidth: titleMaxWidth });
  }

  const textHeight = obra.cliente ? (scopeSubtitle ? 38 : 32) : (scopeSubtitle ? 32 : 26);
  yPos = margin + Math.max(logoHeight > 0 ? logoHeight + 6 : 0, textHeight);

  // --- Divider ---
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // --- Summary Box ---
  const totalValor = notas.reduce((sum, n) => {
    const val = typeof n.valor === 'number' ? n.valor : parseFloat(String(n.valor || 0).replace(',', '.'));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  const totalNotas = notas.length;

  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, yPos, contentWidth, 18, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Total de notas: ${totalNotas}`, margin + 6, yPos + 7);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`Total: R$ ${formatCurrency(totalValor)}`, pageWidth - margin - 6, yPos + 12, { align: 'right' });

  yPos += 26;

  // --- Table ---
  const tableData = notas.map(nota => [
    formatDate(nota.data),
    nota.itens || '-',
    nota.loja || '-',
    nota.descricao || '-',
    `R$ ${formatCurrency(nota.valor)}`
  ]);

  // Add total row
  tableData.push([
    { content: '', styles: { fillColor: [240, 240, 240] } },
    { content: '', styles: { fillColor: [240, 240, 240] } },
    { content: '', styles: { fillColor: [240, 240, 240] } },
    {
      content: 'TOTAL GERAL',
      styles: { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'right' }
    },
    {
      content: `R$ ${formatCurrency(totalValor)}`,
      styles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [16, 130, 90] }
    }
  ]);

  doc.autoTable({
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [['Data', 'Nº da Nota', 'Loja / Origem', 'Descrição', 'Valor']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [26, 34, 53],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: 3.5,
      textColor: [50, 50, 50],
      lineColor: [230, 230, 230],
      lineWidth: 0.3
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 40 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252]
    },
    didDrawPage: function (data) {
      // Footer on each page
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 180);
      doc.text(
        `Caixinha — Relatório de Despesas — Página ${data.pageNumber} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }
  });

  // --- Pix Payment Box ---
  if (pixConfig && pixConfig.key) {
    let afterTableY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : yPos + 20;
    if (afterTableY > 230) {
      doc.addPage();
      afterTableY = margin + 10;
    }

    const pixPayload = generatePixPayload(pixConfig.key, pixConfig.name, pixConfig.city, totalValor, `OBRA${obra.id}`);

    // Draw background box
    doc.setFillColor(245, 250, 247);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, afterTableY, contentWidth, 42, 3, 3, 'FD');

    let qrDataUrl = null;
    try {
      if (typeof window.qrcode === 'function') {
        const qr = window.qrcode(0, 'M');
        qr.addData(pixPayload);
        qr.make();
        qrDataUrl = qr.createDataURL(3, 0);
      }
    } catch (errQr) {
      console.warn('Erro ao gerar QR Code para o PDF:', errQr);
    }

    if (qrDataUrl) {
      try {
        let qrFormat = 'PNG';
        if (qrDataUrl.includes('image/gif')) qrFormat = 'GIF';
        doc.addImage(qrDataUrl, qrFormat, margin + 4, afterTableY + 4, 34, 34);
      } catch (errAdd) {
        console.warn('Falha addImage QR Code:', errAdd);
      }
    }

    const textX = margin + (qrDataUrl ? 42 : 8);
    const textMaxW = contentWidth - (qrDataUrl ? 48 : 16);

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 130, 90);
    doc.text('Pagamento via Pix (QR Code / Copia e Cola)', textX, afterTableY + 8);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(`Valor Total a Receber: R$ ${formatCurrency(totalValor)}`, textX, afterTableY + 14);
    doc.text(`Beneficiário: ${pixConfig.name || 'Titular'} — Chave Pix: ${pixConfig.key}`, textX, afterTableY + 19);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Código Pix (Copia e Cola):', textX, afterTableY + 26);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(40, 40, 40);
    const splitPayload = doc.splitTextToSize(pixPayload, textMaxW);
    doc.text(splitPayload, textX, afterTableY + 31);
  }

  // --- Save / Download ---
  const fileName = `relatorio_${sanitizeFilename(obra.nome)}_${new Date().toISOString().split('T')[0]}.pdf`;
  try {
    doc.save(fileName);
  } catch (e) {
    console.warn('doc.save falhou, tentando fallback com Blob URL:', e);
    try {
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (e2) {
      console.warn('Fallback Blob falhou, abrindo PDF em nova aba:', e2);
      doc.output('dataurlnewwindow');
    }
  }
}

// --- Helper Functions ---

function formatCurrency(value) {
  const num = typeof value === 'number' ? value : parseFloat(String(value || 0).replace(',', '.'));
  if (isNaN(num)) return '0,00';
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function sanitizeFilename(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase()
    .substring(0, 50);
}

function generatePixPayload(key, name, city, amount, txid = '***') {
  function formatField(id, value) {
    const len = String(value.length).padStart(2, '0');
    return `${id}${len}${value}`;
  }

  const cleanName = (name || 'BENEFICIARIO').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase().substring(0, 25) || 'BENEFICIARIO';
  const cleanCity = (city || 'SAO PAULO').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase().substring(0, 15) || 'SAO PAULO';
  const cleanTxId = (txid || '***').replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || '***';

  let gui = formatField('00', 'br.gov.bcb.pix');
  let keyField = formatField('01', key);
  let merchantAccount = formatField('26', gui + keyField);

  let payload = '';
  payload += formatField('00', '01'); // Payload Format Indicator
  payload += merchantAccount;
  payload += formatField('52', '0000'); // Merchant Category Code
  payload += formatField('53', '986'); // Transaction Currency (BRL)
  if (amount && amount > 0) {
    payload += formatField('54', Number(amount).toFixed(2));
  }
  payload += formatField('58', 'BR'); // Country Code
  payload += formatField('59', cleanName); // Merchant Name
  payload += formatField('60', cleanCity); // Merchant City

  let addData = formatField('05', cleanTxId);
  payload += formatField('62', addData);

  payload += '6304'; // CRC16 prefix

  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  const crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  return payload + crcHex;
}
