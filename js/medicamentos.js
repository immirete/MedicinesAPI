async function isPediatricMedicine(medicine) {
    try {
        // Buscamos el documento de la ficha técnica
        const fichaTecnica = medicine.docs?.find(doc => doc.tipo === 1);
        if (!fichaTecnica) return false;

        // Hacemos una petición para obtener el contenido de la ficha técnica
        const response = await fetch(fichaTecnica.urlHtml);
        const text = await response.text();

        // Buscamos palabras clave relacionadas con uso pediátrico
        const keywords = ['población pediátrica', 'uso en niños', 'pediatría', 'infantil'];
        return keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
    } catch {
        return false;
    }
}

document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchTerm = document.getElementById('searchInput').value;
    const medicineType = document.getElementById('medicineType').value;

    // Mostrar spinner de carga
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<div class="text-center "><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
        // Añadir delay de 0.2 segundos
        await new Promise(resolve => setTimeout(resolve, 200));
                // Palabras clave para bebés
                const babyKeywords = [
                    'lactante', 'bebé', 'bebe', 'recién nacido', 'neonato',
                    'infantil 0', '0-6 meses', '6-12 meses', '0-12 meses',
                    'gotas', 'oral solution'
                ];

                // Formas farmacéuticas para bebés
                const babyForms = [
                    'gotas', 'jarabe', 'solución oral', 'suspensión oral',
                    'polvo para suspensión', 'solucion oral', 'suspension oral'
                ];
                
                // Palabras clave para niños actualizadas
                const childrenKeywords = [
                    'infantil', 'pediátrico', 'pediatrico', 'niños', 'junior',
                    'pediatría', 'pediatria', 'infantiles'
                ];

                // Formas farmacéuticas pediátricas
                const childrenForms = [
                    'jarabe', 'solución oral', 'suspensión oral',
                    'polvo para suspensión', 'solucion oral', 'suspension oral',
                    'comprimido masticable', 'comprimido dispersable'
                ];
    try {
        const response = await fetch(`https://cima.aemps.es/cima/rest/medicamentos?nombre=${searchTerm}`);
        const data = await response.json();
        let results = data.resultados || [];

        // Filtrar según el tipo seleccionado
        if (medicineType !== 'all') {
            results = results.filter(medicine => {
                const formaFarmaceutica = medicine.formaFarmaceutica?.nombre?.toLowerCase() || '';
                const searchText = `${medicine.nombre} ${medicine.dosis || ''}`.toLowerCase();



                if (medicineType === 'babies') {
                    return babyForms.some(form => formaFarmaceutica.includes(form)) ||
                           babyKeywords.some(keyword => searchText.includes(keyword));
                } else if (medicineType === 'children') {
                    return childrenForms.some(form => formaFarmaceutica.includes(form)) ||
                           childrenKeywords.some(keyword => searchText.includes(keyword));
                }
                return false;
            });
        }

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="alert alert-warning text-center">
                    No se encontraron medicamentos${medicineType === 'babies' ? ' para bebés' : medicineType === 'children' ? ' pediátricos' : ''} para "${searchTerm}".
                </div>
            `;
        } else {
            displayResults(results);
        }
    } catch (error) {
        console.error('Error:', error);
        resultsContainer.innerHTML = `
            <div class="alert alert-danger text-center">
                Error al buscar medicamentos. Por favor, intenta de nuevo.
            </div>
        `;
    }
});

function displayResults(medicines) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    medicines.forEach(medicine => {
        const card = createMedicineCard(medicine);
        resultsContainer.appendChild(card);
    });
}

function createMedicineCard(medicine) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-sm-6';

    const imageUrl = medicine.fotos?.find(foto => foto.tipo === "materialas")?.url || 'images/default-medicine.png';

    col.innerHTML = `
        <div class="medicine-card">
            <div class="card-img-container">
                <img src="${imageUrl}" alt="${medicine.nombre}">
            </div>
            <div class="card-body">
                <h5 class="card-title">${medicine.nombre}</h5>
                <p class="card-text">
                    ${medicine.labtitular}<br>
                    ${medicine.dosis}
                </p>
            </div>
        </div>
    `;

    // Agregamos el event listener directamente al elemento
    col.querySelector('.medicine-card').addEventListener('click', () => {
        showMedicineDetails(medicine);
    });

    return col;
}

function showMedicineDetails(medicine) {
    const modalBody = document.getElementById('medicineModalBody');
    const imageUrl = medicine.fotos?.find(foto => foto.tipo === "materialas")?.url || 'images/default-medicine.png';

    // Verificamos si es un medicamento pediátrico
    const keywords = ['suspension','infantil', 'pediátrico', 'niños', 'bebé', 'pediatric', 'junior', 'suspensión', 'jarabe'];
    const searchText = `${medicine.nombre} ${medicine.dosis}`.toLowerCase();
    const formaFarmaceutica = medicine.formaFarmaceutica.nombre.toLowerCase();
    
    const isPediatricForm = [
        'jarabe',
        'suspensión oral',
        'solución oral',
        'gotas orales',
        'granulado',
        'polvo para suspensión oral',
        'comprimido masticable',
        'comprimido dispersable'
    ].some(forma => formaFarmaceutica.includes(forma.toLowerCase()));

    const isPediatric = keywords.some(keyword => searchText.includes(keyword.toLowerCase())) || isPediatricForm;

    modalBody.innerHTML = `
        <img src="${imageUrl}" alt="${medicine.nombre}" class="medicine-image">
        <div class="medicine-details">
            <div class="detail-item">
                <span class="detail-label">Nombre:</span>
                <span>${medicine.nombre}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Laboratorio:</span>
                <span>${medicine.labtitular}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Dosis:</span>
                <span>${medicine.dosis}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Receta:</span>
                <span>${medicine.receta ? 'Sí' : 'No'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Vía de administración:</span>
                <span>${medicine.viasAdministracion.map(via => via.nombre).join(', ')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Forma farmacéutica:</span>
                <span>${medicine.formaFarmaceutica.nombre}</span>
            </div>
            ${isPediatric ? `
            <div class="detail-item">
                <span class="detail-label">Uso pediátrico:</span>
                <span>Sí</span>
            </div>
            ` : ''}
        </div>
        ${medicine.docs ? `
            <div class="mt-3">
                <h6 class="detail-label">Documentos:</h6>
                <ul>
                    ${medicine.docs.map(doc => `
                        <li><a href="${doc.url}" target="_blank">
                            ${doc.tipo === 1 ? 'Ficha Técnica' : 'Prospecto'}
                        </a></li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}
    `;

    const modal = new bootstrap.Modal(document.getElementById('medicineModal'));
    modal.show();
}
document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.querySelector('#searchForm button');
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    const pediatricCheckbox = document.getElementById('pediatricOnly');
    const babyCheckbox = document.getElementById('babyOnly');
    // Obtener referencias a los elementos
    const medicineTypeSelect = document.getElementById('medicineType');
    const navLinks = document.querySelectorAll('.nav-link');
    const searchSection = document.getElementById('search');
    const heroBanner = document.getElementById('hero-banner');

    // Objeto con las imágenes para cada categoría
    const bannerImages = {
        'babies': 'images/baby.jpg',
        'children': 'images/niños.jpg',
        'all': 'images/doctor2.jpg'
    };

    // Función para cambiar la imagen del banner
    function changeBannerImage(type) {
        heroBanner.style.transition = 'background-image 0.5s ease-in-out';
        heroBanner.style.backgroundImage = `url(${bannerImages[type]})`;
    }

    // Manejar cambios en el selector
    medicineTypeSelect.addEventListener('change', function() {
        changeBannerImage(this.value);
    });

    // Manejar clics en los enlaces del navbar
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            switch(href) {
                case '#bebes':
                    medicineTypeSelect.value = 'babies';
                    changeBannerImage('babies');
                    break;
                case '#niños':
                    medicineTypeSelect.value = 'children';
                    changeBannerImage('children');
                    break;
                case '#todos':
                    medicineTypeSelect.value = 'all';
                    changeBannerImage('all');
                    break;
            }

            if (href === '#search') return;
            
            e.preventDefault();
            searchSection.scrollIntoView({ behavior: 'smooth' });
        });
    });

    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover active de todos los items
            dropdownItems.forEach(i => i.classList.remove('active'));
            // Agregar active al seleccionado
            this.classList.add('active');

            const searchType = this.dataset.searchType;
            
            // Resetear checkboxes
            pediatricCheckbox.checked = false;
            babyCheckbox.checked = false;

            // Configurar checkboxes y botón según la selección
            switch(searchType) {
                case 'babies':
                    babyCheckbox.checked = true;
                    searchButton.className = 'btn btn-search-babies';
                    break;
                case 'children':
                    pediatricCheckbox.checked = true;
                    searchButton.className = 'btn btn-search-children';
                    break;
                case 'all':
                    searchButton.className = 'btn btn-search-all';
                    break;
            }
        });
    });
});
