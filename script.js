let examenes = [];

// Carga el archivo JSON de forma segura
async function cargarExamenes() {
  try {
    const respuesta = await fetch('examenes.json');
    if (!respuesta.ok) throw new Error('No se pudo encontrar examenes.json');
    examenes = await respuesta.json();
  } catch (error) {
    console.error('Error al cargar la lista de exámenes:', error);
  }
}

// Ejecutar la carga al iniciar
cargarExamenes();

function renderExams(data) {
  const container = document.getElementById('examList');
  container.innerHTML = '';

  if (data.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
        <p class="text-base">No encontramos ese examen. Intenta escribir otra palabra.</p>
      </div>`;
    return;
  }

  data.forEach(exam => {
    const card = document.createElement('div');
    card.className = "bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-6";
    
    const badgesHtml = exam.requisitos_rapidos
      .map(req => `<span class="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">${req}</span>`)
      .join(' ');

    const pasosHtml = exam.pasos_preparacion
      .map((paso, index) => `
        <li class="flex items-start gap-3 text-gray-700 text-sm mb-2">
          <span class="flex-shrink-0 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">${index + 1}</span>
          <span>${paso}</span>
        </li>
      `).join('');

    card.innerHTML = `
      <span class="bg-gray-200 text-gray-700 text-xs font-mono px-2 py-1 rounded">
        Código: ${exam.codigo}
      </span>
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3 border-b pb-3 mt-2">
        <h2 class="text-2xl font-bold text-gray-800">${exam.nombre}</h2>
        <span class="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">${exam.tipo}</span>
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        ${badgesHtml}
      </div>

      <div class="mb-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
        <h3 class="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Paso a paso para tu preparación:</h3>
        <ul>
          ${pasosHtml}
        </ul>
      </div>

      <div class="text-xs text-gray-600 bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-md">
        <strong>💡 ¿Para qué sirve este examen?</strong> ${exam.importancia}
      </div>
    `;

    container.appendChild(card);
  });
}

function filterExams() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  
  if (query === "") {
    document.getElementById('examList').innerHTML = "";
    return;
  }

  const filtered = examenes.filter(item => 
    item.nombre.toLowerCase().includes(query) ||
    item.tipo.toLowerCase().includes(query) ||
    item.codigo.toLowerCase().includes(query) // Añadida búsqueda por código
  );
  
  renderExams(filtered);
}

// Función independiente para el botón "Ver todos"
function showAllExams() {
  document.getElementById('searchInput').value = "";
  renderExams(examenes);
}