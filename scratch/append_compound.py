import os
import datetime

date_str = datetime.datetime.now().strftime("%Y-%m-%d")

lesson_text = f"""
### Filtros de Rango UX y Valores Cero — {date_str}
- **Problema:** El filtro de precios forzaba valores por defecto (ej. 1000000) impidiendo que el usuario vaciara el input. Además, el backend ignoraba la búsqueda por el valor `0` absoluto.
- **Causa Raíz:** Inicialización estricta sin admitir `undefined` en el estado de React. En API, la validación `precio || null` fallaba para el número 0 al ser falsy.
- **Solución:** Utilizar `undefined` en el estado local para inputs vacíos, y reemplazar `|| null` por validación estricta `!== undefined ? valor : null` en llamadas a la API.
- **Regla Derivada:** Las variables de estado para filtros numéricos opcionales deben soportar `undefined`. Validaciones hacia el backend deben usar validación estricta explícita `!== undefined`, nunca el operador lógico `||` para números que pueden ser válidamente cero.
"""

compound_text = f"""
## {date_str} — Filtros de Precios y UX

**Qué pasó:** Se arregló un bug en la UX del filtro de precios de la vista principal que impedía dejar los campos en blanco y evaluar precios en 0.
**Lo que cambió:**
- `frontend/src/pages/Home.tsx` → Permitir `undefined` en el estado del rango de precios.
- `frontend/src/utils/api.ts` → Refactor de `params.price || null` a validación estricta `!== undefined`.
- `lessons_learned.md` → Lección añadida sobre estado de variables numéricas opcionales.
"""

with open(".agent/lessons_learned.md", "a", encoding="utf-8") as f:
    f.write(lesson_text)

with open(".agent/COMPOUND.md", "a", encoding="utf-8") as f:
    f.write(compound_text)
