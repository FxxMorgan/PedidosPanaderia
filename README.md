# Sistema de Pedidos para Panadería

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PM2](https://img.shields.io/badge/PM2-Ready-red.svg)](https://pm2.keymetrics.io/)

Sistema profesional de gestión de pedidos desarrollado con **Node.js**, **Express**, **MongoDB Atlas** y **PM2** para manejo de procesos en producción.

## Características Principales

- **Interfaz Responsiva**: Diseño moderno con Tailwind CSS
- **Base de Datos en la Nube**: MongoDB Atlas para almacenamiento escalable
- **API REST Completa**: Endpoints para CRUD de pedidos con validación
- **Sincronización en Tiempo Real**: Actualizaciones automáticas entre dispositivos
- **Seguridad Robusta**: Helmet, CORS, Rate Limiting y validación de datos
- **Gestión de Procesos**: PM2 para producción con logs y monitoreo
- **Experiencia de Usuario Optimizada**: Interfaz intuitiva con notificaciones y filtros

## Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de Datos**: MongoDB Atlas
- **Frontend**: HTML5, JavaScript ES6+, Tailwind CSS
- **Gestión de Procesos**: PM2
- **Seguridad**: Helmet, CORS, express-validator
- **Herramientas**: nodemon, compression, morgan

## Instalación y Configuración

### Requisitos Previos

- Node.js 18.0.0 o superior
- npm 8.0.0 o superior
- Cuenta en MongoDB Atlas

### 1. Clonar y Configurar Dependencias

```bash
git clone https://github.com/FxxMorgan/PedidosPanaderia.git
cd PedidosPanaderia
npm install
```

### 2. Configurar MongoDB Atlas

1. Crea una cuenta en [MongoDB Atlas](https://cloud.mongodb.com/)
2. Crea un nuevo cluster
3. Configura acceso de red (0.0.0.0/0 para desarrollo)
4. Crea un usuario de base de datos
5. Obtén tu cadena de conexión

### 3. Configurar Variables de Entorno

Copia `.env.example` a `.env` y configura:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/panaderia?retryWrites=true&w=majority
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

### 5. Ejecutar en Producción con PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
npm start

# Ver logs
npm run logs

# Monitorear procesos
npm run monit

# Detener aplicación
npm stop
```

## Comandos PM2 Disponibles

```bash
npm start          # Iniciar aplicación con PM2
npm stop           # Detener aplicación
npm run restart    # Reiniciar aplicación
npm run delete     # Eliminar proceso de PM2
npm run logs       # Ver logs en tiempo real
npm run monit      # Monitor de recursos
npm run status     # Estado de procesos
```

## API Endpoints

### Pedidos

- `GET /api/orders` - Obtener todos los pedidos (con paginación y filtros)
- `POST /api/orders` - Crear nuevo pedido
- `GET /api/orders/:id` - Obtener pedido específico
- `PUT /api/orders/:id` - Actualizar pedido completo
- `PATCH /api/orders/:id/status` - Cambiar solo el estado
- `DELETE /api/orders/:id` - Eliminar pedido

### Salud del Sistema

- `GET /api/health` - Estado del servidor

### Ejemplos de Uso

**Crear Pedido:**
```json
POST /api/orders
{
  "customerName": "Juan Pérez",
  "customerPhone": "+56912345678",
  "deliveryDate": "2024-01-15",
  "deliveryTime": "14:30",
  "items": [
    {
      "product": "Empanadas napolitana",
      "quantity": "12 unidades",
      "price": "$6000"
    }
  ],
  "notes": "Sin cebolla",
  "totalAmount": "$6000"
}
```

## Estados de Pedidos

1. **Pendiente** - Recién creado
2. **Confirmado** - Cliente confirmó el pedido
3. **En Preparación** - Siendo preparado
4. **Listo** - Listo para entregar
5. **Entregado** - Completado

## Funcionalidades de la Interfaz

### Formulario de Pedidos
- Información del cliente (nombre, teléfono)
- Fecha y hora de entrega
- Lista dinámica de productos
- Notas especiales
- Total estimado

### Gestión de Pedidos
- Lista en tiempo real
- Filtros por estado y fecha
- Cambio rápido de estados
- Edición en línea
- Eliminación con confirmación

### Características UX
- Notificaciones toast en tiempo real
- Validación de formularios instantánea
- Sincronización automática de datos
- Indicador de estado de conexión
- Diseño totalmente responsivo
- Modo offline con sincronización posterior

## Arquitectura del Sistema

### Backend Architecture
- **Servidor**: Express.js con middleware de seguridad
- **Base de Datos**: MongoDB Atlas con esquemas Mongoose
- **API**: RESTful con validación de datos
- **Procesos**: PM2 para gestión y monitoreo

### Frontend Architecture
- **SPA**: Single Page Application vanilla JavaScript
- **CSS Framework**: Tailwind CSS para estilos
- **State Management**: Local storage con sincronización
- **HTTP Client**: Fetch API con manejo de errores

## Performance y Escalabilidad

- **Compresión**: Middleware de compresión gzip
- **Logs**: Sistema de logging con Morgan
- **Rate Limiting**: Protección contra ataques DDoS
- **Índices de Base de Datos**: Optimización de consultas MongoDB
- **Caching**: Headers de cache para recursos estáticos

## Seguridad

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Control de origen cruzado
- **Rate Limiting**: Limitación de solicitudes
- **Validación**: express-validator para datos
- **Variables de Entorno**: Configuración segura

## Estructura del Proyecto

```
PedidosPanaderia/
├── config/
│   └── database.js          # Configuración MongoDB
├── middleware/
│   └── index.js             # Middlewares personalizados
├── models/
│   └── Order.js             # Modelo de datos Mongoose
├── routes/
│   └── orders.js            # Rutas API REST
├── public/
│   ├── index.html           # Frontend SPA
│   └── script.js            # JavaScript del cliente
├── ecosystem.config.js      # Configuración PM2
├── server.js                # Servidor principal Express
├── package.json             # Dependencias y scripts
├── .env.example             # Variables de entorno ejemplo
└── README.md                # Documentación
```

## Despliegue en Producción

### Preparación
1. Configurar `NODE_ENV=production` en `.env`
2. Actualizar `ALLOWED_ORIGINS` con tu dominio
3. Configurar MongoDB Atlas para producción

### Con PM2
```bash
npm install -g pm2
npm start
pm2 startup  # Configurar inicio automático
pm2 save     # Guardar configuración
```

### Variables de Entorno de Producción
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=tu_uri_de_produccion
ALLOWED_ORIGINS=https://tudominio.com
```

## Solución de Problemas

### Error de Conexión MongoDB
- Verifica la cadena de conexión
- Revisa configuración de red en Atlas
- Confirma credenciales de usuario

### Puerto en Uso
```bash
# Windows
netstat -ano | findstr :3000
# Cambiar puerto en .env si es necesario
```

### Logs de PM2
```bash
npm run logs        # Ver logs
pm2 logs --lines 50 # Ver últimas 50 líneas
```

## Actualizaciones y Mantenimiento

Para actualizar el sistema:

```bash
git pull origin main
npm install
npm run restart
```

## Soporte y Contribución

Para reportar problemas o solicitar características:

1. **Diagnóstico**: Revisa los logs con `npm run logs`
2. **Verificación**: Comprueba conectividad API en `/api/health`
3. **Documentación**: Consulta la documentación de MongoDB Atlas
4. **Issues**: Crea un issue en el repositorio de GitHub

### Contribuir al Proyecto

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Autor

**FxxMorgan** - [GitHub](https://github.com/FxxMorgan)

---

*Desarrollado para gestión eficiente de pedidos de panadería con tecnologías modernas y escalables.*
