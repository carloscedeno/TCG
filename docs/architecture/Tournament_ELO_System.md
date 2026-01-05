# Sistema de Torneos y Ranking ELO Multi-TCG - Geekorium

Este documento detalla la estructura y la lógica para el sistema de torneos y rankings globales de Geekorium, diseñado para soportar múltiples juegos simultáneamente (Magic, Pokémon, Lorcana, etc.).

## 1. Identidad Visual por Juego (Design System)
Para mantener la coherencia con el **Manual de Diseño de Geekorium**, cada TCG tendrá un color de acento dedicado en los rankings y tablas de torneos:

| TCG | Color de Acento | HEX | Uso en UI |
| :--- | :--- | :--- | :--- |
| **Magic: The Gathering** | Rojo Héroe | `#E1306C` | Bordes de cartas, ELO de MTG |
| **Pokémon** | Azul Eléctrico | `#405DE6` | Badges de energía, ELO de PKM |
| **Lorcana** | Púrpura Vibrante | `#833AB4` | Tinta, ELO de Lorcana |
| **One Piece** | Naranja Cálido | `#F77737` | Destacados, ELO de OP |
| **Yu-Gi-Oh!** | Amarillo Resaltado| `#FCAF45` | Estrellas de nivel, ELO de YGO |
| **Flesh and Blood** | Cyber Cyan | `#00E5FF` | Intellect, ELO de FAB |
| **Wixoss** | Verde Neón | `#00FF85` | Notificaciones de stock, ELO de WIX |

## 2. Estructura de Base de Datos (Supabase)

### Tabla: `tournaments`
Almacena los eventos organizados por la tienda.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | uuid | PK, Identificador único. |
| `name` | text | Nombre del torneo. |
| `game_id` | int | FK a `games`. |
| `status` | text | 'draft', 'open', 'ongoing', 'finished', 'cancelled'. |
| `start_date` | timestamptz | Fecha y hora de inicio. |
| `description` | text | Detalles del evento. |
| `max_players` | int | Límite de participantes. |
| `created_at` | timestamptz | Fecha de creación. |

### Tabla: `tournament_participants`
Registra qué jugadores están en qué torneo.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `tournament_id` | uuid | FK a `tournaments`. |
| `user_id` | uuid | FK a `profiles`. |
| `deck_url` | text | Link opcional a la lista de cartas (Moxfield). |
| `confirmed` | boolean | Si el jugador ha pagado/confirmado. |
| `final_rank` | int | Posición final al término del torneo. |

### Tabla: `matches` (Historial de Partidas)
Fundamental para el cálculo de ELO.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | uuid | PK. |
| `tournament_id` | uuid | FK opcional (para partidas fuera de torneos). |
| `game_id` | int | FK a `games`. |
| `player_1_id` | uuid | FK a `profiles`. |
| `player_2_id` | uuid | FK a `profiles`. |
| `winner_id` | uuid | FK a `profiles` (null si es empate). |
| `score` | text | Ejemplo: '2-0-1'. |
| `played_at` | timestamptz | Fecha de la partida. |

### Tabla: `player_rankings` (Ranking ELO Multi-TCG)
El estado actual de cada jugador **por cada juego**. Un jugador tendrá una entrada diferente por cada TCG que juegue.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `user_id` | uuid | FK a `profiles`. |
| `game_id` | int | FK a `games`. |
| `elo_rating` | int | Rating actual (Standard: 1000). |
| `matches_played`| int | Total de partidas en este juego. |
| `wins` | int | Victorias en este juego. |
| `losses` | int | Derrotas en este juego. |
| `updated_at` | timestamptz | Última actualización. |

---

## 3. Lógica del Sistema ELO Multi-TCG

El sistema calculará automáticamente el cambio de puntos tras cada partida registrada en `matches`.

### Constantes
- **K-Factor**: 32 (Sensibilidad del sistema). Un K-factor alto significa cambios más rápidos de puntos.
- **Rating Inicial**: 1000.

### Fórmulas
1. **Expectativa de Victoria (E)**:
   $E_A = 1 / (1 + 10^((R_B - R_A) / 400))$
   *(Donde $R_A$ y $R_B$ son los ratings de los jugadores)*

2. **Cálculo de Nuevo Rating (R')**:
   $R'_A = R_A + K * (S_A - E_A)$
   *(Donde $S_A$ es 1 por victoria, 0.5 por empate, 0 por derrota)*

## 4. Implementación Propuesta
- **Aislamiento**: Los puntos ganados en un torneo de Pokémon NO afectan el ranking de Magic.
- **Activación**: Un `Trigger` en la base de datos o una `Supabase Edge Function` que se ejecute cada vez que se inserta una fila en `matches`.
- **Global Leaderboard**: Una vista unificada en la web donde se pueda filtrar el Top 10 por cada TCG usando sus respectivos colores identitarios.
