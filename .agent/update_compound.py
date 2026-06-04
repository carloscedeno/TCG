import os

lesson = """### 160. Mitigación de Vulnerabilidades en npm y Scripts de Build (Junio 2026)
- **Problema**: Riesgo de ataques de cadena de suministro (supply chain attacks) asociados a la ejecución automática de scripts en `npm install`.
- **Causa Raíz**: `npm` permite la ejecución de scripts de ciclo de vida (`postinstall`) sin confirmación explícita. Además, dependencias transitivas mal declaradas pueden fallar bajo resolución estricta.
- **Solución**: 
  1. Migrar a `pnpm` y usar `pnpm approve-builds` para autorizar scripts explícitamente (`[ERR_PNPM_IGNORED_BUILDS]`).
  2. Al migrar a `pnpm` (que usa symlinks estrictos), paquetes con dependencias peer ocultas como `vite-plugin-pwa` (que requiere `workbox-window`) fallarán en build. Se deben instalar explícitamente (`pnpm add workbox-window`).
- **Regla Derivada**: Prohibido usar `npm`. Toda dependencia se maneja con `pnpm`.

"""

try:
    with open('.agent/lessons_learned.md', 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.startswith('### 1.'):
            lines.insert(i, lesson)
            break
    else:
        lines.insert(10, lesson)

    with open('.agent/lessons_learned.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print("Updated lessons_learned.md")
except Exception as e:
    print(f"Error updating lessons_learned.md: {e}")

compound = f"""# 🧠 COMPOUND: Migración a pnpm y Aislamiento de Entorno (Junio 2026)

**Date**: 2026-06-04 18:00

## Objective
Erradicar el uso de `npm` para mitigar vulnerabilidades de cadena de suministro y aislar scripts de ciclo de vida.

## Knowledge Codification

### 1. Migración de Gestor de Paquetes (npm -> pnpm)
- **Feature**: Reemplazo de `package-lock.json` por `pnpm-lock.yaml`, y actualización de `deploy.yml`.
- **Lesson 1**: `pnpm` previene ejecución arbitraria de scripts maliciosos, pero requiere `pnpm approve-builds`.
- **Lesson 2**: `pnpm` revela dependencias peer faltantes que `npm` ocultaba (ej. `workbox-window` requerido por `vite-plugin-pwa`), obligando a instalarlas explícitamente para el build.
- **Lesson 3**: GitHub Actions necesita `uses: pnpm/action-setup@v4` antes de instalar dependencias.

## Technical Validation
- **CI/CD**: `deploy.yml` actualizado y merge a `main` exitoso.
- **Frontend**: Servidor Vite y build (`workbox-window` agregado) funcionando bajo `pnpm`.
- **Scripts**: Sincronizadores auditados y seguros.

---

"""

try:
    with open('.agent/COMPOUND.md', 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    with open('.agent/COMPOUND.md', 'w', encoding='utf-8') as f:
        f.write(compound + content)
    print("Updated COMPOUND.md")
except Exception as e:
    print(f"Error updating COMPOUND.md: {e}")
