# Sistema de Pedidos para Panadería

Un sistema web estático para gestionar pedidos de panadería con sincronización entre dispositivos usando GitHub Gist.

## Características

- **Gestión completa de pedidos**: Crear, editar, actualizar estado y eliminar pedidos
- **Campos flexibles**: Productos, cantidades/peso y precios como texto libre para máxima flexibilidad
- **Productos específicos**: Orientado a productos de panadería chilena (empanadas, pan choripan, etc.)
- **Persistencia local**: Los datos se guardan en localStorage del navegador
- **Sincronización entre dispositivos**: Usando GitHub Gist API para compartir datos
- **Interfaz completamente responsive**: Optimizada con Tailwind CSS y Material Design
- **Filtros avanzados**: Por estado y fecha de entrega
- **Estados de pedido**: Pendiente, En Proceso, Completado, Cancelado

## Funcionalidades

### Gestión de Pedidos
- Registrar nuevos pedidos con información del cliente
- Múltiples productos por pedido con campos de texto libre
- Fechas y horarios de entrega
- Notas y observaciones especiales
- Total estimado opcional

### Productos Comunes Incluidos
- Empanadas napolitana
- Empanadas pino  
- Mini copihues
- Pan choripan
- Pan francés
- Masa empanada frita
- Masa de horno

### Campos Flexibles
- **Producto**: Campo de texto libre para especificar cualquier producto
- **Cantidad/Peso**: Texto libre (ej: "12 unidades", "2 kg", "1 docena")
- **Precio**: Texto libre (ej: "$5000", "5000 pesos", "gratis")
- **Total**: Campo opcional para total estimado

### Sincronización
- Configuración de GitHub Personal Access Token
- Sincronización automática entre dispositivos
- Resolución de conflictos por timestamp
- Backup en la nube vía GitHub Gist

### Filtros y Búsqueda
- Filtrar por estado del pedido
- Filtrar por fecha de entrega
- Ordenación automática por fecha/hora

## Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **Tailwind CSS**: Framework CSS para diseño responsive
- **Material Icons**: Iconografía consistente
- **JavaScript ES6+**: Lógica de aplicación
- **GitHub Gist API**: Sincronización de datos
- **LocalStorage**: Persistencia local

## Configuración

### 1. Configuración Básica
1. Abrir `index.html` en cualquier navegador
2. El sistema funciona inmediatamente con almacenamiento local

### 2. Configuración de Sincronización (Opcional)
1. Crear un GitHub Personal Access Token:
   - Ir a GitHub → Settings → Developer settings → Personal access tokens
   - Crear token con scope "gist"
2. Hacer clic en el botón de configuración (⚙️)
3. Ingresar el token de GitHub
4. Los datos se sincronizarán automáticamente

### 3. Despliegue en GitHub Pages
1. Subir los archivos a un repositorio de GitHub
2. Habilitar GitHub Pages en la configuración del repositorio
3. La aplicación estará disponible en `https://username.github.io/repository-name`

## Estructura de Archivos

```
Pedidos/
├── index.html          # Página principal
├── script.js           # Lógica JavaScript
└── README.md           # Documentación
```

## Diseño Responsive

### Desktop (1200px+)
- Layout de dos columnas: formulario y lista de pedidos
- Grid de productos optimizado
- Máximo aprovechamiento del espacio

### Tablet (768px - 1199px)
- Layout adaptativo de una columna
- Campos organizados en grids responsivos
- Navegación optimizada para touch

### Mobile (320px - 767px)
- Layout completamente vertical
- Campos apilados para fácil interacción
- Botones de tamaño apropiado para dedos

## Personalización

### Productos
Editar la lista de productos comunes en `index.html`:
```html
<span class="bg-amber-50 text-amber-800 px-3 py-2 rounded-lg text-sm font-medium border border-amber-200">Tu Producto</span>
```

### Colores y Tema
Modificar las clases de Tailwind CSS en `index.html`:
- Colores primarios: `bg-blue-500`, `text-blue-600`
- Colores de estado: `bg-green-100`, `bg-red-100`, etc.
- Espaciado y tipografía: `p-4`, `text-lg`, etc.

### Estados de Pedido
Personalizar en `script.js`:
```javascript
const statusMap = {
    'pendiente': 'Pendiente',
    'en_proceso': 'En Proceso',
    'completado': 'Completado',
    'cancelado': 'Cancelado'
};
```

## Seguridad

- Los datos se almacenan localmente en el navegador
- La sincronización usa GitHub Gist privado
- El token de GitHub se guarda solo en localStorage
- No hay servidor backend, todo es estático

## Uso en Dispositivos Móviles

- Interfaz optimizada para pantallas pequeñas
- Formularios táctiles amigables
- Navegación simplificada con gestos
- Carga rápida en conexiones lentas
- Iconos Material Design para claridad

## Sincronización

### Funcionamiento
1. Los datos se guardan primero localmente
2. Si hay token configurado, se sincronizan automáticamente
3. Al cargar la página, se descargan datos remotos
4. Se resuelven conflictos por timestamp (el más reciente gana)

### Resolución de Conflictos
- Los pedidos se comparan por ID único
- El timestamp `updatedAt` determina la versión más reciente
- Los datos locales se combinan con los remotos sin pérdidas

## Estados de Pedido

1. **Pendiente**: Pedido recién creado
2. **En Proceso**: Se está preparando el pedido
3. **Completado**: Pedido entregado al cliente
4. **Cancelado**: Pedido cancelado

## Solución de Problemas

### Sincronización no funciona
- Verificar que el token de GitHub sea válido
- Verificar que el token tenga permisos de "gist"
- Revisar la consola del navegador para errores

### Datos perdidos
- Los datos están en localStorage del navegador
- Si se limpia el navegador, se pierden los datos locales
- La sincronización permite recuperar desde GitHub Gist

### Problemas de responsive
- Verificar que el viewport meta tag esté presente
- Los estilos de Tailwind están optimizados para móviles primero

## Mejoras Futuras

- Exportar pedidos a PDF
- Notificaciones push de recordatorio
- Calendario visual de entregas
- Estadísticas y reportes
- Múltiples sucursales
- Inventario integrado
- Modo offline completo

## Licencia

Este proyecto es de código abierto. Puedes usarlo, modificarlo y distribuirlo libremente.

## Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

Perfecto para pequeñas panaderías que necesitan un sistema simple y efectivo.
