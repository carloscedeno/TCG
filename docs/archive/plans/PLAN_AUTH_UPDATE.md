# Plan de Actualización de Autenticación

Este plan detalla los pasos para actualizar el sistema de login, eliminando GitHub e integrando Google, Discord y Microsoft (Outlook), además de implementar la recuperación de contraseña.

## 1. Configuración de Supabase (Requisito Previo)

**El usuario debe realizar esto en el Dashboard de Supabase:**

1. **Google**: Crear credenciales en Google Cloud Console y configurar el proveedor Google en Authentication > Providers.
2. **Discord**: Crear una aplicación en Discord Developer Portal y configurar el proveedor Discord.
3. **Microsoft (Outlook)**: Crear una aplicación en Azure Portal y configurar el proveedor Azure/Microsoft.
4. **URL de Redirección**: Asegurarse que la URL del sitio (ej. `http://localhost:5173` para local) está en la lista de "Redirect URLs" en Supabase.

## 2. Modificaciones Frontend

### A. Actualizar `AuthModal.tsx`

El modal actual de autenticación será rediseñado.

1. **Eliminar GitHub**: Remover el botón y lógica existente de GitHub.
2. **Nuevos Proveedores Sociales**:
    * Agregar botones para **Google**, **Discord** y **Microsoft**.
    * Implementar la función de login social usando `supabase.auth.signInWithOAuth`.
    * Usar iconos apropiados (SVG o librerías).
3. **Recuperación de Contraseña (Forgot Password)**:
    * Agregar un enlace "¿Olvidaste tu contraseña?" en el formulario de login.
    * Crear una nueva vista/estado dentro del modal: `forgot-password`.
    * Implementar formulario simple (solo email) que llame a `supabase.auth.resetPasswordForEmail`.

### B. Funcionalidad de Reset de Contraseña

Una vez que el usuario recibe el correo y hace clic, necesita una página para ingresar la nueva contraseña.

1. **Crear Página `UpdatePassword.tsx`**:
    * Ruta: `/update-password` (o similar).
    * Formulario para ingresar nueva contraseña.
    * Uso de `supabase.auth.updateUser({ password: newPassword })`.
2. **Configurar Rutas**:
    * Actualizar `App.tsx` para incluir la nueva ruta.

## 3. Pasos de Ejecución Sugeridos

1. **Modificar `AuthModal.tsx`**: Implementar los cambios visuales y la lógica de proveedores sociales.
2. **Implementar Lógica "Olvidé mi contraseña"**: Agregar la vista en el modal y la llamada a la API.
3. **Crear Página de Actualización**: Crear `src/pages/UpdatePassword.tsx` y configurar el router.

## 4. Detalles de Implementación (Snippet)

```typescript
// Ejemplo de llamada social
const handleSocialLogin = async (provider: 'google' | 'discord' | 'azure') => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: window.location.origin
        }
    });
    if (error) console.error(error);
}
```
