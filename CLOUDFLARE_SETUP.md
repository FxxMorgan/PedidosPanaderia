# Guía de Configuración para Cloudflare Tunnel

## 1. Instalar Cloudflared

```bash
# Windows
winget install --id Cloudflare.cloudflared

# O descargar desde: https://github.com/cloudflare/cloudflared/releases
```

## 2. Iniciar Tunnel

```bash
# Navegar al directorio del proyecto
cd "e:\Users\Feer\Programacion\panaderia\Pedidos"

# Iniciar servidor local
npm run dev

# En otra terminal, crear tunnel
cloudflared tunnel --url http://localhost:3000
```

## 3. Configuración adicional para producción

Si quieres un tunnel permanente:

```bash
# Autenticar con Cloudflare
cloudflared tunnel login

# Crear tunnel con nombre
cloudflared tunnel create panaderia-pedidos

# Configurar tunnel
cloudflared tunnel route dns panaderia-pedidos tu-subdominio.tudominio.com

# Crear archivo de configuración
# Archivo: config.yml
tunnel: panaderia-pedidos
credentials-file: /path/to/credentials/file.json

ingress:
  - hostname: tu-subdominio.tudominio.com
    service: http://localhost:3000
  - service: http_status:404

# Ejecutar tunnel
cloudflared tunnel run panaderia-pedidos
```

## 4. Variables de entorno para producción

Actualiza tu `.env` con:

```env
NODE_ENV=production
ALLOWED_ORIGINS=https://tu-subdominio.tudominio.com,https://*.trycloudflare.com
```

## 5. Características habilitadas

✅ CORS permisivo para dominios .trycloudflare.com
✅ CSP configurado para permitir Tailwind CDN
✅ Headers adicionales para compatibilidad
✅ Soporte para preflight OPTIONS requests
✅ Modo offline como fallback

## 6. Pruebas

1. Inicia el servidor: `npm run dev`
2. Crea tunnel: `cloudflared tunnel --url http://localhost:3000`
3. Accede via la URL de Cloudflare proporcionada
4. Prueba crear, editar y eliminar pedidos
5. Verifica sincronización entre dispositivos

## 7. Solución de problemas

### Errores CORS
- Los patrones de Cloudflare están pre-configurados
- El servidor acepta cualquier subdominio .trycloudflare.com

### CSP Errors
- Tailwind CDN está permitido en la política
- Scripts inline están habilitados para configuración

### Connection Issues
- El modo offline está habilitado como fallback
- Los datos se guardan localmente si el servidor no está disponible
