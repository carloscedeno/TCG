---
description: Flujo de finalización — Auditoría, Compound y Push en un solo paso
---

# /finalize — Cierre de Sesión

Este workflow combina verificación, documentación y sincronización para cerrar la sesión de trabajo de forma segura y eficiente.

```text
Plan → Work → Review → [FINALIZE ← estás aquí]
```

---

## 🚀 Quick Run (Modo Turbo)

Para ejecutar la auditoría crítica y el push final en una sola pasada:

// turbo

```powershell
cd frontend; npm run build 2>&1; cd ..; git status; python -m pytest tests/unit/ -q 2>&1; python check_api_health.py 2>&1; git push
```

---

## Pasos Detallados

### 1. Auditoría de Integridad

Verificar que el sistema esté en buen estado antes de sincronizar:

- [ ] **Build frontend**: `npm run build` en `/frontend`
- [ ] **Git status**: Confirmar que no hay archivos sueltos
- [ ] **Tests**: `python -m pytest tests/unit/ -q`
- [ ] **API Health**: `python check_api_health.py`

### 2. Compound (Codificar Conocimiento)

No dejes que el aprendizaje se pierda en el historial:

- [ ] **Lecciones**: ¿Algo nuevo para `.agent/lessons_learned.md`?
- [ ] **Reglas**: ¿Actualizar `LEYES_DEL_SISTEMA.md`?
- [ ] **Estado**: Actualizar `PROGRESS.md` y `.agent/AGENTS.md`.
- [ ] **Registro**: Crear entrada en `.agent/COMPOUND.md` explicando qué se hizo.

### 3. Sincronización Final

Una vez que todo está verificado y documentado:

- [ ] **Commit**: Asegurar que el mensaje de commit sea descriptivo (ej: `🧠 compound: [tema]`).
- [ ] **Push**: Subir los cambios al repositorio remoto.

---

> [!IMPORTANT]
> Si la auditoría inicial falla, **corrige los errores** antes de proceder al Compound o Push.
