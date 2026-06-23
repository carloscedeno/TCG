# PRD: Estrategia de Fidelización de Comunidades y Sistema de Rankings (Geekorium)

## 1. Contexto y Objetivos
**Contexto Competitivo:** El mercado de cartas coleccionables se está intensificando por la apertura de nuevas tiendas competidoras (ej. John y Luf en ubicaciones como Cerro Verde).
**Propósito:** Para destacar y sobrevivir en este mercado, la tienda debe trascender la mera venta de productos. El objetivo es ofrecer un **ecosistema completo** con una comunidad sólida donde los jugadores se sientan valorados y cómodos.
**Objetivo del PRD:** Definir las funcionalidades, reglas de negocio y flujos técnicos necesarios para soportar la estrategia de fidelización mediante rankings, eventos y comunicación efectiva.

---

## 2. Estado y Estrategia por Comunidades de Juego

Cada juego tendrá una estrategia particular basada en su estado actual y comunidad:

*   **Gundam:**
    *   *Estado:* Fuerte caída de asistencia (de 25 a casi cero) por conflictos internos.
    *   *Acción:* Reactivación inmediata mediante incentivos clave y publicación de nuevos rankings para sanear el ambiente.
*   **One Piece:**
    *   *Estado:* Comunidad con alto lore colaborativo.
    *   *Acción:* Estructurar el sistema de juego bajo una temática de **"Capitanes" y Facciones** para fomentar la cooperación.
*   **Marvel / Magic:**
    *   *Estado:* Dinámica rápida y compleja; colecciones y temporadas cambian cada 5-6 semanas.
    *   *Acción:* Adaptar metas a corto plazo. No se pueden estructurar objetivos a largo plazo por la rotación rápida.
*   **Digimon:**
    *   *Estado:* Requiere dinamización.
    *   *Acción:* Ejecución de torneos especiales. Próximo hito: Torneo con premio de un "Digihuevo" físico de 12 cm.

---

## 3. Sistema de Rankings y Recompensas (Plataforma Web)

El sistema de rankings en la web de Geekorium debe ser el valor agregado principal para la comunidad. Actualmente el sistema implementado funciona principalmente para Gundam, por lo que es necesario rediseñarlo para que sea **completamente genérico, modular y extremadamente configurable desde el panel de administración**.

### 3.1. Panel de Administración de Rankings (Sistema Genérico)
El Administrador tendrá control total para configurar las temporadas de **todos los TCGs disponibles en la página**. Las capacidades del administrador incluirán:
*   Crear, nombrar y proporcionar una **descripción detallada** y una **imagen** para la temporada.
*   Definir los nombres, **descripciones** y cargar **imágenes** para cada rango dentro de la temporada.
*   El ingreso de puntos será gestionado de forma manual por el administrador, quien tendrá la libertad de **sumar o restar puntos** según su criterio. 
*   *Nota:* Por ahora, se mantendrá la definición actual de cómo se calculan o asimilan los puntos.

### 3.2. Estructura Jerárquica Avanzada y Abierta (Caso Magic / Marvel)
Para juegos con dinámicas más complejas o estructuradas (como Magic o Marvel), el sistema permitirá crear una jerarquía completamente abierta y sin restricciones de cantidad (N niveles). Esta estructura incluirá:
1.  **Ranking General:** Clasificación global de la temporada.
2.  **Equipos / Facciones:** Posibilidad de crear de 1 a N equipos. El administrador podrá configurar la **imagen, nombre y descripción** de cada equipo.
3.  **Categorías y Subcategorías:** Se pueden tener de 1 a N categorías en general, y a su vez, de 1 a N categorías *dentro* de los equipos. Para cada categoría y subcategoría, el administrador podrá definir **imágenes y descripciones** para que los jugadores entiendan claramente de qué se trata.

### 3.3. Reglas de Visibilidad y Modularidad
*   **Diseño Modular:** Toda la jerarquía y sus atributos visuales/textuales son configurables a medida.
*   **Activación y Visibilidad:** Aunque todos los TCGs soportan el sistema de ranking, un jugador normal **no podrá ver el ranking** en la página web hasta que un administrador **active una temporada** para ese juego y coloque al usuario dentro de ella.

### 3.4. Implementación y Fases
*   **Fase 1 (Corto Plazo):** Implementación de esta arquitectura genérica en el entorno `dev`, permitiendo al administrador crear las temporadas, rangos, equipos y subir todas las imágenes y descripciones correspondientes. Cada jugador podrá ver su estado en el ranking desde la web (siempre y cuando la temporada esté activa).

---

## 4. Sincronización de Eventos (Google Calendar)

*   **Requerimiento:** Vincular la creación de eventos en la página web con el calendario del staff.
*   **Flujo Técnico:**
    1.  Se crea el evento/torneo en el administrador de la página web.
    2.  El sistema envía automáticamente una invitación (Calendar Invite) a los correos del staff (ej. Michelle, Valerie).
    3.  Al aceptar la invitación, el evento se bloquea automáticamente en los Google Calendars del equipo.

---

## 5. Infraestructura Web y Comunicación (Correos Masivos)

### 5.1. Estado de Infraestructura
*   Dominio correctamente indexado en Google.
*   Servidores limpios y en *Whitelist*.
*   Correos transaccionales (registro) funcionando en bandeja principal.

### 5.2. Estrategia de Email Marketing (Mailchimp)
*   **Remitente:** Se elimina el nombre "Gerencia". Se utilizará **"Marketing"** o **"Info"** para mayor cercanía.
*   **Base de Datos:** 251 usuarios activos.
*   **Reglas de Envío:**
    *   Envíos altamente **segmentados** y con cautela.
    *   Evitar saturación del cliente y prevenir penalizaciones/bloqueos por parte de Mailchimp/AWS (marcado como Spam).

---

## 6. Roadmap y Próximos Pasos (Fechas Límite)

| Responsable | Tarea | Plazo |
| :--- | :--- | :--- |
| **Valerie** | Cargar en el sistema las misiones y eventos de la semana entrante. | Mañana |
| **Aníbal (Dev)** | Entrega final de módulos: Inventario, Facturación, Misiones y Sistema de Puntos. | Próxima semana |
| **Diseño / Contenido** | Definir aspectos gráficos, nombres de equipos y temáticas narrativas de rankings para próximas temporadas. | Inmediato |
