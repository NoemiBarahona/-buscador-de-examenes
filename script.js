let examenes = [];

// Carga automáticamente el archivo examenes.json al abrir la página
fetch('examenes.json')
  .then(response => response.json())
  .then(data => {
    examenes = data;
  })
  .catch(error => console.error('Error al cargar los exámenes:', error));

function renderExams(data) {
  const container = document.getElementById('examList');
  container.innerHTML = '';

  if (data.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
        <p class="text-base">No se encontraron exámenes con ese nombre.</p>
      </div>`;
    return;
  }

  data.forEach(exam => {
    const card = document.createElement('div');
    card.className = "exam-card p-6 rounded-lg shadow-sm border border-gray-200";
    card.innerHTML = `
      <h2 class="text-2xl font-bold text-gray-800 mb-4">${exam.nombre}</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <p class="font-semibold text-blue-900 mb-1">📋 Preparación:</p>
          <p class="bg-gray-50 p-2 rounded border border-gray-100">${exam.preparacion}</p>
        </div>
        <div>
          <p class="font-semibold text-blue-900 mb-1">🧪 Tipo de Muestra:</p>
          <p class="bg-gray-50 p-2 rounded border border-gray-100">${exam.muestra}</p>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p class="font-semibold text-gray-600">⏱️ Plazo de Entrega:</p>
          <p class="text-gray-800">${exam.plazo}</p>
        </div>
        <div class="md:col-span-2">
          <p class="font-semibold text-gray-600">💡 Información Clínica:</p>
          <p class="text-gray-800">${exam.info}</p>
        </div>
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
    item.nombre.toLowerCase().includes(query)
  );
  
  renderExams(filtered);
}