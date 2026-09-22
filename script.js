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

// Función auxiliar para normalizar texto (quita mayúsculas y tildes)
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
  container.innerHTML = '';

  if (!exams || exams.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <p class="text-lg">No hay exámenes en pantalla. Usa el buscador o presiona "Ver todos".</p>
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
    card.className = "bg-white p-5 rounded-2xl shadow-sm border border-gray-200 transition-all hover:shadow-md";
    card.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100">
        <div>
          <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            Código: ${exam.codigo}
          </span>
          <h3 class="text-xl font-bold text-gray-800 mt-1">${exam.nombre}</h3>
        </div>
        <button 
          onclick="toggleSelectExam('${exam.codigo}')"
          class="px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0 ${
            isSelected 
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
          }"
        >
          ${isSelected ? '❌ Quitar' : '➕ Agregar a mi lista'}
        </button>
      </div>

      <div class="mt-4 space-y-3 text-sm text-gray-600">
        <p><strong class="text-gray-800">📋 Tipo de muestra:</strong> ${exam.tipo || 'No especificado'}</p>
        
        ${requisitosHTML ? `<div>${requisitosHTML}</div>` : ''}

        <div class="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
          <p class="font-semibold text-amber-900 text-xs uppercase tracking-wider mb-1">Pasos de preparación:</p>
          <div class="text-amber-800">${formatPasos(exam.pasos_preparacion)}</div>
        </div>

        ${exam.importancia ? `<p class="text-xs text-gray-500 italic"><strong class="text-gray-700">💡 Importancia:</strong> ${exam.importancia}</p>` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

// Búsqueda flexible con soporte para tildes, mayúsculas y sinónimos
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
  btn.innerHTML = `
    <svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
    Ver todos
  `;
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

// Botón Toggle para "Ver Todos / Ocultar"
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
  }
}

function clearSelectedExams() {
  selectedExams = [];
  localStorage.removeItem('selectedExams');
  updateSelectedUI();
  if (showingAll) renderExams(allExams);
}

function updateSelectedUI() {
  const count = selectedExams.length;
  document.getElementById('selectedCount').textContent = count;
  document.getElementById('mobileSelectedCount').textContent = count;

  const desktopContainer = document.getElementById('selectedExamsList');
  const mobileContainer = document.getElementById('mobileSelectedExamsList');

  if (count === 0) {
    const emptyHTML = `<p class="text-sm text-gray-400 text-center py-6">No has seleccionado ningún examen aún.</p>`;
    desktopContainer.innerHTML = emptyHTML;
    mobileContainer.innerHTML = emptyHTML;
    return;
  }

  const itemsHTML = selectedExams.map(exam => `
    <div class="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-2 relative group">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-gray-800 text-sm">${exam.nombre}</h4>
        <button 
          onclick="toggleSelectExam('${exam.codigo}')" 
          class="text-red-500 hover:text-red-700 font-bold text-base leading-none"
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

  desktopContainer.innerHTML = itemsHTML;
  mobileContainer.innerHTML = itemsHTML;
}

function toggleModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.toggle('hidden');
}

function toggleMobileCart() {
  toggleModal('mobileCartModal');
}

// Función dedicada a generar el documento imprimible limpio (Evita la hoja en blanco)
// Función para eliminar emojis y símbolos especiales del texto impreso
function removeEmojis(string) {
  if (!string) return '';
  return string.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F6D0}-\u{1F6FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '').trim();
}

// Genera un documento 100% formal en texto plano sin emojis
// Función avanzada para eliminar CUALQUIER emoji o símbolo gráfico
function removeEmojis(string) {
  if (!string) return '';
  return string
    // Elimina todos los pictogramas y símbolos Unicode (incluye órganos, gotas, etc.)
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Component}\p{Symbol}]/gu, '')
    // Limpia espacios dobles que puedan quedar al quitar el emoji
    .replace(/\s+/g, ' ')
    .trim();
}

// Función para eliminar cualquier emoji o símbolo gráfico
function removeEmojis(string) {
  if (!string) return '';
  return string
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Component}\p{Symbol}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function imprimirResumen() {
  let printSection = document.getElementById('printSection');
  
  if (!printSection) {
    printSection = document.createElement('div');
    printSection.id = 'printSection';
    document.body.appendChild(printSection);
  }

  if (!selectedExams || selectedExams.length === 0) {
    alert("Por favor, selecciona al menos un examen antes de imprimir el resumen.");
    return;
  }

  let htmlContent = `
    <div style="padding: 24px; font-family: Arial, Helvetica, sans-serif; color: #111827; background-color: #ffffff;">
      <!-- Encabezado con la barra verde institucional -->
      <div style="border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 20px;">
        <h1 style="font-size: 18px; font-weight: bold; margin: 0; color: #047857; text-transform: uppercase;">
          Indicaciones de Preparación para Exámenes Médicos
        </h1>
        <p style="font-size: 11px; color: #4b5563; margin-top: 4px;">
          Documento informativo previo a la toma de muestras de laboratorio.
        </p>
      </div>
  `;

  selectedExams.forEach(exam => {
    // Se elimina cualquier emoji del título, tipo e indicaciones
    const nombreLimpio = removeEmojis(exam.nombre || 'Examen sin nombre');
    const tipoLimpio = removeEmojis(exam.tipo || 'No especificado');

    let pasosHTML = '';
    if (Array.isArray(exam.pasos_preparacion)) {
      pasosHTML = `<ol style="margin: 4px 0 0 18px; padding: 0; font-size: 12px; color: #1f2937;">${
        exam.pasos_preparacion.map(p => `<li style="margin-bottom: 3px;">${removeEmojis(p)}</li>`).join('')
      }</ol>`;
    } else {
      pasosHTML = `<p style="margin: 4px 0 0 0; font-size: 12px; color: #1f2937;">${removeEmojis(exam.pasos_preparacion || 'Sin indicaciones especiales.')}</p>`;
    }

    htmlContent += `
      <div style="border: 1px solid #a7f3d0; border-left: 4px solid #059669; border-radius: 6px; padding: 12px 16px; margin-bottom: 14px; background-color: #f0fdf4; page-break-inside: avoid;">
        <h3 style="font-size: 15px; font-weight: bold; color: #065f46; margin: 0 0 4px 0;">${nombreLimpio}</h3>
        <p style="font-size: 12px; color: #047857; margin: 0 0 8px 0;"><strong>Tipo de muestra:</strong> ${tipoLimpio}</p>
        
        <div>
          <strong style="font-size: 12px; color: #111827;">Indicaciones:</strong>
          ${pasosHTML}
        </div>
      </div>
    `;
  });

  htmlContent += `
      <!-- Pie de página corregido y formateado -->
      <div style="margin-top: 30px; border-top: 1px solid #d1d5db; padding-top: 12px; font-size: 11px; color: #047857; text-align: center; font-weight: 500;">
        Por favor, cumpla estrictamente con las indicaciones de ayuno e higiene antes de acudir al laboratorio.
      </div>
    </div>
  `;

  printSection.innerHTML = htmlContent;
  window.print();
}