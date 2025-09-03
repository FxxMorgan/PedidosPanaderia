class OrderManager {
    constructor() {
        this.orders = [];
        this.apiBaseUrl = '/api/orders';
        this.isOnline = false;
        this.editingOrderId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkApiConnection();
        this.setMinDeliveryDate();
    }

    setMinDeliveryDate() {
        const deliveryDate = document.getElementById('deliveryDate');
        const today = new Date().toISOString().split('T')[0];
        deliveryDate.min = today;
    }

    async checkApiConnection() {
        try {
            const response = await fetch('/api/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                this.isOnline = true;
                this.updateSyncStatus('Conectado', 'bg-green-100 text-green-700');
                await this.loadOrders();
                console.log('API conectada:', data);
            } else {
                throw new Error(`API respondió con estado: ${response.status}`);
            }
        } catch (error) {
            this.isOnline = false;
            this.updateSyncStatus('Modo Offline', 'bg-yellow-100 text-yellow-700');
            console.warn('Servidor no disponible, trabajando en modo offline:', error.message);
            
            // Intentar cargar datos del localStorage como fallback
            this.loadOfflineOrders();
        }
    }

    updateSyncStatus(text, classes) {
        const statusElement = document.getElementById('syncStatus');
        statusElement.textContent = text;
        statusElement.className = `px-3 py-1 rounded-full text-sm font-medium ${classes}`;
    }

    loadOfflineOrders() {
        try {
            const savedOrders = localStorage.getItem('panaderia_orders');
            if (savedOrders) {
                this.orders = JSON.parse(savedOrders);
                this.renderOrders();
                this.showToast('Cargando datos locales (modo offline)', 'warning');
            } else {
                this.orders = [];
                this.renderOrders();
                this.showToast('Sin conexión al servidor. Los datos se guardarán localmente.', 'warning');
            }
        } catch (error) {
            console.error('Error cargando datos offline:', error);
            this.orders = [];
            this.renderOrders();
        }
    }

    async loadOrders() {
        try {
            this.updateSyncStatus('Cargando...', 'bg-yellow-100 text-yellow-700');
            
            const response = await fetch(this.apiBaseUrl);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success) {
                this.orders = data.data || [];
                
                // Limpiar y validar datos de órdenes
                this.orders = this.orders.map(order => this.cleanOrderData(order));
                
                this.renderOrders();
                this.updateSyncStatus('Sincronizado', 'bg-green-100 text-green-700');
            }
        } catch (error) {
            console.error('Error cargando pedidos:', error);
            this.updateSyncStatus('Error de carga', 'bg-red-100 text-red-700');
            this.showToast('Error al cargar pedidos. Verifica tu conexión.', 'error');
        }
    }

    cleanOrderData(order) {
        // Limpiar y validar datos de la orden
        const cleaned = { ...order };
        
        // Asegurar que deliveryDate tenga formato correcto
        if (cleaned.deliveryDate && typeof cleaned.deliveryDate === 'string') {
            // Si viene como ISO string, extraer solo la fecha
            if (cleaned.deliveryDate.includes('T')) {
                cleaned.deliveryDate = cleaned.deliveryDate.split('T')[0];
            }
        }
        
        // Asegurar que deliveryTime tenga formato HH:MM
        if (cleaned.deliveryTime && typeof cleaned.deliveryTime === 'string') {
            // Si viene con segundos, removerlos
            if (cleaned.deliveryTime.includes(':') && cleaned.deliveryTime.split(':').length > 2) {
                const timeParts = cleaned.deliveryTime.split(':');
                cleaned.deliveryTime = `${timeParts[0]}:${timeParts[1]}`;
            }
        }
        
        // Asegurar que items sea un array
        if (!Array.isArray(cleaned.items)) {
            cleaned.items = [];
        }
        
        return cleaned;
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

        // Sincronización
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.loadOrders();
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
            this.showToast('Debe mantener al menos un producto', 'error');
        }
    }

    async saveOrder() {
        const formData = this.getFormData();
        if (!this.validateOrder(formData)) {
            return;
        }

        try {
            const url = this.editingOrderId ? `${this.apiBaseUrl}/${this.editingOrderId}` : this.apiBaseUrl;
            const method = this.editingOrderId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.showToast(
                    this.editingOrderId ? 'Pedido actualizado exitosamente' : 'Pedido creado exitosamente', 
                    'success'
                );
                this.clearForm();
                this.loadOrders();
            } else {
                throw new Error(data.message || 'Error al guardar el pedido');
            }
        } catch (error) {
            console.error('Error guardando pedido:', error);
            this.showToast('Error al guardar el pedido: ' + error.message, 'error');
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
            this.showToast('El nombre del cliente es requerido', 'error');
            return false;
        }

        if (!order.deliveryDate) {
            this.showToast('La fecha de entrega es requerida', 'error');
            return false;
        }

        if (!order.deliveryTime) {
            this.showToast('La hora de entrega es requerida', 'error');
            return false;
        }

        if (order.items.length === 0) {
            this.showToast('Debe agregar al menos un producto', 'error');
            return false;
        }

        // Validar formato de fecha
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(order.deliveryDate)) {
            this.showToast('Formato de fecha inválido', 'error');
            return false;
        }

        // Validar formato de hora
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(order.deliveryTime)) {
            this.showToast('Formato de hora inválido', 'error');
            return false;
        }

        // Validar fecha de entrega no sea en el pasado
        try {
            const deliveryDateTime = new Date(`${order.deliveryDate}T${order.deliveryTime}`);
            const now = new Date();
            if (deliveryDateTime < now) {
                this.showToast('La fecha y hora de entrega no puede ser en el pasado', 'error');
                return false;
            }
        } catch (error) {
            this.showToast('Fecha u hora inválida', 'error');
            return false;
        }

        return true;
    }

    async deleteOrder(orderId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/${orderId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (data.success) {
                this.showToast('Pedido eliminado exitosamente', 'success');
                this.loadOrders();
            } else {
                throw new Error(data.message || 'Error al eliminar el pedido');
            }
        } catch (error) {
            console.error('Error eliminando pedido:', error);
            this.showToast('Error al eliminar el pedido: ' + error.message, 'error');
        }
    }

    async changeOrderStatus(orderId) {
        const order = this.orders.find(o => o._id === orderId);
        if (!order) return;

        const statusMap = {
            'pendiente': 'confirmado',
            'confirmado': 'en_preparacion',
            'en_preparacion': 'listo',
            'listo': 'entregado',
            'entregado': 'pendiente'
        };

        const newStatus = statusMap[order.status] || 'pendiente';

        try {
            const response = await fetch(`${this.apiBaseUrl}/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showToast('Estado actualizado exitosamente', 'success');
                this.loadOrders();
            } else {
                throw new Error(data.message || 'Error al cambiar el estado');
            }
        } catch (error) {
            console.error('Error cambiando estado:', error);
            this.showToast('Error al cambiar el estado: ' + error.message, 'error');
        }
    }

    editOrder(orderId) {
        const order = this.orders.find(o => o._id === orderId);
        if (!order) return;

        this.editingOrderId = orderId;
        
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
        order.items.forEach((item, index) => {
            this.addItemRow();
            const itemRow = itemsList.children[index];
            itemRow.querySelector('.product-input').value = item.product;
            itemRow.querySelector('.quantity-input').value = item.quantity;
            itemRow.querySelector('.price-input').value = item.price || '';
        });

        // Cambiar texto del botón
        const submitBtn = document.querySelector('#orderForm button[type="submit"]');
        submitBtn.innerHTML = '<span class="material-icons mr-2">edit</span>Actualizar Pedido';

        // Scroll al formulario
        document.getElementById('orderForm').scrollIntoView({ behavior: 'smooth' });
        
        this.showToast('Editando pedido. Modifica los campos y guarda los cambios.', 'info');
    }

    clearForm() {
        document.getElementById('orderForm').reset();
        this.editingOrderId = null;
        
        // Limpiar items excepto el primero
        const itemsList = document.getElementById('itemsList');
        while (itemsList.children.length > 1) {
            itemsList.removeChild(itemsList.lastChild);
        }

        // Limpiar valores del primer item
        const firstItem = itemsList.children[0];
        firstItem.querySelector('.product-input').value = '';
        firstItem.querySelector('.quantity-input').value = '';
        firstItem.querySelector('.price-input').value = '';

        // Restaurar texto del botón
        const submitBtn = document.querySelector('#orderForm button[type="submit"]');
        submitBtn.innerHTML = '<span class="material-icons mr-2">save</span>Guardar Pedido';

        // Restablecer fecha mínima
        this.setMinDeliveryDate();
    }

    renderOrders() {
        const container = document.getElementById('ordersList');
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;

        let filteredOrders = this.orders;

        // Filtrar por estado
        if (statusFilter !== 'all') {
            filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
        }

        // Filtrar por fecha
        if (dateFilter) {
            filteredOrders = filteredOrders.filter(order => order.deliveryDate === dateFilter);
        }

        // Ordenar por fecha de entrega y hora
        filteredOrders.sort((a, b) => {
            try {
                const dateA = new Date(`${a.deliveryDate}T${a.deliveryTime || '00:00'}`);
                const dateB = new Date(`${b.deliveryDate}T${b.deliveryTime || '00:00'}`);
                
                // Si alguna fecha es inválida, ponerla al final
                if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
                if (isNaN(dateA.getTime())) return 1;
                if (isNaN(dateB.getTime())) return -1;
                
                return dateA - dateB;
            } catch (error) {
                console.error('Error ordenando fechas:', error);
                return 0;
            }
        });

        if (filteredOrders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <span class="material-icons text-gray-400 text-6xl mb-4 block">receipt_long</span>
                    <p class="text-gray-500 text-lg">No hay pedidos que mostrar</p>
                    <p class="text-gray-400 text-sm mt-2">Los pedidos aparecerán aquí una vez que los agregues</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredOrders.map(order => this.createOrderCard(order)).join('');
    }

    createOrderCard(order) {
        const statusConfig = {
            'pendiente': { class: 'bg-yellow-100 text-yellow-800', text: 'Pendiente', icon: 'schedule' },
            'confirmado': { class: 'bg-blue-100 text-blue-800', text: 'Confirmado', icon: 'check_circle' },
            'en_preparacion': { class: 'bg-orange-100 text-orange-800', text: 'En Preparación', icon: 'restaurant' },
            'listo': { class: 'bg-purple-100 text-purple-800', text: 'Listo', icon: 'done_all' },
            'entregado': { class: 'bg-green-100 text-green-800', text: 'Entregado', icon: 'local_shipping' }
        };

        const status = statusConfig[order.status] || statusConfig['pendiente'];
        
        // Formatear fecha y hora de manera segura
        let formattedDate = 'Fecha no válida';
        let formattedTime = 'Hora no válida';
        
        if (order.deliveryDate && order.deliveryTime) {
            try {
                const deliveryDateTime = new Date(`${order.deliveryDate}T${order.deliveryTime}`);
                
                if (!isNaN(deliveryDateTime.getTime())) {
                    formattedDate = deliveryDateTime.toLocaleDateString('es-ES', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    formattedTime = deliveryDateTime.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } else {
                    // Fallback: formatear fecha y hora por separado
                    if (order.deliveryDate) {
                        const dateOnly = new Date(order.deliveryDate + 'T00:00:00');
                        if (!isNaN(dateOnly.getTime())) {
                            formattedDate = dateOnly.toLocaleDateString('es-ES', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            });
                        }
                    }
                    if (order.deliveryTime) {
                        formattedTime = order.deliveryTime;
                    }
                }
            } catch (error) {
                console.error('Error formateando fecha:', error);
                // Usar valores fallback
                formattedDate = order.deliveryDate || 'Sin fecha';
                formattedTime = order.deliveryTime || 'Sin hora';
            }
        }

        const itemsHtml = order.items.map(item => `
            <div class="flex justify-between items-center text-sm">
                <span class="text-gray-600">${item.product}</span>
                <div class="text-right">
                    <div class="text-gray-500">${item.quantity}</div>
                    ${item.price ? `<div class="text-green-600 font-medium">${item.price}</div>` : ''}
                </div>
            </div>
        `).join('');

        return `
            <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800 mb-1">${order.customerName}</h3>
                        ${order.customerPhone ? `<p class="text-gray-600 text-sm">${order.customerPhone}</p>` : ''}
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-medium ${status.class} flex items-center">
                        <span class="material-icons text-sm mr-1">${status.icon}</span>
                        ${status.text}
                    </span>
                </div>

                <div class="mb-4">
                    <div class="flex items-center text-gray-600 mb-2">
                        <span class="material-icons text-lg mr-2">schedule</span>
                        <span class="font-medium">${formattedDate} - ${formattedTime}</span>
                    </div>
                </div>

                <div class="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                        <span class="material-icons text-lg mr-2">shopping_cart</span>
                        Productos
                    </h4>
                    <div class="space-y-2">
                        ${itemsHtml}
                    </div>
                    ${order.totalAmount ? `
                        <div class="border-t border-gray-200 mt-3 pt-3">
                            <div class="flex justify-between items-center font-bold text-lg">
                                <span>Total:</span>
                                <span class="text-green-600">${order.totalAmount}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>

                ${order.notes ? `
                    <div class="bg-blue-50 rounded-lg p-3 mb-4">
                        <h4 class="font-semibold text-gray-800 mb-1 flex items-center">
                            <span class="material-icons text-sm mr-1">note</span>
                            Notas
                        </h4>
                        <p class="text-gray-700 text-sm">${order.notes}</p>
                    </div>
                ` : ''}

                <div class="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                    <button class="status-btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center" 
                            data-order-id="${order._id}">
                        <span class="material-icons text-sm mr-1">sync</span>
                        Cambiar Estado
                    </button>
                    <button class="edit-btn bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center" 
                            data-order-id="${order._id}">
                        <span class="material-icons text-sm mr-1">edit</span>
                        Editar
                    </button>
                    <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center" 
                            data-order-id="${order._id}">
                        <span class="material-icons text-sm mr-1">delete</span>
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    }

    showToast(message, type = 'info') {
        // Remover toast existente si hay uno
        const existingToast = document.getElementById('toast');
        if (existingToast) {
            existingToast.remove();
        }

        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };

        const toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center max-w-sm transform translate-x-full transition-transform duration-300`;
        toast.innerHTML = `
            <span class="material-icons mr-3">${icons[type]}</span>
            <span class="flex-1">${message}</span>
            <button onclick="this.parentElement.remove()" class="ml-4 hover:opacity-70">
                <span class="material-icons">close</span>
            </button>
        `;

        document.body.appendChild(toast);

        // Animar entrada
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('translate-x-full');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new OrderManager();
});
