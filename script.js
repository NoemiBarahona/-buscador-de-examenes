// 1. VARIABLES GLOBALES Y CONFIGURACIÓN INICIAL

let allExams = [];
let selectedExams = JSON.parse(localStorage.getItem('selectedExams')) || [];
let showingAll = false;

// Diccionario interno de sinónimos por código de examen
const diccionarioSinonimos = {
  "GUIA-SANGRE": ["sangre", "ayuno", "glicemia", "hemograma", "perfil", "lipidico", "venosa", "puncion"],
  "GUIA-ORINA": ["orina", "pipi", "pis","urocultivo", "orina completa", "segundo chorro", "pish", "pichi", "muestra orina", "fisiologico"],
  "GUIA-FECA": ["caca", "feca", "fecas", "deposicion", "deposiciones", "coprocultivo", "parasitologico", "caquis", "muestra fecal", "digestion"]
};

// Cargar el JSON al iniciar la página y conectar el buscador automáticamente
document.addEventListener('DOMContentLoaded', () => {
  fetch('examenes.json')
    .then(response => response.json())
    .then(data => {
      allExams = data;
      updateSelectedUI();
    })
    .catch(error => console.error('Error al cargar el JSON:', error));

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', filterExams);
  }
});

// 2. FUNCIONES DE UTILIDAD (Limpieza y Formato)

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

function removeEmojis(string) {
  if (!string) return '';
  return string
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Component}\p{Symbol}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}


// 3. SISTEMA DE RESPALDO INTELIGENTE DE IMÁGENES

async function obtenerRutaConRespaldo(exam) {
  const codigoUpper = String(exam.codigo || '').toUpperCase();
  const tipoLower = (exam.tipo || '').toLowerCase();
  const nombreLower = (exam.nombre || '').toLowerCase();

  // 0. EXCEPCIONES ESPECÍFICAS (Búsqueda prioritaria por código o nombre)
  if (codigoUpper === '0309008' || codigoUpper === '309008' || nombreLower.includes('calciuria')) {
    return './img/0309008.png'; // O la extensión correspondiente (.jpeg / .jpg)
  }
  if (codigoUpper === '0309010' || codigoUpper === '309010' || nombreLower.includes('creatininuria')) {
    return './img/0309010.png';
  }
  if (codigoUpper === '0302024' || codigoUpper === '302024' || nombreLower.includes('clearance')) {
    return './img/0302024.png';
  }

  // 1. Verificar si corresponde a una imagen general de categoría
  if (codigoUpper.includes('ORINA') || tipoLower.includes('orina') || nombreLower.includes('orina') || nombreLower.includes('urocultivo')) {
    return './img/Imagen_orina.jpeg';
  } 
  if (codigoUpper.includes('FECA') || codigoUpper.includes('DEPOSICION') || tipoLower.includes('deposicion') || nombreLower.includes('deposicion') || nombreLower.includes('coprocultivo') || nombreLower.includes('sangre oculta')) {
    return './img/Imagen_deposicion.jpeg';
  } 
  if (codigoUpper.includes('SANGRE') || tipoLower.includes('sangre') || tipoLower.includes('suero') || nombreLower.includes('perfil') || nombreLower.includes('hemograma')) {
    return './img/Imagen_sangre.jpeg';
  }

  // 2. Si es un examen con imagen personalizada propia, la buscamos
  const rutasAProbar = [
    `./img/${exam.codigo}.png`, 
    `./img/${exam.codigo}.jpeg`, 
    `./img/${exam.codigo}.jpg`
  ];

  for (const ruta of rutasAProbar) {
    try {
      const response = await fetch(ruta, { method: 'HEAD' });
      if (response.ok) {
        return ruta;
      }
    } catch (e) {
      // Continuar si falla
    }
  }

  // 3. Respaldo final por defecto
  return './img/Imagen_sangre.jpeg';
}

// Versión síncrona optimizada para tarjetas
function obtenerRutaImagenParaExamen(exam) {
  const codigoUpper = String(exam.codigo || '').toUpperCase();
  const tipoLower = (exam.tipo || '').toLowerCase();
  const nombreLower = (exam.nombre || '').toLowerCase();

  // 0. EXCEPCIONES ESPECÍFICAS (Evalúa primero si el examen tiene imagen dedicada)
  if (codigoUpper === '0309008' || codigoUpper === '309008' || nombreLower.includes('calciuria')) {
    return 'img/0309008.png'; // Cambia la extensión si tu archivo es .jpg o .jpeg
  }
  if (codigoUpper === '0309010' || codigoUpper === '309010' || nombreLower.includes('creatininuria')) {
    return 'img/0309010.png';
  }
  if (codigoUpper === '0302024' || codigoUpper === '302024' || nombreLower.includes('clearance')) {
    return 'img/0302024.png';
  }

  // Reglas generales por categoría
  if (codigoUpper.includes('ORINA') || tipoLower.includes('orina') || nombreLower.includes('orina') || nombreLower.includes('urocultivo')) {
    return 'img/Imagen_orina.jpeg';
  } else if (codigoUpper.includes('FECA') || codigoUpper.includes('DEPOSICION') || tipoLower.includes('deposicion') || nombreLower.includes('deposicion') || nombreLower.includes('coprocultivo') || nombreLower.includes('sangre oculta')) {
    return 'img/Imagen_deposicion.jpeg';
  } else if (codigoUpper.includes('SANGRE') || tipoLower.includes('sangre') || tipoLower.includes('suero') || nombreLower.includes('perfil') || nombreLower.includes('hemograma')) {
    return 'img/Imagen_sangre.jpeg';
  }

  return `img/${exam.codigo}.png`;
}

// 4. RENDERIZADO DE INTERFAZ (Tarjetas de Exámenes)

function renderExams(exams) {
  const container = document.getElementById('examsContainer');
  if (!container) return;
  
  container.innerHTML = '';

  if (!exams || exams.length === 0) {
    container.innerHTML = `<p class="text-sm text-gray-500 text-center col-span-full py-8">No se encontraron exámenes.</p>`;
    return;
  }

  exams.forEach(exam => {
    const isSelected = selectedExams.some(e => e.codigo === exam.codigo);
    const rutaImagenFinal = obtenerRutaImagenParaExamen(exam);

    const requisitosHTML = Array.isArray(exam.requisitos_rapidos) 
      ? exam.requisitos_rapidos.map(r => `<span class="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-md font-medium mr-1 mb-1">${r}</span>`).join('')
      : '';

    const card = document.createElement('div');
    card.className = "bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-200 transition-all hover:shadow-md flex flex-col justify-between";
    card.innerHTML = `
      <div>
        <div class="pb-3 border-b border-gray-100">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
              Código: ${exam.codigo}
            </span>
            <button 
              type="button"
              onclick="abrirModalImagenPorExamen('${exam.codigo}')"
              class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
            >
              🖼️ Ver Guía
            </button>
          </div>
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
        </div>
      </div>

      <div class="pt-4 mt-4 sm:flex sm:justify-end border-t border-gray-100">
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
    `;
    container.appendChild(card);
  });
}

// 5. SISTEMA DE FILTRADO Y BÚSQUEDA AVANZADO

function filterExams() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  const queryRaw = searchInput.value.trim();
  const query = cleanText(queryRaw);
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
  if (btn) {
    const eyeIcon = `<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
    btn.innerHTML = `${eyeIcon} Ver todos`;
    btn.className = "bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-44 shrink-0";
  }

  const palabrasBusqueda = query.split(/\s+/);

  const filtered = allExams.filter(exam => {
    const nombre = cleanText(exam.nombre || '');
    const codigo = cleanText(exam.codigo || '');
    const tipo = cleanText(exam.tipo || '');
    const sinonimosLista = diccionarioSinonimos[exam.codigo] || [];
    
    const textoCompletoExamen = `${nombre} ${codigo} ${tipo} ${sinonimosLista.join(' ')}`;
    const coincidePalabras = palabrasBusqueda.every(palabra => textoCompletoExamen.includes(palabra));

    return coincidePalabras;
  });

  renderExams(filtered);
}

// 6. GESTIÓN DE EXÁMENES SELECCIONADOS

function toggleShowAll() {
  const btn = document.getElementById('showAllBtn');
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  const eyeIcon = `<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
  const eyeOffIcon = `<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 013.122-.063c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-2.155 3.592m-2.228 2.228a9.98 9.98 0 01-2.589 1.17M3 3l18 18"/></svg>`;

  if (showingAll) {
    showingAll = false;
    if (btn) {
      btn.innerHTML = `${eyeIcon} Ver todos`;
      btn.className = "bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-44 shrink-0";
    }
    renderExams([]); 
  } else {
    showingAll = true;
    if (btn) {
      btn.innerHTML = `${eyeOffIcon} Ocultar lista`;
      btn.className = "bg-slate-600 hover:bg-slate-700 text-white font-medium px-5 py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-44 shrink-0";
    }
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
  
  const searchInput = document.getElementById('searchInput');
  const currentQuery = searchInput ? cleanText(searchInput.value.trim()) : '';
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
  const searchInput = document.getElementById('searchInput');
  const currentQuery = searchInput ? cleanText(searchInput.value.trim()) : '';
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

  const itemsHTML = selectedExams.map(exam => {
    const rutaImg = obtenerRutaImagenParaExamen(exam);

    return `
      <div class="bg-white p-3 rounded-xl border border-gray-200 text-xs space-y-2 relative group shadow-sm">
        
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-gray-800 text-sm truncate pr-2">${exam.nombre}</h4>
          <button 
            type="button"
            onclick="toggleSelectExam('${exam.codigo}')" 
            class="text-red-500 hover:text-red-700 font-bold text-lg leading-none px-1"
            title="Eliminar"
          >
            &times;
          </button>
        </div>

        <div class="relative rounded-lg overflow-hidden border border-emerald-100 bg-emerald-50/50 group/img">
          <img src="${rutaImg}" alt="${exam.nombre}" class="w-full h-28 object-cover object-top transition-transform duration-300 group-hover/img:scale-105">
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              type="button"
              onclick="abrirModalImagenPorExamen('${exam.codigo}')"
              class="bg-white text-emerald-800 font-semibold px-3 py-1.5 rounded-lg text-xs shadow hover:bg-emerald-50 transition-colors"
            >
              🔍 Ampliar Guía
            </button>
          </div>
        </div>

        <div>
          <details class="group/details">
            <summary class="cursor-pointer text-emerald-700 font-semibold text-xs py-1 flex items-center gap-1 select-none hover:text-emerald-800">
              <span class="group-open/details:rotate-90 transition-transform">▶</span> Ver más detalles y preparación
            </summary>
            
            <div class="mt-2 pt-2 border-t border-gray-100 space-y-2 text-gray-600 text-xs">
              <p><strong class="text-gray-700">Muestra:</strong> ${exam.tipo || 'No especificado'}</p>
              <div class="text-amber-900 bg-amber-50 p-2 rounded border border-amber-200">
                <span class="font-bold block mb-1">Preparación:</span>
                ${formatPasos(exam.pasos_preparacion)}
              </div>
            </div>
          </details>
        </div>

      </div>
    `;
  }).join('');

  if (desktopContainer) desktopContainer.innerHTML = itemsHTML;
  if (mobileContainer) mobileContainer.innerHTML = itemsHTML;
}

// Función para abrir y cerrar los modales generales (Sangre, Orina, Feca)
function toggleModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.toggle('hidden');
  }
}

// Función para el botón del carrito en dispositivos móviles
function toggleMobileCart() {
  const modal = document.getElementById('mobileCartModal');
  if (modal) {
    modal.classList.toggle('hidden');
  }
}


// 7. GESTIÓN DE MODALES DE IMÁGENES

function abrirModalImagenPorExamen(codigoExamen) {
  const exam = allExams.find(e => e.codigo === codigoExamen);
  if (!exam) {
    console.error("No se encontró el examen con código:", codigoExamen);
    return;
  }

  const rutaFinal = obtenerRutaImagenParaExamen(exam);
  const titulo = exam.nombre || 'Guía de Examen';
  
  abrirModalImagen(rutaFinal, titulo, exam);
}

function abrirModalImagen(urlImagen, titulo, examData = null) {
  const modal = document.getElementById('modalImagenAmpliada');
  const imgElement = document.getElementById('imagenAmpliadaSrc');
  const titleElement = document.getElementById('tituloModalImagen');
  const downloadBtn = document.getElementById('btnDescargarModal');
  const contenedorFondo = modal ? modal.querySelector('.max-w-4xl') : null;
  const headerFondo = document.getElementById('modalHeaderFondo');

  if (!modal || !imgElement || !titleElement) {
    console.error("Faltan elementos del DOM para el modal de imágenes.");
    return;
  }

  imgElement.src = urlImagen;
  titleElement.textContent = titulo;
  if (downloadBtn) downloadBtn.href = urlImagen;
  
  const urlLower = (urlImagen || '').toLowerCase();
  const tituloLower = (titulo || '').toLowerCase();
  const muestraLower = (examData?.tipo_muestra || examData?.muestra || examData?.tipo || '').toLowerCase();

  if (headerFondo && contenedorFondo) {
    if (
      tituloLower.includes('sangre oculta') || 
      tituloLower.includes('weber') || 
      tituloLower.includes('hemorragias ocultas') ||
      urlLower.includes('sangre_oculta') || 
      urlLower.includes('weber')
    ) {
      contenedorFondo.className = "max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] bg-amber-50/90 text-gray-900 border border-amber-300 transition-colors duration-300";
      headerFondo.className = "bg-amber-200 text-amber-950 border-b border-amber-300 p-4 flex justify-between items-center transition-colors duration-300";
    }
    else if (
      muestraLower.includes('deposici') || muestraLower.includes('heces') || muestraLower.includes('copro') ||
      urlLower.includes('deposicion') || urlLower.includes('heces') || urlLower.includes('feca') ||
      tituloLower.includes('deposicion') || tituloLower.includes('heces')
    ) {
      contenedorFondo.className = "max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] bg-amber-50/90 text-gray-900 border border-amber-300 transition-colors duration-300";
      headerFondo.className = "bg-amber-200 text-amber-950 border-b border-amber-300 p-4 flex justify-between items-center transition-colors duration-300";
    }
    else if (
      muestraLower.includes('sangre') || muestraLower.includes('plasma') || muestraLower.includes('suero') ||
      urlLower.includes('sangre') || tituloLower.includes('sangre')
    ) {
      contenedorFondo.className = "max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] bg-red-50/90 text-gray-900 border border-red-200 transition-colors duration-300";
      headerFondo.className = "bg-red-100 text-red-900 border-b border-red-200 p-4 flex justify-between items-center transition-colors duration-300";
    }
    else if (
      muestraLower.includes('orina') ||
      urlLower.includes('orina') || tituloLower.includes('orina')
    ) {
      contenedorFondo.className = "max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] bg-yellow-50/90 text-gray-900 border border-yellow-200 transition-colors duration-300";
      headerFondo.className = "bg-yellow-100 text-yellow-900 border-b border-yellow-200 p-4 flex justify-between items-center transition-colors duration-300";
    }
    else if (
      muestraLower.includes('nasal') || muestraLower.includes('faringe') || muestraLower.includes('hisopado') ||
      urlLower.includes('nasal') || urlLower.includes('faringe') ||
      tituloLower.includes('nasal') || tituloLower.includes('faringe')
    ) {
      contenedorFondo.className = "max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] bg-purple-50/90 text-gray-900 border border-purple-200 transition-colors duration-300";
      headerFondo.className = "bg-purple-100 text-purple-900 border-b border-purple-200 p-4 flex justify-between items-center transition-colors duration-300";
    }
    else if (
      muestraLower.includes('secreci') || muestraLower.includes('fluido') ||
      urlLower.includes('secrecion') || tituloLower.includes('secrecion')
    ) {
      contenedorFondo.className = "max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] bg-blue-50/90 text-gray-900 border border-blue-200 transition-colors duration-300";
      headerFondo.className = "bg-blue-100 text-blue-900 border-b border-blue-200 p-4 flex justify-between items-center transition-colors duration-300";
    }
    else if (
      muestraLower.includes('hongo') || muestraLower.includes('herida') || muestraLower.includes('micolog') || muestraLower.includes('piel') ||
      urlLower.includes('hongo') || urlLower.includes('herida') ||
      tituloLower.includes('hongo') || tituloLower.includes('herida')
    ) {
      contenedorFondo.className = "max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] bg-emerald-50/90 text-gray-900 border border-emerald-200 transition-colors duration-300";
      headerFondo.className = "bg-emerald-100 text-emerald-900 border-b border-emerald-200 p-4 flex justify-between items-center transition-colors duration-300";
    }
    else {
      contenedorFondo.className = "max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] bg-slate-50/90 text-gray-900 border border-slate-200 transition-colors duration-300";
      headerFondo.className = "bg-slate-100 text-slate-800 border-b border-slate-200 p-4 flex justify-between items-center transition-colors duration-300";
    }
  }

  if (typeof resetZoom === 'function') resetZoom();
  modal.classList.remove('hidden');
}

function cerrarModalImagen() {
  const modal = document.getElementById('modalImagenAmpliada');
  if (modal) {
    modal.classList.add('hidden');
  }
}

window.toggleModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.toggle('hidden');
  } else {
    console.error(`No se encontró el modal general con ID: ${modalId}`);
  }
};

window.abrirModalImagen = abrirModalImagen;
window.abrirModalImagenPorExamen = abrirModalImagenPorExamen;
window.cerrarModalImagen = cerrarModalImagen;



// 8. IMPRESIÓN Y EXPORTACIÓN DE RESUMENES
function generarPDFResumen() {
  imprimirResumen();
}

function imprimirResumen() {
  if (!selectedExams || selectedExams.length === 0) {
    alert("Por favor, selecciona al menos un examen antes de imprimir o guardar el resumen.");
    return;
  }

  let htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Resumen de Exámenes Médicos</title>
      <style>
        body { font-family: Arial, sans-serif; color: #111827; padding: 24px; margin: 0; }
        .header { border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { font-size: 18px; font-weight: bold; margin: 0; color: #047857; text-transform: uppercase; }
        .header p { font-size: 11px; color: #4b5563; margin-top: 4px; }
        .exam-card { border: 1px solid #a7f3d0; border-left: 4px solid #059669; border-radius: 6px; padding: 12px 16px; margin-bottom: 14px; background-color: #f0fdf4; page-break-inside: avoid; }
        .exam-card h3 { font-size: 15px; font-weight: bold; color: #065f46; margin: 0 0 4px 0; }
        .exam-card p { font-size: 12px; color: #047857; margin: 0 0 8px 0; }
        .footer { margin-top: 30px; border-top: 1px solid #d1d5db; padding-top: 12px; font-size: 11px; color: #047857; text-align: center; font-weight: 500; }
        ol { margin: 4px 0 0 18px; padding: 0; font-size: 12px; color: #1f2937; }
        li { margin-bottom: 3px; }
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
        Por favor, cumpla strictly con las indicaciones de ayuno e higiene antes de acudir al laboratorio.
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

function generarPDFImágenes() {
  if (!selectedExams || selectedExams.length === 0) {
    alert("Por favor, selecciona al menos un examen antes de imprimir las guías visuales.");
    return;
  }

  const rutasUnicas = [...new Set(selectedExams.map(exam => obtenerRutaImagenParaExamen(exam)))];

  let htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Guías Visuales de Exámenes Médicos</title>
      <style>
        body { font-family: Arial, sans-serif; color: #111827; padding: 20px; margin: 0; background: #fff; }
        .header { border-bottom: 2px solid #0369a1; padding-bottom: 8px; margin-bottom: 20px; }
        .header h1 { font-size: 16px; font-weight: bold; margin: 0; color: #0369a1; text-transform: uppercase; }
        .header p { font-size: 11px; color: #4b5563; margin-top: 2px; }
        .page-block { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 15px; page-break-after: always; min-height: 90vh; }
        .page-block:last-child { page-break-after: avoid; }
        .image-card { width: 100%; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; background: #fff; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; page-break-inside: avoid; }
        img { width: 100%; max-height: 26vh; object-fit: contain; }
      </style>
    </head>
    <body>
  `;

  for (let i = 0; i < rutasUnicas.length; i += 3) {
    const grupoImagenes = rutasUnicas.slice(i, i + 3);

    htmlContent += `
      <div class="page-block">
        <div class="header">
          <h1>Guías Visuales de Preparación</h1>
          <p>Infografías de referencia para la toma de muestras (Página ${Math.floor(i / 3) + 1})</p>
        </div>
    `;

    grupoImagenes.forEach(ruta => {
      htmlContent += `
        <div class="image-card">
          <img src="${ruta}" alt="Guía visual de preparación">
        </div>
      `;
    });

    htmlContent += `</div>`;
  }

  htmlContent += `</body></html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
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

function compartirListaWhatsApp() {
  if (!selectedExams || selectedExams.length === 0) {
    alert("Por favor, selecciona al menos un examen para compartir.");
    return;
  }

  let mensaje = "📋 *Mis Exámenes Médicos - Indicaciones* 📋\n\n";

  selectedExams.forEach((exam, index) => {
    const nombreLimpio = removeEmojis(exam.nombre || 'Examen');
    mensaje += `${index + 1}. *${nombreLimpio}*\n`;
    mensaje += `   • Muestra: ${removeEmojis(exam.tipo || 'No especificado')}\n`;
    
    if (Array.isArray(exam.pasos_preparacion)) {
      mensaje += `   • Preparación:\n`;
      exam.pasos_preparacion.forEach(paso => {
        mensaje += `     - ${removeEmojis(paso)}\n`;
      });
    }
    mensaje += `\n`;
  });

  mensaje += "_Generado desde mi asistente de laboratorios._";

  if (navigator.share) {
    navigator.share({
      title: 'Mis Exámenes Médicos',
      text: mensaje,
    }).catch((error) => console.log('Error al compartir:', error));
  } else {
    const urlWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');
  }
}

async function compartirListaComoImagen() {
  if (!selectedExams || selectedExams.length === 0) {
    alert("Por favor, selecciona al menos un examen para compartir sus imágenes.");
    return;
  }

  const TOPE_MAXIMO = 10;
  let examenesAProcesar = selectedExams;

  if (selectedExams.length > TOPE_MAXIMO) {
    alert(`Has seleccionado ${selectedExams.length} exámenes. Por motivos de límite, se compartirán solo los primeros ${TOPE_MAXIMO}.`);
    examenesAProcesar = selectedExams.slice(0, TOPE_MAXIMO);
  }

  try {
    const archivosParaCompartir = [];
    const codigosFaltantes = [];

    for (const examen of examenesAProcesar) {
      const rutaImagen = obtenerRutaImagenParaExamen(examen);
      const response = await fetch(rutaImagen);

      if (response.ok) {
        const blob = await response.blob();
        const extension = response.headers.get('content-type')?.includes('jpeg') ? 'jpeg' : 'png';
        const nombreArchivo = `${examen.codigo}.${extension}`;
        
        archivosParaCompartir.push(new File([blob], nombreArchivo, { type: blob.type }));
      } else {
        codigosFaltantes.push(examen.codigo);
      }
    }

    if (archivosParaCompartir.length === 0) {
      alert("No se pudieron preparar las imágenes asociadas.");
      return;
    }

    const nombresExamenes = examenesAProcesar.map(e => e.nombre).join(', ');
    const textoMensaje = `Hola, te comparto las guías para: ${nombresExamenes}`;

    if (navigator.canShare && navigator.canShare({ files: archivosParaCompartir })) {
      await navigator.share({
        title: 'Guías de Exámenes',
        text: textoMensaje,
        files: archivosParaCompartir
      });
    } else {
      alert("Tu dispositivo o navegador no soporta el envío directo de múltiples imágenes. Te sugerimos descargar los PDFs o usar el botón de 'Imprimir Guías'.");
    }
  } catch (error) {
    console.error("Error al compartir imágenes:", error);
  }
}