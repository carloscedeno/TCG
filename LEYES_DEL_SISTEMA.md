# ⚖️ LEYES DEL SISTEMA - TCG Application

**Versión**: 2.1
**Última Actualización**: 2026-02-06
**Propósito**: Definir reglas inmutables para operación autónoma del agente

---

## 🔴 LEYES FUNDAMENTALES (Nunca Violar)

### Ley 1: Integridad de Datos

**Nunca** ejecutar comandos que puedan:

- Eliminar datos de producción sin backup
- Truncar tablas sin confirmación explícita
- Modificar esquemas de base de datos sin migration

**Excepciones**: Ninguna

---

### Ley 2: Deployment Seguro

**Siempre** seguir el checklist de deployment:

1. Verificar cambios locales (`git status`)
2. Commit con mensaje descriptivo
3. Push a GitHub
4. Desplegar Edge Functions si se modificaron
5. Verificar en producción

**Excepciones**: Ninguna

---

### Ley 3: Testing Obligatorio

**Siempre** ejecutar tests antes de deployment a producción.

**Comandos de Confianza** (Auto-aprobados, nunca requieren confirmación):

- `.\run_tests.ps1`
- `python -m pytest`
- `npm test`
- `python check_api_health.py`
- `python check_products_health.py`

**Excepciones**: Tests pueden omitirse en hotfixes críticos, pero deben ejecutarse inmediatamente después.

---

### Ley 4: Documentación Obligatoria

**Siempre** documentar:

- Cambios significativos en código
- Bugs encontrados y sus soluciones
- Decisiones de diseño importantes
- Sesiones de trabajo en `SESION_*.md`

**Excepciones**: Cambios triviales (typos, formatting)

---

### Ley 5: PRD como Source of Truth

**Siempre** consultar `PRD.md` antes de:

- Implementar nuevas features
- Modificar comportamiento existente
- Tomar decisiones de diseño

**Excepciones**: Bugfixes que no afectan funcionalidad

---

### Ley 6: Performance Garantizado (La Regla del Timeout)

**Siempre** validar que las consultas críticas respondan en <200ms.

- **Vistas Materializadas**: OBLIGATORIAS para consultas que involucren `DISTINCT ON` + `JOIN` + `ORDER BY` en tablas principales (>10k registros). No confiar en queries dinámicas complejas para la vista principal.
- **Indices**: OBLIGATORIO crear índices B-Tree o GIN para CADA columna usada en filtros o sorts ANTES de desplegar código que los use.
- **Timeouts**: Si una query da timeout (500), la solución NO es aumentar el timeout, es optimizar la query (generalmente pasando a Materialized View).
- **Almacenamiento Diferencial**: PROHIBIDO guardar snapshots diarios de datos que no cambian (ej. precios). Siempre implementar lógica de comparación en la ingesta para guardar solo el diferencial cronológico.

**Excepciones**: Consultas analíticas offline o scripts de migración manual.

---

## 🟡 REGLAS DE OPERACIÓN AUTÓNOMA

### Regla 1: Auto-Aprobación de Comandos Seguros

Los siguientes comandos **NUNCA** requieren aprobación del usuario:

#### Testing y Verificación

```powershell
.\run_tests.ps1
.\nightly.ps1
.\scripts\verify_deployment.ps1
python check_api_health.py
python check_products_health.py
python tests/verify_supabase_functions.py
pytest
npm test
```

#### Limpieza de Caches

```powershell
rm -rf .pytest_cache
rm -rf __pycache__
rm -rf node_modules/.cache
```

#### Consultas de Solo Lectura

```powershell
git status
git log
git diff
ls
cat <file>
```

#### Verificación de Conexiones

```powershell
Invoke-WebRequest -Method HEAD <url>
curl -I <url>
ping <host>
```

---

### Regla 2: Comandos que Requieren Aprobación

Los siguientes comandos **SIEMPRE** requieren aprobación:

#### Modificación de Datos

```sql
DELETE FROM ...
TRUNCATE TABLE ...
UPDATE ... (sin WHERE clause)
DROP TABLE ...
```

#### Deployment a Producción

```bash
git push origin main (si hay cambios críticos)
npx supabase functions deploy
npm run build && deploy
```

#### Instalación de Dependencias

```bash
npm install <package>
pip install <package>
```

---

### Regla 3: Modo Nightly Sync

Cuando se ejecuta `@[/nightly-sync]` o `.\nightly.ps1`:

- **Todos** los comandos del workflow son auto-aprobados
- El agente opera en modo 100% autónomo
- Se genera reporte completo al finalizar
- Se hace commit y push automático

---

### Regla 4: Manejo de Errores

Cuando un comando falla:

1. **Capturar** el error completo
2. **Documentar** en logs
3. **Intentar** solución automática si es seguro
4. **Reportar** al usuario si requiere intervención manual

---

## 🟢 MEJORES PRÁCTICAS

### Práctica 1: Commits Descriptivos

Formato de commits:

```
<type>: <description>

<body (opcional)>

<footer (opcional)>
```

Tipos válidos:

- `feat`: Nueva feature
- `fix`: Bugfix
- `docs`: Documentación
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Mantenimiento
- `🤖`: Commit autónomo del agente

---

### Práctica 2: Branches y Workflow

- `main`: Producción estable
- `develop`: Desarrollo activo
- `feature/*`: Nuevas features
- `hotfix/*`: Fixes urgentes

---

### Práctica 3: Code Review

Antes de merge a `main`:

1. Tests pasando
2. Documentación actualizada
3. PRD compliance verificado
4. Performance aceptable

---

## 📊 MÉTRICAS DE CALIDAD

### Métricas Obligatorias

- **Test Coverage**: >80%
- **API Response Time**: <500ms (p95)
- **Error Rate**: <1%
- **Deployment Success**: >95%

### Métricas Deseables

- **Test Coverage**: >90%
- **API Response Time**: <200ms (p95)
- **Error Rate**: <0.1%
- **Deployment Success**: >99%

---

## 🚨 PROTOCOLO DE EMERGENCIA

### En Caso de Producción Caída

1. **Rollback** inmediato al último commit estable
2. **Notificar** al usuario
3. **Documentar** el incidente
4. **Investigar** causa raíz
5. **Implementar** fix y tests
6. **Desplegar** con verificación extra

### En Caso de Pérdida de Datos

1. **DETENER** todas las operaciones
2. **Restaurar** desde backup más reciente
3. **Notificar** al usuario inmediatamente
4. **Documentar** el incidente
5. **Implementar** prevenciones

---

## 🔵 REGLAS DE NEGOCIO (TCG Specific)

### Regla 1: Precios de Geekorium

**Siempre** usar el precio de **Card Kingdom** para los ítems de **Geekorium**, a menos que un administrador especifique lo contrario explícitamente. Si el precio en inventario es 0, el sistema debe mostrar el precio de mercado automáticamente.

### Regla 2: Importación Ambigua

Al importar cartas sin edición (Set) específica, el sistema **siempre** debe priorizar la impresión con el **valor de mercado más alto**.

---

## 📝 CHANGELOG DE LEYES

### v2.3 (2026-02-12)

- ✅ Agregada Regla de Negocio 2: Priorización de valor más alto en importaciones ambiguas.
- ✅ Actualizada Regla de Negocio 1: Definición de Fallback de precios (Store -> Market).

### v2.2 (2026-02-08)

- ✅ Agregada Regla de Negocio 1: Sincronización de precios Geekorium con Card Kingdom.

### v2.1 (2026-02-06)

- ✅ Agregada Ley 6: Performance Garantizado (Uso obligatorio de Vistas Materializadas para queries masivas).

### v2.0 (2026-02-05)

- ✅ Agregada Ley 3: Testing Obligatorio con comandos auto-aprobados
- ✅ Agregada auto-aprobación de `.\run_tests.ps1`
- ✅ Agregada Regla 3: Modo Nightly Sync
- ✅ Documentado protocolo de emergencia

### v1.0 (2026-02-01)

- ✅ Leyes fundamentales establecidas
- ✅ Reglas de operación autónoma definidas
- ✅ Mejores prácticas documentadas

---

**Estas leyes son inmutables y deben ser respetadas en todo momento por el agente autónomo.**
