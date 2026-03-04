---
description: Auditoría post-ejecución — verificar integridad del sistema después de cada sesión de trabajo
---

# /audit — Auditoría Post-Ejecución

Ejecutar este workflow **inmediatamente después de completar cualquier tarea** para garantizar que el sistema quedó en un estado consistente, seguro y bien documentado.

```text
Plan → Work → Review → [AUDIT ← estás aquí] → Compound
```

> Nota: `/audit` va **antes** de `/compound`. Primero verificas integridad, luego codificas lo aprendido.

---

## Checklist de Auditoría

### 🔴 CRÍTICO (bloquea el compound si falla)

- [ ] **Build frontend**: `npm run build` en `/frontend` — sin errores TS
- [ ] **Git status limpio**: No hay archivos modificados sin commitear

  ```powershell
  git status
  ```

- [ ] **Tests básicos pasan**:

  ```powershell
  python -m pytest tests/unit/ -q
  ```

  > Si falla por módulo no instalado: `pip install pytest pytest-asyncio` (ya está en `requirements.txt`)

- [ ] **Edge functions no rotas**: Si se modificó `supabase/functions/`, verificar que el deploy fue exitoso

---

### 🟡 IMPORTANTE (documentar si falla, no bloquea)

- [ ] **API health check**:

  ```powershell
  python check_api_health.py
  ```

- [ ] **Sin `any` implícito** en archivos `.tsx`/`.ts` modificados
- [ ] **Migraciones aplicadas**: Si se crearon archivos en `supabase/migrations/`, confirmar que están en producción
- [ ] **Variables de entorno**: Cualquier nueva variable local en `.env` tiene mirror en GitHub Secrets

---

### 🟢 BUENAS PRÁCTICAS (registrar en COMPOUND.md si aplica)

- [ ] **PRD actualizado**: Si una feature fue completada, marcar en `docs/PRD_MASTER.md`
- [ ] **PROGRESS.md actualizado**: Reflejar el estado actual del proyecto
- [ ] **AGENTS.md actualizado**: Features completadas movidas de `🚧 Pendientes` a `✅ Implementadas`
- [ ] **Incident report**: Si hubo un bug crítico, crear `docs/incident_reports/YYYY-MM-DD_[slug].md`

---

## Reporte de Auditoría

Al finalizar, generar un resumen breve:

```text
## Auditoría YYYY-MM-DD HH:MM

✅ Build: OK / ❌ FAIL
✅ Git: Limpio / ❌ Archivos sin commit
✅ Tests: N passed / ❌ N failed
✅ API Health: OK / ⚠️ Degraded

Acciones tomadas:
- [lista de problemas encontrados y cómo se resolvieron]

→ Listo para /compound
```

---

## Quick Run (modo turbo)

Para ejecutar el bloque crítico completo en una sola pasada:

// turbo

```powershell
cd frontend; npm run build 2>&1; cd ..; git status; python -m pytest tests/unit/ -q 2>&1; python check_api_health.py 2>&1
```
