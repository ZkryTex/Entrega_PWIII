document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:7050/api';

    function getAuthHeader() {
    const token = localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

    function initializeSession() {
        const token = localStorage.getItem('accessToken');
        const sessionActive = sessionStorage.getItem('loggedIn') === 'true';

        // Si hay token guardado pero no hay sesión activa en esta pestaña,
        // eliminamos el token para iniciar deslogueado.
        if (token && !sessionActive) {
            localStorage.removeItem('accessToken');
        }
    }

    function updateAuthButtons() {
        const loginBtn = document.getElementById('btn-login-trigger');
        const logoutBtn = document.getElementById('btn-logout');
        const sessionActive = sessionStorage.getItem('loggedIn') === 'true';
        const token = localStorage.getItem('accessToken');
        let isAdmin = false;

        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                isAdmin = payload.role === 'rol_admin';
            } catch (error) {
                isAdmin = false;
            }
        }

        if (loginBtn && logoutBtn) {
            if (sessionActive && token && isAdmin) {
                loginBtn.classList.add('d-none');
                logoutBtn.classList.remove('d-none');
            } else {
                loginBtn.classList.remove('d-none');
                logoutBtn.classList.add('d-none');
            }
        }
    }

    function setupLogout() {
        const logoutBtn = document.getElementById('btn-logout');
        if (!logoutBtn) return;

        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('accessToken');
            sessionStorage.removeItem('loggedIn');
            updateAuthButtons();
            if (window.location.pathname === '/gestion') {
                window.location.href = '/';
            } else {
                window.location.reload();
            }
        });
    }

    initializeSession();
    setupLogout();
    updateAuthButtons();

    // --- Funciones Comunes para la Página Principal y Gestión ---
    async function fetchData(url) {
        try {
            const response = await fetch(url, {
                headers: getAuthHeader()
            });
            if (!response.ok) {
                const errorText = await response.text();
                displayMessage(`Error HTTP! estado: ${response.status} - ${errorText}`, 'danger');
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            displayMessage(`Error al cargar datos: ${error.message}`, 'danger');
            return null;
        }
    }

    // Función para decodificar el JWT manualmente
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) {
        return null;
    }
}

// Lógica para mostrar u ocultar la gestión
function checkPermissions() {
    const token = localStorage.getItem('accessToken');
    const gestionSection = document.getElementById('seccion-gestion'); // Asegurate que tu HTML tenga este ID
    
    if (token) {
        const userData = parseJwt(token);
        
        if (userData && userData.role === 'rol_admin') {
            gestionSection.style.display = 'block'; // Mostrar si es admin
        } else {
            gestionSection.style.display = 'none';  // Ocultar si es usuario común
        }
    } else {
        gestionSection.style.display = 'none'; // Ocultar si no hay login
    }
}


    async function postData(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader() // <--- AGREGÁ ESTA LÍNEA
            },
            body: JSON.stringify(data)
        });
            if (!response.ok) {
                const errorText = await response.text();
                displayMessage(`Error HTTP! estado: ${response.status} - ${errorText}`, 'danger');
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error posting data:', error);
            displayMessage(`Error al enviar datos: ${error.message}`, 'danger');
            return null;
        }
    }

    async function putData(url, data) {
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader() // Importante: Agrega el encabezado de autorización para PUT
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorText = await response.text();
                displayMessage(`Error HTTP! estado: ${response.status} - ${errorText}`, 'danger');
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating data:', error);
            displayMessage(`Error al actualizar datos: ${error.message}`, 'danger');
            return null;
        }
    }

    async function deleteData(url) {
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    ...getAuthHeader() //  ¡Ahora sí está dentro de la propiedad headers!
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                displayMessage(`Error HTTP! estado: ${response.status} - ${errorText}`, 'danger');
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error deleting data:', error);
            displayMessage(`Error al eliminar datos: ${error.message}`, 'danger');
            return null;
        }
    }

    function displayMessage(message, type = 'info', duration = 3000) {
        let messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            const div = document.createElement('div');
            div.id = 'message-container';
            div.style = 'position: fixed; top: 20px; right: 20px; z-index: 1050;';
            document.body.appendChild(div);
            messageContainer = document.getElementById('message-container');
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        messageContainer.appendChild(alertDiv);

        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }, duration);
    }


    // --- Lógica para index.html (Página Principal) ---
    if (document.getElementById('celulares-list')) {
        const celularesListDiv = document.getElementById('celulares-list');
        const brandFilterOptions = document.getElementById('brand-filter-options');
        let allCelulares = []; // Para guardar todos los celulares y poder filtrarlos localmente

        async function loadCelulares(filterBrand = 'all') { // Cambiado a 'all' por defecto para cargar todo y luego filtrar
            celularesListDiv.innerHTML = '<div class="text-center col-12"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
            const data = await fetchData(`${API_BASE_URL}/celulares`);
            if (data) {
                allCelulares = data; // Guarda todos los celulares
                displayCelulares(filterBrand);
                populateBrandFilter();
            } else {
                celularesListDiv.innerHTML = '<p class="text-center col-12">No se pudieron cargar los celulares.</p>';
            }
        }

        function displayCelulares(filterBrand) {
            celularesListDiv.innerHTML = '';
            const celularesToDisplay = filterBrand === 'all'
                ? allCelulares
                : allCelulares.filter(celular => celular.marca.toLowerCase() === filterBrand.toLowerCase());

            if (celularesToDisplay.length === 0) {
                celularesListDiv.innerHTML = '<p class="text-center col-12">No hay celulares disponibles para este filtro.</p>';
                return;
            }

            celularesToDisplay.forEach(celular => {
                let displayPrecio = parseFloat(celular.precio);
                if (isNaN(displayPrecio)) {
                    displayPrecio = 'N/D';
                } else {
                    displayPrecio = `$${displayPrecio.toFixed(2)}`;
                }

                let displayLanzamiento = 'N/A';
                if (celular.lanzamiento && celular.lanzamiento !== 'N/A' && !isNaN(new Date(celular.lanzamiento))) {
                    try {
                        const dateObj = new Date(celular.lanzamiento);
                        if (!isNaN(dateObj.getTime())) {
                            displayLanzamiento = dateObj.toLocaleDateString();
                        }
                    } catch (e) {
                        console.warn('Error al parsear la fecha de lanzamiento:', celular.lanzamiento, e);
                    }
                }

                // 1. Creamos la estructura de contenedores 
                const colDiv = document.createElement('div');
                colDiv.className = 'col';

                const cardDiv = document.createElement('div');
                cardDiv.className = 'card h-100 shadow-sm';

                const cardBody = document.createElement('div');
                cardBody.className = 'card-body';

                // 2. Creamos los elementos de texto individuales usando textContent (Sanitización automática ante XSS)
                const titulo = document.createElement('h5');
                titulo.className = 'card-title';
                titulo.textContent = `${celular.marca} ${celular.modelo}`;

                const subtitulo = document.createElement('h6');
                subtitulo.className = 'card-subtitle mb-2 text-muted';
                subtitulo.textContent = displayPrecio;

                const descripcion = document.createElement('p');
                descripcion.className = 'card-text';

                // Esto hace que respete los saltos de línea \n sin usar <br>
                descripcion.style.whiteSpace = 'pre-line'; 
                descripcion.textContent = `RAM: ${celular.RAM || 'N/A'}\n` +
                                          `Cámara Trasera: ${celular['cámara trasera'] || 'N/A'}\n` +
                                          `Procesador: ${celular.procesador || 'N/A'}\n` +
                                          `Pantalla: ${celular['tamanio de la pantalla'] || 'N/A'}`;

                const cardFooter = document.createElement('div');
                cardFooter.className = 'card-footer bg-transparent border-top-0';

                const smallLanzamiento = document.createElement('small');
                smallLanzamiento.className = 'text-muted';
                smallLanzamiento.textContent = `Lanzamiento: ${displayLanzamiento}`;

                // 3. Ensamblamos el árbol de elementos hijo por hijo (Método seguro del DOM)
                cardBody.appendChild(titulo);
                cardBody.appendChild(subtitulo);
                cardBody.appendChild(descripcion);
                cardFooter.appendChild(smallLanzamiento);

                cardDiv.appendChild(cardBody);
                cardDiv.appendChild(cardFooter);
                colDiv.appendChild(cardDiv);

                // 4. Lo agregamos de forma segura al contenedor general
                celularesListDiv.appendChild(colDiv);
            });
        }

        function populateBrandFilter() {
            brandFilterOptions.innerHTML = '<li><a class="dropdown-item filter-btn" href="#" data-brand="all">Todos</a></li>';

            const brands = new Set(allCelulares.map(celular => celular.marca));
            const sortedBrands = Array.from(brands).sort();

            sortedBrands.forEach(brand => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.classList.add('dropdown-item', 'filter-btn');
                a.href = '#';
                a.dataset.brand = brand;
                a.textContent = brand;
                li.appendChild(a);
                brandFilterOptions.appendChild(li);
            });

            document.querySelectorAll('#brand-filter-options .filter-btn').forEach(button => {
                button.removeEventListener('click', handleBrandFilterClick);
                button.addEventListener('click', handleBrandFilterClick);
            });

            const currentFilter = document.getElementById('filterDropdown').dataset.currentFilter || 'samsung'; // Default a 'all'
            document.getElementById('filterDropdown').textContent = `Filtrar por Marca: ${currentFilter === 'samsung' ? 'Samsung' : currentFilter}`;
            document.getElementById('filterDropdown').dataset.currentFilter = currentFilter;
        }

        function handleBrandFilterClick(event) {
            event.preventDefault();
            const brand = event.target.dataset.brand;
            document.getElementById('filterDropdown').textContent = `Filtrar por Marca: ${brand === 'all' ? 'Todos' : brand}`;
            document.getElementById('filterDropdown').dataset.currentFilter = brand;
            displayCelulares(brand);
        }

        loadCelulares('samsung'); // Carga inicial con 'samsung' para que no explote todo.
    }

    // --- Lógica para gestion.html (Página de Gestión) ---
    if (document.getElementById('clientes-table-body')) {
        const clientesTableBody = document.getElementById('clientes-table-body');
        const addClienteForm = document.getElementById('add-cliente-form');
        const ventasTableBody = document.getElementById('ventas-table-body');
        const addVentaForm = document.getElementById('add-venta-form');
        const ventaProductoSelect = document.getElementById('venta-producto-id');
        const ventaClienteInput = document.getElementById('venta-cliente-input');
        const ventaClienteDatalist = document.getElementById('venta-cliente-list');

        const celularesCrudTableBody = document.getElementById('celulares-crud-table-body');
        const addCelularForm = document.getElementById('add-celular-form');
        const editCelularModal = new bootstrap.Modal(document.getElementById('editCelularModal'));
        const editCelularForm = document.getElementById('edit-celular-form');

        // Referencias para el nuevo filtro de gestión
        const filterDropdownCrud = document.getElementById('filterDropdownCrud');
        const brandFilterOptionsCrud = document.getElementById('brand-filter-options-crud');
        let allCelularesCrud = []; // Para guardar todos los celulares cargados en la gestión

        // --- Funciones para Clientes ---
        async function loadClientes() {
            clientesTableBody.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Cargando...</span></div> Cargando clientes...</td></tr>';
            const data = await fetchData(`${API_BASE_URL}/clientes`);
            if (data) {
                clientesTableBody.innerHTML = '';
                if (data.length === 0) {
                    clientesTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay clientes registrados.</td></tr>';
                    return;
                }
                data.forEach(cliente => {
                    const tr = document.createElement('tr');

                    const tdId = document.createElement('td');
                    tdId.textContent = cliente.id;

                    const tdNombre = document.createElement('td');
                    tdNombre.textContent = cliente.nombre;

                    const tdApellido = document.createElement('td');
                    tdApellido.textContent = cliente.apellido;

                    const tdDni = document.createElement('td');
                    tdDni.textContent = cliente.dni;

                    tr.appendChild(tdId);
                    tr.appendChild(tdNombre);
                    tr.appendChild(tdApellido);
                    tr.appendChild(tdDni);

                    clientesTableBody.appendChild(tr);

                });
            } else {
                clientesTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar clientes.</td></tr>';
            }
        }

        addClienteForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const nombre = document.getElementById('cliente-nombre').value;
            const apellido = document.getElementById('cliente-apellido').value;
            const dni = document.getElementById('cliente-dni').value;

            // --- NUEVA VALIDACIÓN EXIGIDA POR LA CONSIGNA ---
            const dniRegex = /^[0-9]{7,8}$/; // Solo permite entre 7 y 8 números seguidos, sin puntos ni letras
            if (!dniRegex.test(dni)) {
                displayMessage('Formato de DNI inválido. Deben ser solo números (entre 7 y 8 dígitos).', 'danger');
                return; // Frena la ejecución y no envía nada al backend
            }
            // ------------------------------------------------

            const newCliente = await postData(`${API_BASE_URL}/clientes`, { nombre, apellido, dni });
            if (newCliente) {
                displayMessage('Cliente agregado exitosamente!', 'success');
                addClienteForm.reset();
                loadClientes();
                loadAllClientesForSearch();
            }
        });

        let allClientes = [];
        async function loadAllClientesForSearch() {
            allClientes = await fetchData(`${API_BASE_URL}/clientes`);
            if (allClientes) {
                populateClienteDatalist();
            }
        }
        loadAllClientesForSearch();

        function populateClienteDatalist() {
            if (!allClientes || !Array.isArray(allClientes)) {
                ventaClienteDatalist.innerHTML = '';
                return;
            }

            ventaClienteDatalist.innerHTML = '';
            allClientes.forEach(client => {
                const option = document.createElement('option');
                option.value = client.dni;
                option.textContent = `${client.nombre} ${client.apellido}`;
                ventaClienteDatalist.appendChild(option);
            });
        }

        ventaClienteInput.addEventListener('blur', () => {
            const dniValue = ventaClienteInput.value.trim();
            if (dniValue && !/^[0-9]{7,8}$/.test(dniValue)) {
                displayMessage('El DNI debe tener entre 7 y 8 dígitos numéricos.', 'danger');
            }
        });

        addVentaForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const productoId = ventaProductoSelect.value;
            const fecha = document.getElementById('venta-fecha').value;
            const clienteDni = ventaClienteInput.value.trim();

            if (!clienteDni || !productoId || !fecha) {
                displayMessage('Por favor, completa todos los campos de la venta.', 'warning');
                return;
            }

            if (!/^[0-9]{7,8}$/.test(clienteDni)) {
                displayMessage('El DNI del cliente debe tener entre 7 y 8 dígitos numéricos.', 'danger');
                return;
            }

            if (!allClientes || allClientes.length === 0) {
                await loadAllClientesForSearch();
            }

            const selectedClient = allClientes.find(client => String(client.dni).trim() === clienteDni);
            if (!selectedClient) {
                displayMessage('No se encontró un cliente con ese DNI. Usa un cliente existente.', 'danger');
                return;
            }

            const formattedDate = new Date(fecha).toISOString().slice(0, 19).replace('T', ' ');

            const newVenta = await postData(`${API_BASE_URL}/ventas`, {
                cliente_id: parseInt(selectedClient.id),
                producto_id: parseInt(productoId),
                fecha: formattedDate
            });

            if (newVenta) {
                displayMessage('Venta registrada exitosamente!', 'success');
                addVentaForm.reset();
                ventaClienteInput.value = '';
                loadVentas();
            }
        });


        // --- Funciones para Ventas ---
        async function loadVentas() {
            ventasTableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Cargando...</span></div> Cargando ventas...</td></tr>';
            const data = await fetchData(`${API_BASE_URL}/ventas`);
            if (data) {
                ventasTableBody.innerHTML = '';
                if (data.length === 0) {
                    ventasTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay ventas registradas.</td></tr>';
                    return;
                }
                data.forEach(venta => {
                    let displayPrecioVenta = parseFloat(venta.producto_precio);
                    if (isNaN(displayPrecioVenta)) {
                        displayPrecioVenta = 'N/D';
                    } else {
                        displayPrecioVenta = `$${displayPrecioVenta.toFixed(2)}`;
                    }

                    const row = `
                        <tr>
                            <td>${venta.venta_id}</td>
                            <td>${new Date(venta.fecha).toLocaleString()}</td>
                            <td>${venta.cliente_nombre} ${venta.cliente_apellido}</td>
                            <td>${venta.producto_marca} ${venta.producto_modelo}</td>
                            <td>${displayPrecioVenta}</td>
                        </tr>
                    `;
                    ventasTableBody.innerHTML += row;
                });
            } else {
                ventasTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar ventas.</td></tr>';
            }
        }

        async function populateCelularSelect() {
            const data = await fetchData(`${API_BASE_URL}/celulares`);
            if (data) {
                ventaProductoSelect.innerHTML = '<option value="">Selecciona un celular</option>';
                data.forEach(celular => {
                    let displayPrecioOption = parseFloat(celular.precio);
                    if (isNaN(displayPrecioOption)) {
                        displayPrecioOption = 'N/D';
                    } else {
                        displayPrecioOption = `$${displayPrecioOption.toFixed(2)}`;
                    }
                    const option = document.createElement('option');
                    option.value = celular.id;
                    option.textContent = `${celular.marca} ${celular.modelo} (${displayPrecioOption})`;
                    ventaProductoSelect.appendChild(option);
                });
            } else {
                ventaProductoSelect.innerHTML = '<option value="">Error al cargar celulares</option>';
            }
        }


        // --- Funciones para Gestión de Celulares (CRUD) ---
        // Modificada para aceptar un filtro de marca
        // Carga inicial con 'Samsung' por defecto
        async function loadCelularesCrud(filterBrand = 'Samsung') {
            celularesCrudTableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Cargando...</span></div> Cargando celulares...</td></tr>';
            const data = await fetchData(`${API_BASE_URL}/celulares`);
            if (data) {
                allCelularesCrud = data; // Guarda todos los celulares para el filtrado local
                displayCelularesCrud(filterBrand);
                populateBrandFilterCrud(); // Pasa la función para poblar el filtro
            } else {
                celularesCrudTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar celulares.</td></tr>';
            }
        }

        // Nueva función para mostrar los celulares en la tabla de CRUD, con filtrado
        function displayCelularesCrud(filterBrand) {
            celularesCrudTableBody.innerHTML = '';
            const celularesToDisplay = filterBrand === 'all'
                ? allCelularesCrud
                : allCelularesCrud.filter(celular => celular.marca.toLowerCase() === filterBrand.toLowerCase());

            if (celularesToDisplay.length === 0) {
                celularesCrudTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay celulares disponibles para este filtro.</td></tr>';
                return;
            }

            celularesToDisplay.forEach(celular => {
                let displayPrecioCrud = parseFloat(celular.precio);
                if (isNaN(displayPrecioCrud)) {
                    displayPrecioCrud = 'N/D';
                } else {
                    displayPrecioCrud = `$${displayPrecioCrud.toFixed(2)}`;
                }

                const row = `
                    <tr>
                        <td>${celular.id}</td>
                        <td>${celular.marca}</td>
                        <td>${celular.modelo}</td>
                        <td>${displayPrecioCrud}</td>
                        <td>
                            <button class="btn btn-sm btn-info edit-btn" data-id="${celular.id}">Editar</button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${celular.id}">Eliminar</button>
                        </td>
                    </tr>
                `;
                celularesCrudTableBody.innerHTML += row;
            });

            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', (e) => openEditModal(e.target.dataset.id));
            });
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', (e) => deleteCelular(e.target.dataset.id));
            });
        }

        // Nueva función para poblar el dropdown de filtro en la gestión
        function populateBrandFilterCrud() {
            brandFilterOptionsCrud.innerHTML = '<li><a class="dropdown-item filter-btn-crud" href="#" data-brand="all">Todos</a></li>';

            const brands = new Set(allCelularesCrud.map(celular => celular.marca));
            const sortedBrands = Array.from(brands).sort();

            sortedBrands.forEach(brand => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.classList.add('dropdown-item', 'filter-btn-crud');
                a.href = '#';
                a.dataset.brand = brand;
                a.textContent = brand;
                li.appendChild(a);
                brandFilterOptionsCrud.appendChild(li);
            });

            document.querySelectorAll('#brand-filter-options-crud .filter-btn-crud').forEach(button => {
                button.removeEventListener('click', handleBrandFilterClickCrud);
                button.addEventListener('click', handleBrandFilterClickCrud);
            });

            // Establecer el texto inicial del botón de filtro a 'Samsung' por defecto
            const currentFilterCrud = filterDropdownCrud.dataset.currentFilter || 'Samsung';
            filterDropdownCrud.textContent = `Filtrar por Marca: ${currentFilterCrud === 'all' ? 'Todos' : currentFilterCrud}`;
            filterDropdownCrud.dataset.currentFilter = currentFilterCrud;
        }

        // Nueva función para manejar el clic en los botones de filtro de gestión
        function handleBrandFilterClickCrud(event) {
            event.preventDefault();
            const brand = event.target.dataset.brand;
            filterDropdownCrud.textContent = `Filtrar por Marca: ${brand === 'all' ? 'Todos' : brand}`;
            filterDropdownCrud.dataset.currentFilter = brand;
            displayCelularesCrud(brand);
        }

        addCelularForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const celularData = {
                marca: document.getElementById('add-marca').value,
                modelo: document.getElementById('add-modelo').value,
                precio: document.getElementById('add-precio').value,
                peso: document.getElementById('add-peso').value || '',
                ram: document.getElementById('add-ram').value || '',
                camara_frontal: document.getElementById('add-camara_frontal').value || '',
                camara_trasera: document.getElementById('add-camara_trasera').value || '',
                procesador: document.getElementById('add-procesador').value || '',
                capacidad_bateria: document.getElementById('add-capacidad_bateria').value || '',
                tamanio_pantalla: document.getElementById('add-tamanio_pantalla').value || '',
                lanzamiento: document.getElementById('add-lanzamiento').value || ''
            };

            const newCelular = await postData(`${API_BASE_URL}/celulares`, celularData);
            if (newCelular) {
                displayMessage('Celular agregado exitosamente!', 'success');
                addCelularForm.reset();
                loadCelularesCrud(filterDropdownCrud.dataset.currentFilter || 'Samsung'); // Recarga con el filtro actual o Samsung
                populateCelularSelect();
            }
        });

        async function openEditModal(id) {
            const celular = await fetchData(`${API_BASE_URL}/celulares/${id}`);
            if (celular) {
                document.getElementById('edit-id').value = celular.id;
                document.getElementById('edit-marca').value = celular.marca;
                document.getElementById('edit-modelo').value = celular.modelo;
                document.getElementById('edit-precio').value = celular.precio;
                document.getElementById('edit-peso').value = celular.peso === 'N/A' ? '' : celular.peso || '';
                document.getElementById('edit-ram').value = celular.RAM === 'N/A' ? '' : celular.RAM || '';
                document.getElementById('edit-camara_frontal').value = celular['cámara frontal'] === 'N/A' ? '' : celular['cámara frontal'] || '';
                document.getElementById('edit-camara_trasera').value = celular['cámara trasera'] === 'N/A' ? '' : celular['cámara trasera'] || '';
                document.getElementById('edit-procesador').value = celular.procesador === 'N/A' ? '' : celular.procesador || '';
                document.getElementById('edit-capacidad_bateria').value = celular['capacidad de la batería'] === 'N/A' ? '' : celular['capacidad de la batería'] || '';
                document.getElementById('edit-tamanio_pantalla').value = celular['tamanio de la pantalla'] === 'N/A' ? '' : celular['tamanio de la pantalla'] || '';

                document.getElementById('edit-lanzamiento').value = celular.lanzamiento && celular.lanzamiento !== 'N/A' ? celular.lanzamiento.split('T')[0] : '';
                editCelularModal.show();
            }
        }

        editCelularForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const id = document.getElementById('edit-id').value;
            const updatedCelularData = {
                marca: document.getElementById('edit-marca').value,
                modelo: document.getElementById('edit-modelo').value,
                precio: document.getElementById('edit-precio').value,
                peso: document.getElementById('edit-peso').value || '',
                ram: document.getElementById('edit-ram').value || '',
                camara_frontal: document.getElementById('edit-camara_frontal').value || '',
                camara_trasera: document.getElementById('edit-camara_trasera').value || '',
                procesador: document.getElementById('edit-procesador').value || '',
                capacidad_bateria: document.getElementById('edit-capacidad_bateria').value || '',
                tamanio_pantalla: document.getElementById('edit-tamanio_pantalla').value || '',
                lanzamiento: document.getElementById('edit-lanzamiento').value || ''
            };

            const result = await putData(`${API_BASE_URL}/celulares/${id}`, updatedCelularData);
            if (result) {
                displayMessage('Celular actualizado exitosamente!', 'success');
                editCelularModal.hide();
                loadCelularesCrud(filterDropdownCrud.dataset.currentFilter || 'Samsung'); // Recarga con el filtro actual o Samsung
                populateCelularSelect();
            }
        });

        async function deleteCelular(id) {
            if (confirm('¿Estás seguro de que quieres eliminar este celular?')) {
                const result = await deleteData(`${API_BASE_URL}/celulares/${id}`);
                if (result) {
                    displayMessage('Celular eliminado exitosamente!', 'success');
                    loadCelularesCrud(filterDropdownCrud.dataset.currentFilter || 'Samsung'); // Recarga con el filtro actual o Samsung
                    populateCelularSelect();
                }
            }
        }

        const myTab = document.getElementById('myTab');
        if (myTab) {
            myTab.addEventListener('shown.bs.tab', event => {
                const activeTabId = event.target.id;
                if (activeTabId === 'clientes-tab') {
                    loadClientes();
                } else if (activeTabId === 'ventas-tab') {
                    loadVentas();
                    populateCelularSelect();
                    loadAllClientesForSearch();
                } else if (activeTabId === 'celulares-crud-tab') {
                    // Carga los celulares de gestión con 'Samsung' por defecto si no hay un filtro previo
                    loadCelularesCrud(filterDropdownCrud.dataset.currentFilter || 'Samsung');
                }
            });
            // Carga inicial para la primera pestaña visible al cargar la página de gestión
            const initialActiveTab = document.querySelector('#myTab .nav-link.active');
            if (initialActiveTab && initialActiveTab.id === 'clientes-tab') {
                loadClientes();
            }
        }
    }

function controlarAccesoVisual() {
    // 1. Buscamos el elemento
    const navGestion = document.getElementById('nav-gestion');
    
    // Si sigue saliendo null, avisamos por consola para saber qué pasa
    if (!navGestion) {
        console.error("Error: No se encontró el elemento con id 'nav-gestion' en el HTML.");
        return;
    }

    const token = localStorage.getItem('accessToken');

    // 2. Si no hay token, ocultamos y redirigimos si estamos en gestión
    if (!token) {
        navGestion.style.display = 'none';
        if (window.location.pathname === '/gestion') {
            window.location.href = '/';
        }
        return;
    }

    try {
        // 3. Decodificamos y verificamos rol
        const payload = JSON.parse(atob(token.split('.')[1]));
        // console.log("Rol detectado:", payload.role); // Comentado para no mostrar datos sensibles en consola

        if (payload.role === 'rol_admin') {
            navGestion.style.display = 'block';
        } else {
            navGestion.style.display = 'none';
            if (window.location.pathname === '/gestion') {
                window.location.href = '/';
            }
        }
    } catch (error) {
        console.error("Error al procesar el token:", error);
        navGestion.style.display = 'none';
        if (window.location.pathname === '/gestion') {
            window.location.href = '/';
        }
    }
}

const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Esta variable lee la cajita del HTML (que tiene id="login-email")
        const inputUsuario = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/login`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: inputUsuario, // <-- CAMBIO CLAVE: Enviamos 'username' en vez de 'email'
                    password: password 
                })
            });

            if (response.ok) {
                const data = await response.json();
                
                // Tu backend devuelve { token: "..." }, así que data.token está perfecto
                const tokenRecibido = data.token || data.accessToken; 
                localStorage.setItem('accessToken', tokenRecibido);
                sessionStorage.setItem('loggedIn', 'true');
                
                updateAuthButtons();
                alert('¡Autenticado con éxito como Administrador!');
                window.location.reload(); 
            } else {
                alert('Credenciales incorrectas. Verificá los datos.');
            }
        } catch (error) {
            console.error('Error en el login:', error);
            alert('No se pudo establecer conexión con el servidor.');
        }
    });
}


// Ejecutar inmediatamente y también cuando la página cargue
controlarAccesoVisual();
document.addEventListener('DOMContentLoaded', controlarAccesoVisual);



});
