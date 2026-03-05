# Guía de Despliegue en Producción (SMTP y Secretos)

Este documento detalla el procedimiento para configurar correctamente el sistema de notificaciones por correo y la gestión de secretos en el entorno de producción.

## 🔴 Regla de Oro (Ley 7)

**NUNCA** guarde contraseñas reales o secretos en archivos `.env` en el servidor de producción. El sistema está configurado para fallar si detecta secretos hardcodeados en modo `production`.

## 1. Configuración de Variables de Entorno

En producción, las siguientes variables **DEBEN** ser configuradas como variables de entorno del sistema (o mediante el panel de control del host/orquestador):

- `ENVIRONMENT`: Debe ser `production`.
- `SMTP_PASSWORD`: La contraseña de la cuenta de correo.
- `SMTP_USER`: (Opcional, puede ir en `.env` si no es secreto).
- `SMTP_SERVER`: (Opcional, puede ir en `.env`).
- `SMTP_PORT`: (Opcional, puede ir en `.env`).

## 2. Archivo `.env` en Producción

El archivo `.env` en producción solo debe contener configuraciones no sensibles. Use placeholders para los secretos:

```bash
# .env (PROD)
ENVIRONMENT=production
SMTP_SERVER=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=notificaciones@tusitiotcg.com
SMTP_PASSWORD=SET_ME_VIA_ENV_VAR
```

## 3. Validación de Seguridad

El backend realiza una validación al inicio. Si `ENVIRONMENT=production` y `SMTP_PASSWORD` coincide con el placeholder o está vacío, el servicio lanzará un `RuntimeError` y no iniciará, evitando despliegues inseguros.

## 4. Pruebas de Conectividad

Para verificar la configuración en producción sin realizar una compra real:

```bash
python scripts/test_smtp.py
```

(Asegúrese de que el script no imprima el secreto en los logs).
