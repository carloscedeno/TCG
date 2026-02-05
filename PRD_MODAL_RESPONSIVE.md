# PRD - Fix Modal Responsive & Typography

**Versión**: 1.0  
**Fecha**: 2026-02-05  
**Prioridad**: 🔴 ALTA  
**Estimación**: 20-30 minutos

---

## 1. Problema

El modal de detalle de carta tiene problemas de responsividad:

### Issues Identificados

1. **Scroll excesivo**: El usuario debe hacer demasiado scroll para ver toda la información
2. **Tamaños de fuente inconsistentes**: No hay una jerarquía tipográfica clara y lógica
3. **Espaciado ineficiente**: Demasiado padding/margin que desperdicia espacio vertical
4. **Altura del modal**: No aprovecha bien el viewport disponible

### Impacto

- ❌ Mala experiencia de usuario
- ❌ Interfaz poco elegante
- ❌ Información importante requiere scroll

---

## 2. Solución Propuesta

### 2.1 Sistema Tipográfico Definido

Establecer una jerarquía clara y consistente:

```css
/* Card Title */
h2: text-2xl md:text-3xl (24px → 30px)
font-weight: 900 (black)
line-height: tight (1.25)

/* Card Type Line */
subtitle: text-sm md:text-base (14px → 16px)
font-weight: 600 (semibold)
opacity: 70%

/* Card Text / Oracle Text */
body: text-sm md:text-base (14px → 16px)
font-weight: 400 (normal)
line-height: relaxed (1.625)

/* Section Headers */
h3: text-xs uppercase (12px)
font-weight: 800 (extrabold)
letter-spacing: widest

/* Prices & Stats */
price: text-lg md:text-xl (18px → 20px)
font-weight: 700 (bold)

/* Labels & Metadata */
label: text-xs (12px)
font-weight: 600 (semibold)
opacity: 60%

/* Buttons */
button: text-xs uppercase (12px)
font-weight: 700 (bold)
letter-spacing: wide
```

### 2.2 Optimización de Espaciado

**Reducir padding/margin innecesario:**

```typescript
// ANTES (Excesivo)
padding: "p-8 md:p-12"
gap: "gap-8"
margin: "mb-8"

// DESPUÉS (Optimizado)
padding: "p-4 md:p-6"
gap: "gap-4"
margin: "mb-4"
```

### 2.3 Altura del Modal

**Maximizar uso del viewport:**

```typescript
// ANTES
max-h-[90vh]

// DESPUÉS
max-h-[95vh] // Más espacio vertical
overflow-y-auto // Scroll solo cuando sea necesario
```

### 2.4 Layout Responsivo

**Optimizar distribución de contenido:**

```typescript
// Desktop: Imagen a la izquierda, contenido a la derecha
grid-cols-1 lg:grid-cols-[400px_1fr]

// Mobile: Stack vertical compacto
flex-col gap-4
```

---

## 3. Implementación

### 3.1 Cambios en CardModal.tsx

#### A. Reducir tamaños de fuente

```typescript
// Card Name
className="text-2xl md:text-3xl font-black tracking-tight"

// Type Line
className="text-sm md:text-base font-semibold text-neutral-400"

// Oracle Text
className="text-sm md:text-base leading-relaxed"

// Section Headers
className="text-xs font-extrabold uppercase tracking-widest"

// Prices
className="text-lg md:text-xl font-bold"
```

#### B. Reducir espaciado

```typescript
// Container padding
className="p-4 md:p-6"

// Section gaps
className="space-y-4"

// Grid gaps
className="gap-4"

// Margins
className="mb-4"
```

#### C. Optimizar altura del modal

```typescript
// Modal container
className="max-h-[95vh] overflow-y-auto"

// Image container
className="max-h-[400px] lg:max-h-[600px]"
```

#### D. Compactar secciones

```typescript
// Format Legality Badges
className="flex flex-wrap gap-2" // Reducir de gap-3

// Edition Selector
className="grid grid-cols-1 gap-2" // Reducir de gap-4

// Price Section
className="grid grid-cols-2 gap-3" // Reducir de gap-4
```

---

## 4. Criterios de Éxito

### Funcionales

- [ ] Modal no requiere scroll en desktop (1920x1080)
- [ ] Modal requiere scroll mínimo en laptop (1366x768)
- [ ] Toda la información clave visible sin scroll en tablet
- [ ] Jerarquía tipográfica clara y consistente

### No Funcionales

- [ ] Interfaz se ve elegante y profesional
- [ ] Espaciado es consistente y lógico
- [ ] Tamaños de fuente son legibles pero compactos
- [ ] No hay desperdicio de espacio vertical

### Técnicos

- [ ] Código usa sistema tipográfico documentado
- [ ] Responsive breakpoints funcionan correctamente
- [ ] No hay overflow horizontal
- [ ] Performance no se ve afectada

---

## 5. Sistema Tipográfico de Referencia

### Escala de Tamaños (Tailwind)

```
text-xs:    12px (0.75rem)
text-sm:    14px (0.875rem)
text-base:  16px (1rem)
text-lg:    18px (1.125rem)
text-xl:    20px (1.25rem)
text-2xl:   24px (1.5rem)
text-3xl:   30px (1.875rem)
```

### Pesos de Fuente

```
font-normal:    400
font-medium:    500
font-semibold:  600
font-bold:      700
font-extrabold: 800
font-black:     900
```

### Line Heights

```
leading-tight:    1.25
leading-snug:     1.375
leading-normal:   1.5
leading-relaxed:  1.625
```

### Letter Spacing

```
tracking-tight:   -0.025em
tracking-normal:  0em
tracking-wide:    0.025em
tracking-wider:   0.05em
tracking-widest:  0.1em
```

---

## 6. Guía de Uso

### Cuándo usar cada tamaño

**text-3xl (30px)**: Solo para títulos principales de carta  
**text-2xl (24px)**: Títulos de sección importantes  
**text-xl (20px)**: Precios destacados  
**text-lg (18px)**: Subtítulos, stats importantes  
**text-base (16px)**: Texto de cuerpo, descripciones  
**text-sm (14px)**: Metadata, labels secundarios  
**text-xs (12px)**: Labels, badges, botones pequeños

### Cuándo usar cada peso

**font-black (900)**: Títulos principales únicamente  
**font-extrabold (800)**: Headers de sección  
**font-bold (700)**: Precios, CTAs, énfasis  
**font-semibold (600)**: Subtítulos, labels  
**font-medium (500)**: Texto con ligero énfasis  
**font-normal (400)**: Texto de cuerpo estándar

---

## 7. Checklist de Implementación

### Paso 1: Actualizar Typography

- [ ] Reducir tamaño de card name
- [ ] Reducir tamaño de type line
- [ ] Reducir tamaño de oracle text
- [ ] Reducir tamaño de section headers
- [ ] Ajustar tamaño de precios

### Paso 2: Optimizar Espaciado

- [ ] Reducir padding del modal
- [ ] Reducir gaps entre secciones
- [ ] Reducir margins verticales
- [ ] Compactar edition selector
- [ ] Compactar format badges

### Paso 3: Ajustar Layout

- [ ] Aumentar max-height del modal
- [ ] Optimizar grid layout
- [ ] Ajustar image container height
- [ ] Verificar responsive breakpoints

### Paso 4: Testing

- [ ] Probar en 1920x1080 (desktop)
- [ ] Probar en 1366x768 (laptop)
- [ ] Probar en 768px (tablet)
- [ ] Probar en 375px (mobile)
- [ ] Verificar scroll mínimo

---

## 8. Antes y Después

### ANTES

- ❌ Scroll excesivo
- ❌ Fuentes demasiado grandes
- ❌ Espaciado desperdiciado
- ❌ Modal ocupa solo 90vh

### DESPUÉS

- ✅ Scroll mínimo o nulo
- ✅ Fuentes optimizadas y legibles
- ✅ Espaciado eficiente
- ✅ Modal aprovecha 95vh
- ✅ Jerarquía tipográfica clara
- ✅ Interfaz elegante y profesional

---

**Estado**: 📋 Ready for Implementation  
**Próximo Paso**: Implementar cambios en CardModal.tsx
