class OrderManager {
    constructor() {
        this.orders = [];
        this.config = {
            githubToken: '',
            gistId: ''
        };
        this.init();
    }

    init() {
        this.loadConfig();
        this.loadOrders();
        this.setupEventListeners();
        this.renderOrders();
        this.updateSyncStatus();
        
        // Sincronizar automáticamente al cargar si está configurado
        if (this.config.githubToken && this.config.gistId) {
            setTimeout(() => {
                this.loadFromGist();
            }, 1000);
        }
    }

    setupEventListeners() {
        // Formulario de pedido
        document.getElementById('orderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveOrder();
        });

        // Agregar item
        document.getElementById('addItem').addEventListener('click', () => {
            this.addItemRow();
        });

        // Botón de cancelar
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.clearForm();
        });

        // Configuración
        document.getElementById('configBtn').addEventListener('click', () => {
            this.showConfigModal();
        });

        document.getElementById('saveConfig').addEventListener('click', () => {
            this.saveConfig();
        });

        document.getElementById('closeConfig').addEventListener('click', () => {
            this.hideConfigModal();
        });

        // Cerrar modal al hacer clic fuera
        document.getElementById('configModal').addEventListener('click', (e) => {
            if (e.target.id === 'configModal') {
                this.hideConfigModal();
            }
        });

        // Sincronización
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncData();
        });

        // Filtros
        document.getElementById('statusFilter').addEventListener('change', () => {
            this.renderOrders();
        });

        document.getElementById('dateFilter').addEventListener('change', () => {
            this.renderOrders();
        });

        // Event delegation para elementos dinámicos
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
                this.removeItemRow(e.target.closest('.remove-item'));
            }
            if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
                const btn = e.target.closest('.edit-btn');
                const orderId = btn.dataset.orderId;
                this.editOrder(orderId);
            }
            if (e.target.classList.contains('status-btn') || e.target.closest('.status-btn')) {
                const btn = e.target.closest('.status-btn');
                const orderId = btn.dataset.orderId;
                this.changeOrderStatus(orderId);
            }
            if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
                const btn = e.target.closest('.delete-btn');
                const orderId = btn.dataset.orderId;
                this.deleteOrder(orderId);
            }
        });

        // Configurar fecha mínima para entregas
        const deliveryDate = document.getElementById('deliveryDate');
        const today = new Date().toISOString().split('T')[0];
        deliveryDate.min = today;
        deliveryDate.value = today;
    }

    addItemRow() {
        const itemsList = document.getElementById('itemsList');
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row bg-white p-4 rounded-lg border-2 border-gray-200';
        itemRow.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                    <input type="text" class="product-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                           placeholder="Ej: Empanadas napolitana" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Cantidad/Peso</label>
                    <input type="text" class="quantity-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                           placeholder="Ej: 12 unidades o 2 kg" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Precio Total</label>
                    <input type="text" class="price-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                           placeholder="Ej: $5000">
                </div>
                <div class="flex items-end">
                    <button type="button" class="remove-item w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `;
        itemsList.appendChild(itemRow);
    }

    removeItemRow(button) {
        const itemRow = button.closest('.item-row');
        const itemsList = document.getElementById('itemsList');
        if (itemsList.children.length > 1) {
            itemRow.remove();
        } else {
            this.showNotification('Debe mantener al menos un producto', 'error');
        }
    }

    saveOrder() {
        const formData = this.getFormData();
        if (!this.validateOrder(formData)) {
            return;
        }

        const order = {
            id: this.generateId(),
            ...formData,
            status: 'pendiente',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.orders.push(order);
        this.saveToLocalStorage();
        this.renderOrders();
        this.clearForm();
        this.showNotification('Pedido guardado exitosamente', 'success');

        // Sincronizar automáticamente si está configurado
        if (this.config.githubToken) {
            this.syncData();
        }
    }

    getFormData() {
        const itemRows = document.querySelectorAll('.item-row');
        const items = [];

        itemRows.forEach(row => {
            const productInput = row.querySelector('.product-input');
            const quantityInput = row.querySelector('.quantity-input');
            const priceInput = row.querySelector('.price-input');

            if (productInput.value.trim() && quantityInput.value.trim()) {
                items.push({
                    product: productInput.value.trim(),
                    quantity: quantityInput.value.trim(),
                    price: priceInput.value.trim() || ''
                });
            }
        });

        return {
            customerName: document.getElementById('customerName').value.trim(),
            customerPhone: document.getElementById('customerPhone').value.trim(),
            deliveryDate: document.getElementById('deliveryDate').value,
            deliveryTime: document.getElementById('deliveryTime').value,
            items: items,
            notes: document.getElementById('notes').value.trim(),
            totalAmount: document.getElementById('totalAmount').value.trim() || ''
        };
    }

    validateOrder(order) {
        if (!order.customerName) {
            this.showNotification('El nombre del cliente es requerido', 'error');
            return false;
        }

        if (!order.deliveryDate) {
            this.showNotification('La fecha de entrega es requerida', 'error');
            return false;
        }

        if (!order.deliveryTime) {
            this.showNotification('La hora de entrega es requerida', 'error');
            return false;
        }

        if (order.items.length === 0) {
            this.showNotification('Debe agregar al menos un producto', 'error');
            return false;
        }

        return true;
    }

    clearForm() {
        document.getElementById('orderForm').reset();
        const itemsList = document.getElementById('itemsList');
        itemsList.innerHTML = `
            <div class="item-row bg-white p-4 rounded-lg border-2 border-gray-200">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                        <input type="text" class="product-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                               placeholder="Ej: Empanadas napolitana" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Cantidad/Peso</label>
                        <input type="text" class="quantity-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                               placeholder="Ej: 12 unidades o 2 kg" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Precio Total</label>
                        <input type="text" class="price-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                               placeholder="Ej: $5000">
                    </div>
                    <div class="flex items-end">
                        <button type="button" class="remove-item w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Configurar fecha por defecto
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('deliveryDate').value = today;
    }

    renderOrders() {
        const ordersList = document.getElementById('ordersList');
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;

        let filteredOrders = this.orders;

        // Filtrar por estado
        if (statusFilter) {
            filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
        }

        // Filtrar por fecha
        if (dateFilter) {
            filteredOrders = filteredOrders.filter(order => order.deliveryDate === dateFilter);
        }

        // Ordenar por fecha de entrega y hora
        filteredOrders.sort((a, b) => {
            const dateA = new Date(`${a.deliveryDate}T${a.deliveryTime}`);
            const dateB = new Date(`${b.deliveryDate}T${b.deliveryTime}`);
            return dateA - dateB;
        });

        if (filteredOrders.length === 0) {
            ordersList.innerHTML = `
                <div class="text-center py-12">
                    <span class="material-icons text-gray-300 text-6xl mb-4 block">inbox</span>
                    <h3 class="text-lg font-semibold text-gray-600 mb-2">No hay pedidos</h3>
                    <p class="text-gray-500">Los pedidos aparecerán aquí cuando se registren.</p>
                </div>
            `;
            return;
        }

        ordersList.innerHTML = filteredOrders.map(order => this.renderOrderCard(order)).join('');
    }

    renderOrderCard(order) {
        const deliveryDateTime = new Date(`${order.deliveryDate}T${order.deliveryTime}`);
        const formattedDate = deliveryDateTime.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = deliveryDateTime.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusColors = {
            'pendiente': 'bg-red-100 text-red-700',
            'en_proceso': 'bg-yellow-100 text-yellow-700',
            'completado': 'bg-green-100 text-green-700',
            'cancelado': 'bg-gray-100 text-gray-700'
        };

        return `
            <div class="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <div class="flex items-center mb-2 sm:mb-0">
                        <span class="material-icons text-blue-600 mr-2">receipt</span>
                        <h3 class="text-lg font-semibold text-gray-800">Pedido #${order.id}</h3>
                    </div>
                    <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}">${this.getStatusText(order.status)}</span>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div class="flex items-center text-gray-600">
                        <span class="material-icons text-sm mr-2">person</span>
                        <span class="text-sm">${order.customerName}</span>
                    </div>
                    ${order.customerPhone ? `
                        <div class="flex items-center text-gray-600">
                            <span class="material-icons text-sm mr-2">phone</span>
                            <span class="text-sm">${order.customerPhone}</span>
                        </div>
                    ` : ''}
                    <div class="flex items-center text-gray-600">
                        <span class="material-icons text-sm mr-2">event</span>
                        <span class="text-sm">${formattedDate}</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <span class="material-icons text-sm mr-2">schedule</span>
                        <span class="text-sm">${formattedTime}</span>
                    </div>
                </div>

                <div class="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                        <span class="material-icons text-sm mr-2">shopping_cart</span>
                        Productos
                    </h4>
                    <div class="space-y-2">
                        ${order.items.map(item => `
                            <div class="flex justify-between items-center text-sm">
                                <div>
                                    <span class="font-medium text-gray-800">${item.product}</span>
                                    <span class="text-gray-600 ml-2">(${item.quantity})</span>
                                </div>
                                ${item.price ? `<span class="text-gray-600">${item.price}</span>` : ''}
                            </div>
                        `).join('')}
                        ${order.totalAmount ? `
                            <div class="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                                <span class="font-semibold text-gray-800">Total Estimado:</span>
                                <span class="font-semibold text-gray-800">${order.totalAmount}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${order.notes ? `
                    <div class="bg-blue-50 rounded-lg p-3 mb-4">
                        <div class="flex items-start">
                            <span class="material-icons text-blue-600 text-sm mr-2 mt-0.5">note</span>
                            <span class="text-sm text-blue-800">${order.notes}</span>
                        </div>
                    </div>
                ` : ''}

                <div class="flex flex-wrap gap-2">
                    <button class="edit-btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-1" data-order-id="${order.id}">
                        <span class="material-icons text-sm">edit</span>
                        <span>Editar</span>
                    </button>
                    <button class="status-btn bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-1" data-order-id="${order.id}">
                        <span class="material-icons text-sm">swap_horiz</span>
                        <span>Estado</span>
                    </button>
                    <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-1" data-order-id="${order.id}">
                        <span class="material-icons text-sm">delete</span>
                        <span>Eliminar</span>
                    </button>
                </div>
            </div>
        `;
    }

    getStatusText(status) {
        const statusMap = {
            'pendiente': 'Pendiente',
            'en_proceso': 'En Proceso',
            'completado': 'Completado',
            'cancelado': 'Cancelado'
        };
        return statusMap[status] || status;
    }

    editOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        // Llenar el formulario con los datos del pedido
        document.getElementById('customerName').value = order.customerName;
        document.getElementById('customerPhone').value = order.customerPhone || '';
        document.getElementById('deliveryDate').value = order.deliveryDate;
        document.getElementById('deliveryTime').value = order.deliveryTime;
        document.getElementById('notes').value = order.notes || '';
        document.getElementById('totalAmount').value = order.totalAmount || '';

        // Limpiar items actuales
        const itemsList = document.getElementById('itemsList');
        itemsList.innerHTML = '';

        // Agregar items del pedido
        order.items.forEach((item) => {
            const itemRow = document.createElement('div');
            itemRow.className = 'item-row bg-white p-4 rounded-lg border-2 border-gray-200';
            itemRow.innerHTML = `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                        <input type="text" class="product-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                               placeholder="Ej: Empanadas napolitana" required value="${item.product}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Cantidad/Peso</label>
                        <input type="text" class="quantity-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                               placeholder="Ej: 12 unidades o 2 kg" required value="${item.quantity}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Precio Total</label>
                        <input type="text" class="price-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                               placeholder="Ej: $5000" value="${item.price}">
                    </div>
                    <div class="flex items-end">
                        <button type="button" class="remove-item w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                </div>
            `;
            itemsList.appendChild(itemRow);
        });

        // Eliminar el pedido original para evitar duplicados
        this.deleteOrder(orderId, false);

        this.showNotification('Pedido cargado para edición', 'info');
        
        // Scroll al formulario
        document.querySelector('.bg-white.rounded-2xl.shadow-lg').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    changeOrderStatus(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const statuses = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
        const currentIndex = statuses.indexOf(order.status);
        const nextIndex = (currentIndex + 1) % statuses.length;

        order.status = statuses[nextIndex];
        order.updatedAt = new Date().toISOString();

        this.saveToLocalStorage();
        this.renderOrders();
        this.showNotification('Estado actualizado', 'success');

        // Sincronizar automáticamente si está configurado
        if (this.config.githubToken) {
            this.syncData();
        }
    }

    deleteOrder(orderId, showConfirm = true) {
        if (showConfirm && !confirm('¿Está seguro de que desea eliminar este pedido?')) {
            return;
        }

        this.orders = this.orders.filter(o => o.id !== orderId);
        this.saveToLocalStorage();
        this.renderOrders();
        
        if (showConfirm) {
            this.showNotification('Pedido eliminado', 'success');
            
            // Sincronizar automáticamente si está configurado
            if (this.config.githubToken) {
                this.syncData();
            }
        }
    }

    // Configuración y sincronización
    showConfigModal() {
        const modal = document.getElementById('configModal');
        document.getElementById('githubToken').value = this.config.githubToken;
        document.getElementById('gistId').value = this.config.gistId;
        modal.style.display = 'block';
    }

    hideConfigModal() {
        document.getElementById('configModal').style.display = 'none';
    }

    async saveConfig() {
        const newToken = document.getElementById('githubToken').value.trim();
        const newGistId = document.getElementById('gistId').value.trim();
        
        if (!newToken) {
            this.showNotification('El token de GitHub es requerido', 'error');
            return;
        }

        // Validar formato del token
        if (!newToken.startsWith('ghp_') && !newToken.startsWith('github_pat_')) {
            this.showNotification('Formato de token inválido. Debe empezar con "ghp_" o "github_pat_"', 'error');
            return;
        }

        // Probar el token antes de guardarlo
        try {
            const testResponse = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${newToken}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });

            if (!testResponse.ok) {
                if (testResponse.status === 401) {
                    this.showNotification('Token inválido o expirado', 'error');
                } else if (testResponse.status === 403) {
                    this.showNotification('Token sin permisos suficientes. Asegúrese de incluir el scope "gist"', 'error');
                } else {
                    this.showNotification(`Error al validar token: ${testResponse.status}`, 'error');
                }
                return;
            }

            // Token válido, guardar configuración
            this.config.githubToken = newToken;
            this.config.gistId = newGistId;
            
            localStorage.setItem('bakery_config', JSON.stringify(this.config));
            this.hideConfigModal();
            this.updateSyncStatus();
            this.showNotification('Configuración guardada y token validado', 'success');

            // Intentar sincronizar automáticamente
            if (this.orders.length > 0) {
                setTimeout(() => this.syncData(), 1000);
            }

        } catch (error) {
            console.error('Error al validar token:', error);
            this.showNotification('Error de conexión. Verifique su internet y el token.', 'error');
        }
    }

    loadConfig() {
        const saved = localStorage.getItem('bakery_config');
        if (saved) {
            this.config = { ...this.config, ...JSON.parse(saved) };
        }
    }

    updateSyncStatus() {
        const statusText = document.getElementById('syncStatus');
        const isConfigured = this.config.githubToken;
        
        statusText.textContent = isConfigured ? 'Conectado' : 'Desconectado';
        statusText.className = `px-3 py-1 rounded-full text-sm font-medium ${isConfigured ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
    }

    async syncData() {
        if (!this.config.githubToken) {
            this.showNotification('Configure GitHub token para sincronizar', 'error');
            this.showConfigModal();
            return;
        }

        const syncBtn = document.getElementById('syncBtn');
        syncBtn.classList.add('animate-spin');

        try {
            const data = {
                orders: this.orders,
                lastSync: new Date().toISOString()
            };

            if (this.config.gistId) {
                // Actualizar gist existente
                await this.updateGist(data);
            } else {
                // Crear nuevo gist
                const gistId = await this.createGist(data);
                this.config.gistId = gistId;
                localStorage.setItem('bakery_config', JSON.stringify(this.config));
            }

            // Guardar timestamp de sincronización
            localStorage.setItem('bakery_lastSync', data.lastSync);
            this.showNotification('Datos sincronizados exitosamente', 'success');
        } catch (error) {
            console.error('Error al sincronizar:', error);
            
            if (error.message.includes('403')) {
                this.showNotification('Token de GitHub inválido o sin permisos. Verifique la configuración.', 'error');
                this.showConfigModal();
            } else if (error.message.includes('401')) {
                this.showNotification('Token de GitHub no autorizado. Genere un nuevo token.', 'error');
                this.showConfigModal();
            } else if (error.message.includes('404')) {
                this.showNotification('Gist no encontrado. Se creará uno nuevo.', 'warning');
                this.config.gistId = '';
                localStorage.setItem('bakery_config', JSON.stringify(this.config));
                // Intentar crear uno nuevo
                try {
                    const data = {
                        orders: this.orders,
                        lastSync: new Date().toISOString()
                    };
                    const gistId = await this.createGist(data);
                    this.config.gistId = gistId;
                    localStorage.setItem('bakery_config', JSON.stringify(this.config));
                    localStorage.setItem('bakery_lastSync', data.lastSync);
                    this.showNotification('Nuevo Gist creado exitosamente', 'success');
                } catch (createError) {
                    this.showNotification('Error al crear nuevo Gist', 'error');
                }
            } else {
                this.showNotification('Error de conexión. Verifique su internet.', 'error');
            }
            
            // Intentar cargar datos del gist si falló la escritura
            if (this.config.gistId) {
                try {
                    await this.loadFromGist();
                } catch (loadError) {
                    console.error('Error al cargar datos:', loadError);
                }
            }
        } finally {
            syncBtn.classList.remove('animate-spin');
        }
    }

    async createGist(data) {
        if (!this.config.githubToken) {
            throw new Error('GitHub token no configurado');
        }

        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.githubToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify({
                description: 'Datos de Pedidos - Panadería',
                public: false,
                files: {
                    'pedidos.json': {
                        content: JSON.stringify(data, null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Error al crear gist: ${response.status} - ${errorText}`);
        }

        const gist = await response.json();
        return gist.id;
    }

    async updateGist(data) {
        if (!this.config.githubToken || !this.config.gistId) {
            throw new Error('Configuración incompleta');
        }

        const response = await fetch(`https://api.github.com/gists/${this.config.gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${this.config.githubToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify({
                files: {
                    'pedidos.json': {
                        content: JSON.stringify(data, null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Error al actualizar gist: ${response.status} - ${errorText}`);
        }
    }

    async loadFromGist() {
        if (!this.config.gistId || !this.config.githubToken) return;

        try {
            const response = await fetch(`https://api.github.com/gists/${this.config.gistId}`, {
                headers: {
                    'Authorization': `Bearer ${this.config.githubToken}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    this.showNotification('Gist no encontrado. Se creará uno nuevo en la próxima sincronización.', 'warning');
                    this.config.gistId = '';
                    localStorage.setItem('bakery_config', JSON.stringify(this.config));
                }
                throw new Error(`Error al cargar gist: ${response.status}`);
            }

            const gist = await response.json();
            const content = gist.files['pedidos.json'].content;
            const data = JSON.parse(content);

            // Obtener datos remotos
            const remoteOrders = data.orders || [];
            const remoteLastSync = data.lastSync;
            
            // Obtener datos locales
            const localOrders = this.orders;
            const localLastSync = localStorage.getItem('bakery_lastSync');

            // Si los datos remotos son más recientes, usarlos directamente
            if (!localLastSync || (remoteLastSync && new Date(remoteLastSync) > new Date(localLastSync))) {
                this.orders = remoteOrders;
                localStorage.setItem('bakery_lastSync', remoteLastSync || new Date().toISOString());
                this.saveToLocalStorage();
                this.renderOrders();
                this.showNotification('Datos actualizados desde la nube', 'success');
                return;
            }

            // Si no hay diferencia de tiempo significativa, hacer merge inteligente
            const orderMap = new Map();

            // Primero agregar pedidos remotos
            remoteOrders.forEach(remoteOrder => {
                orderMap.set(remoteOrder.id, remoteOrder);
            });

            // Luego agregar/actualizar con pedidos locales más recientes
            localOrders.forEach(localOrder => {
                const remoteOrder = orderMap.get(localOrder.id);
                if (!remoteOrder || new Date(localOrder.updatedAt) > new Date(remoteOrder.updatedAt)) {
                    orderMap.set(localOrder.id, localOrder);
                }
            });

            // Solo mantener pedidos que existen en remoto O son muy recientes localmente
            const finalOrders = Array.from(orderMap.values()).filter(order => {
                const isInRemote = remoteOrders.some(r => r.id === order.id);
                const isRecentLocal = new Date(order.updatedAt) > new Date(Date.now() - 5 * 60 * 1000); // 5 minutos
                return isInRemote || isRecentLocal;
            });

            this.orders = finalOrders;
            localStorage.setItem('bakery_lastSync', new Date().toISOString());
            this.saveToLocalStorage();
            this.renderOrders();
            
            if (finalOrders.length !== localOrders.length) {
                this.showNotification('Datos sincronizados desde la nube', 'success');
            }
        } catch (error) {
            console.error('Error al cargar desde gist:', error);
            // No mostrar notificación de error en carga automática para no molestar al usuario
        }
    }

    // Utilidades
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    saveToLocalStorage() {
        localStorage.setItem('bakery_orders', JSON.stringify(this.orders));
    }

    loadOrders() {
        const saved = localStorage.getItem('bakery_orders');
        if (saved) {
            this.orders = JSON.parse(saved);
        }
        // No hacer auto-sincronización aquí, se hace en init()
    }

    showNotification(message, type = 'info') {
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg font-medium text-white transform transition-all duration-300 translate-x-full opacity-0`;
        
        // Aplicar colores según el tipo
        const typeColors = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'info': 'bg-blue-500',
            'warning': 'bg-yellow-500'
        };
        
        notification.classList.add(typeColors[type] || typeColors.info);
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        }, 100);

        // Animar salida y remover
        setTimeout(() => {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 4000);
    }
}

// Inicializar la aplicación cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    new OrderManager();
});
