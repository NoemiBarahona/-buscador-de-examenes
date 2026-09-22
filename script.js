let allExams = [];
let selectedExams = JSON.parse(localStorage.getItem('selectedExams')) || [];
let showingAll = false;

document.addEventListener('DOMContentLoaded', () => {
  fetch('examenes.json')
    .then(response => response.json())
    .then(data => {
      allExams = data;
      updateSelectedUI();
    })
    .catch(error => console.error('Error al cargar el JSON:', error));
});

function cleanText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatPasos(pasos) {
  if (Array.isArray(pasos)) {
    return `<ul class="list-disc list-inside space-y-1 mt-1">${pasos.map(p => `<li>${p}</li>`).join('')}</ul>`;
  }
  return pasos || 'Sin indicaciones especiales.';
}

function renderExams(exams) {
  const container = document.getElementById('examList');
  if (!container) return;
  container.innerHTML = '';

  if (!exams || exams.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500 bg-white rounded-2xl border border-gray-200 p-6">
        <p class="text-sm sm:text-base">No hay exámenes en pantalla. Usa el buscador o presiona "Ver todos".</p>
      </div>
    `;
    return;
  }

  exams.forEach(exam => {
    const isSelected = selectedExams.some(e => e.codigo === exam.codigo);
    
    const requisitosHTML = Array.isArray(exam.requisitos_rapidos) 
      ? exam.requisitos_rapidos.map(r => `<span class="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-md font-medium mr-1 mb-1">${r}</span>`).join('')
      : '';

    const card = document.createElement('div');
    card.className = "bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-200 transition-all hover:shadow-md";
    card.innerHTML = `
      <div class="pb-3 border-b border-gray-100">
        <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block mb-1">
          Código: ${exam.codigo}
        </span>
        <h3 class="text-base sm:text-xl font-bold text-gray-800">${exam.nombre}</h3>
      </div>

      <div class="mt-3 sm:mt-4 space-y-3 text-xs sm:text-sm text-gray-600">
        <p><strong class="text-gray-800">📋 Tipo de muestra:</strong> ${exam.tipo || 'No especificado'}</p>
        
        ${requisitosHTML ? `<div>${requisitosHTML}</div>` : ''}

        <div class="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
          <p class="font-semibold text-amber-900 text-xs uppercase tracking-wider mb-1">Pasos de preparación:</p>
          <div class="text-amber-800">${formatPasos(exam.pasos_preparacion)}</div>
        </div>

        ${exam.importancia ? `<p class="text-xs text-gray-500 italic"><strong class="text-gray-700">💡 Importancia:</strong> ${exam.importancia}</p>` : ''}

        <div class="pt-2 sm:flex sm:justify-end border-t border-gray-100 sm:border-0 sm:pt-0">
          <button 
            type="button"
            onclick="toggleSelectExam('${exam.codigo}')"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0 ${
              isSelected 
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
            }"
          >
            ${isSelected ? '❌ Quitar de mi lista' : '➕ Agregar a mi lista'}
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function filterExams() {
  const query = cleanText(document.getElementById('searchInput').value.trim());
  const btn = document.getElementById('showAllBtn');

  if (query === '') {
    if (!showingAll) {
      renderExams([]);
    } else {
      renderExams(allExams);
    }
    return;
  }

  showingAll = false;
  const eyeIcon = `<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
  btn.innerHTML = `${eyeIcon} Ver todos`;
  btn.className = "bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-44 shrink-0";

  const filtered = allExams.filter(exam => {
    const nombre = cleanText(exam.nombre || '');
    const codigo = cleanText(exam.codigo || '');
    const tipo = cleanText(exam.tipo || '');
    const sinonimos = cleanText(exam.sinonimos || '');

    return (
      nombre.includes(query) || 
      codigo.includes(query) || 
      tipo.includes(query) || 
      sinonimos.includes(query)
    );
  });

  renderExams(filtered);
}

function toggleShowAll() {
  const btn = document.getElementById('showAllBtn');
  document.getElementById('searchInput').value = '';

  const eyeIcon = `<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
  const eyeOffIcon = `<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 013.122-.063c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-2.155 3.592m-2.228 2.228a9.98 9.98 0 01-2.589 1.17M3 3l18 18"/></svg>`;

  if (showingAll) {
    showingAll = false;
    btn.innerHTML = `${eyeIcon} Ver todos`;
    btn.className = "bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-44 shrink-0";
    renderExams([]); 
  } else {
    showingAll = true;
    btn.innerHTML = `${eyeOffIcon} Ocultar lista`;
    btn.className = "bg-slate-600 hover:bg-slate-700 text-white font-medium px-5 py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-44 shrink-0";
    renderExams(allExams);
  }
}

function toggleSelectExam(codigo) {
  const examIndex = selectedExams.findIndex(e => e.codigo === codigo);

  if (examIndex > -1) {
    selectedExams.splice(examIndex, 1);
  } else {
    const examToAdd = allExams.find(e => e.codigo === codigo);
    if (examToAdd) selectedExams.push(examToAdd);
  }

  localStorage.setItem('selectedExams', JSON.stringify(selectedExams));
  updateSelectedUI();
  
  const currentQuery = cleanText(document.getElementById('searchInput').value.trim());
  if (currentQuery) {
    filterExams();
  } else if (showingAll) {
    renderExams(allExams);
  } else {
    renderExams([]);
  }
}

function clearSelectedExams() {
  selectedExams = [];
  localStorage.removeItem('selectedExams');
  updateSelectedUI();
  if (showingAll) renderExams(allExams);
  const currentQuery = cleanText(document.getElementById('searchInput').value.trim());
  if (currentQuery) filterExams();
}

function updateSelectedUI() {
  const count = selectedExams.length;
  
  const countEl = document.getElementById('selectedCount');
  const mobileCountEl = document.getElementById('mobileSelectedCount');
  
  if (countEl) countEl.textContent = count;
  if (mobileCountEl) mobileCountEl.textContent = count;

  const desktopContainer = document.getElementById('selectedExamsList');
  const mobileContainer = document.getElementById('mobileSelectedExamsList');

  if (count === 0) {
    const emptyHTML = `<p class="text-sm text-gray-400 text-center py-6">No has seleccionado ningún examen aún.</p>`;
    if (desktopContainer) desktopContainer.innerHTML = emptyHTML;
    if (mobileContainer) mobileContainer.innerHTML = emptyHTML;
    return;
  }

  const itemsHTML = selectedExams.map(exam => `
    <div class="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-2 relative group">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-gray-800 text-sm">${exam.nombre}</h4>
        <button 
          type="button"
          onclick="toggleSelectExam('${exam.codigo}')" 
          class="text-red-500 hover:text-red-700 font-bold text-base leading-none px-1"
          title="Eliminar"
        >
          &times;
        </button>
      </div>
      <p class="text-gray-500 font-medium">${exam.tipo || ''}</p>
      <div class="text-amber-900 bg-amber-50 p-2 rounded border border-amber-200">
        <span class="font-bold block mb-1">Preparación:</span>
        ${formatPasos(exam.pasos_preparacion)}
      </div>
    </div>
  `).join('');

  if (desktopContainer) desktopContainer.innerHTML = itemsHTML;
  if (mobileContainer) mobileContainer.innerHTML = itemsHTML;
}

function toggleModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.toggle('hidden');
}

function toggleMobileCart() {
  toggleModal('mobileCartModal');
}

function removeEmojis(string) {
  if (!string) return '';
  return string
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Component}\p{Symbol}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function imprimirResumen() {
  if (!selectedExams || selectedExams.length === 0) {
    alert("Por favor, selecciona al menos un examen antes de imprimir el resumen.");
    return;
  }

  const oldPrintSection = document.getElementById('printSection');
  if (oldPrintSection) {
    oldPrintSection.remove();
  }

  let htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Resumen de Exámenes Médicos</title>
      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          background-color: #ffffff;
          padding: 24px;
          margin: 0;
        }
        .header {
          border-bottom: 3px solid #059669;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 18px;
          font-weight: bold;
          margin: 0;
          color: #047857;
          text-transform: uppercase;
        }
        .header p {
          font-size: 11px;
          color: #4b5563;
          margin-top: 4px;
        }
        .exam-card {
          border: 1px solid #a7f3d0;
          border-left: 4px solid #059669;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 14px;
          background-color: #f0fdf4;
          page-break-inside: avoid;
        }
        .exam-card h3 {
          font-size: 15px;
          font-weight: bold;
          color: #065f46;
          margin: 0 0 4px 0;
        }
        .exam-card p {
          font-size: 12px;
          color: #047857;
          margin: 0 0 8px 0;
        }
        .footer {
          margin-top: 30px;
          border-top: 1px solid #d1d5db;
          padding-top: 12px;
          font-size: 11px;
          color: #047857;
          text-align: center;
          font-weight: 500;
        }
        ol {
          margin: 4px 0 0 18px;
          padding: 0;
          font-size: 12px;
          color: #1f2937;
        }
        li {
          margin-bottom: 3px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Indicaciones de Preparación para Exámenes Médicos</h1>
        <p>Documento informativo previo a la toma de muestras de laboratorio.</p>
      </div>
  `;

  selectedExams.forEach(exam => {
    const nombreLimpio = removeEmojis(exam.nombre || 'Examen sin nombre');
    const tipoLimpio = removeEmojis(exam.tipo || 'No especificado');

    let pasosHTML = '';
    if (Array.isArray(exam.pasos_preparacion)) {
      pasosHTML = `<ol>${exam.pasos_preparacion.map(p => `<li>${removeEmojis(p)}</li>`).join('')}</ol>`;
    } else {
      pasosHTML = `<p>${removeEmojis(exam.pasos_preparacion || 'Sin indicaciones especiales.')}</p>`;
    }

    htmlContent += `
      <div class="exam-card">
        <h3>${nombreLimpio}</h3>
        <p><strong>Tipo de muestra:</strong> ${tipoLimpio}</p>
        <div>
          <strong style="font-size: 12px; color: #111827;">Indicaciones:</strong>
          ${pasosHTML}
        </div>
      </div>
    `;
  });

  htmlContent += `
      <div class="footer">
        Por favor, cumpla estrictamente con las indicaciones de ayuno e higiene antes de acudir al laboratorio.
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    alert("Por favor, permite las ventanas emergentes (pop-ups) en tu navegador para poder imprimir.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = function () {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
}