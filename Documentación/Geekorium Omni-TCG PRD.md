# **PRD (Product Requirements Document): Geekorium Omni-TCG Data Engine (v2.0)**

## **1\. Contexto y Objetivos del Sistema**

**Objetivo Principal:** Expandir radicalmente el motor de datos actual de Geekorium, el cual fue diseñado originalmente para procesar Scryfall (Magic: The Gathering), para soportar un ecosistema de múltiples TCGs (Trading Card Games) incluyendo Pokémon, Digimon, One Piece, Gundam y títulos independientes como Riftbound. Esta expansión permitirá a Geekorium capturar nuevas cuotas de mercado sin multiplicar la complejidad técnica de su infraestructura.

**Filosofía "Omni-TCG" (Future-Proofing):** La arquitectura debe ser completamente agnóstica respecto a las reglas específicas de cada juego. Debe permitir agregar nuevos TCGs en el futuro (incluso juegos que aún no existen) simplemente insertando un registro maestro en la tabla games, sin requerir bajo ninguna circunstancia alteraciones estructurales en el esquema relacional (ALTER TABLE, agregar nuevas columnas) ni refactorizaciones profundas en el backend transaccional. Toda lógica de dominio específica del juego se abstraerá y delegará a los *Data Loaders* construidos en Python, encapsulando la entropía en columnas de tipo JSONB.

**Stack Destino e Implicaciones:**

* **Python 3.12 (Sincronizadores):** Elegido por sus capacidades avanzadas de tipado estricto (Type Hints) y manejo asíncrono robusto (asyncio), ideal para flujos ETL (Extract, Transform, Load) de alto rendimiento.  
* **Supabase PostgreSQL 15+ (DB):** Actúa como la única fuente de verdad (Single Source of Truth). Se aprovecharán al máximo sus capacidades nativas de indexación sobre documentos JSON y sus funciones RPC para búsquedas veloces.  
* **GitHub Actions (Orquestador):** Se utilizará como motor de cron jobs y pipelines, eliminando la necesidad de mantener servidores siempre encendidos (EC2/Droplets), reduciendo costos y centralizando los logs de ejecución.

## **2\. Arquitectura de Base de Datos y Mapeo Polimórfico**

Para cumplir rigurosamente con la directiva "Omni-TCG" y la "Ley 6 de Geekorium" (Preferencia absoluta por Performance y Denormalización frente a la normalización estricta), el esquema híbrido se utilizará de la siguiente manera:

### **2.1. Uso Estratégico del JSONB e Índices GIN**

Los campos nativos de PostgreSQL (columnas fuertemente tipadas) se usarán **estrictamente** para búsquedas universales e índices globales transversales a todos los juegos (Ej: card\_name, set\_id, rarity, artist). Por otro lado, todos los atributos mecánicos, reglas y estadísticos específicos de un juego deben mapearse estructuradamente dentro de los campos tcg\_specific\_attributes en la tabla cards y tcg\_specific\_printing\_attributes en la tabla card\_printings.

Para garantizar que las búsquedas sobre estos campos JSONB sean ultra-rápidas (sub 50ms), la IA generadora debe asegurar la existencia de índices GIN (Generalized Inverted Index) sobre estas columnas.

**Ejemplos de Estructuras Polimórficas (Contratos de Datos):**

* **Pokémon (Ejemplo de payload en tcg\_specific\_attributes):**  
  {  
    "hp": "120",  
    "evolvesFrom": "Charmeleon",  
    "abilities": \[{"name": "Energy Burn", "text": "As often as you like...", "type": "Pokémon Power"}\],  
    "attacks": \[{"cost": \["Fire", "Fire", "Fire", "Colorless"\], "damage": "100", "name": "Fire Spin"}\],  
    "weaknesses": \[{"type": "Water", "value": "x2"}\],  
    "retreatCost": \["Colorless", "Colorless", "Colorless"\]  
  }

* **Digimon (Ejemplo de payload en tcg\_specific\_attributes):**  
  {  
    "dp": 11000,  
    "play\_cost": 11,  
    "digi\_type": "Holy Warrior",  
    "evolution\_cost": \[{"color": "Red", "cost": 3, "level": 5}\],  
    "main\_effect": "\[When Digivolving\] Trash the top card of your opponent's security stack.",  
    "inherited\_effect": null  
  }

* **One Piece / Gundam:** Almacenará valores cruciales para el combate como cost, life, counter, traits (ej. \["Straw Hat Crew", "Supernovas"\]), y power.

### **2.2. Vistas Materializadas y Performance (Ley 6\)**

El catálogo de Geekorium es consultado miles de veces por minuto. Hacer JOIN entre cards, card\_printings, sets y games en cada petición colapsaría el servidor. Por ello, dependemos de vistas materializadas.

Al finalizar cualquier sincronización masiva, ingesta inicial, o inserción de un nuevo set, el script de Python **DEBE** ejecutar obligatoriamente el refresco de la vista consolidada que alimenta al Marketplace frontend:

REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv\_unique\_cards;

*Nota Crítica Operativa:* El modificador CONCURRENTLY no es opcional. Sin él, PostgreSQL aplicará un bloqueo exclusivo (Exclusive Lock) sobre la vista, causando que todas las lecturas (usuarios navegando en la tienda) queden en espera (timeout) hasta que la vista termine de regenerarse. CONCURRENTLY requiere que la vista tenga un índice único (Unique Index) para funcionar correctamente.

## **3\. Data Loaders: Ingesta de Metadatos (Python 3.12)**

Se crearán nuevos scripts de Python dentro del directorio del Sincronizador de Datos (/sync\_engine), siguiendo rigurosamente el patrón de diseño de Inyección de Dependencias y Manejo de Errores ya establecido por la ingesta de Scryfall.

### **3.1. sync\_pokemon\_tcg.py**

* **Fuente Oficial:** API api.pokemontcg.io/v2.  
* **Mecanismo de Paginación:** Descarga paginada GET /v2/cards?q=set.id:{set\_id}. El script debe ser capaz de detectar metadatos de paginación (totalCount, pageSize) e iterar dinámicamente hasta agotar las páginas, evitando bucles infinitos.  
* **Transformación y Limpieza:** Convierte el JSON altamente anidado de la API al esquema plano \+ JSONB de Omni-TCG. Se deben sanitizar textos (eliminar caracteres nulos o codificaciones erróneas).  
* **Manejo de Variantes Físicas (Foils/Reverse):** A diferencia de MTG, Pokémon maneja múltiples tratamientos (Standard, Reverse Holo, Full Art) bajo un mismo ID de carta lógico. El loader creará múltiples registros independientes en la tabla card\_printings marcando booleanos como is\_foil \= true, is\_promo \= true o inyectando atributos como tcg\_specific\_printing\_attributes: {"finish": "reverse\_holo", "stamped": true} según la data provista.

### **3.2. sync\_digimon\_tcg.py**

* **Fuente Comunitaria:** API digimoncard.io/api-public.  
* **Mecanismo de Descarga:** Descarga masiva de la base completa mediante el Endpoint /search.php?n=Digimon.  
* **Restricción y Resiliencia:** Al no ser un API comercial robusto, está fuertemente protegido por Cloudflare. Es mandatorio implementar peticiones asíncronas (asyncio) combinadas con la librería tenacity para reintentos con backoff exponencial, o utilizar un asyncio.Semaphore que limite estrictamente las peticiones concurrentes (ej. máximo 2 req/segundo) para evitar baneos de IP permanentes en nuestros runners de GitHub.

### **3.3. sync\_tcgplayer\_bridge.py (One Piece y Gundam)**

* **Fuente Comercial:** API de TCGPlayer v1.39.0 (Estándar de la industria).  
* **Mecanismo de Autenticación Continua:** Utiliza el flujo OAuth 2.0 Client Credentials. El script debe almacenar el Bearer Token temporalmente y ser capaz de solicitar uno nuevo proactivamente si recibe un HTTP 401 Unauthorized durante un lote largo de descargas. Descarga los "Catalog Products" basados en el categoryId correspondiente.  
* **Separación de Responsabilidades:** Este script extraerá los metadatos de las cartas y sus IDs primarios. Aunque puede capturar metadata primaria de precios, la actualización volátil y diaria de los valores del mercado se delegará exclusivamente al sincronizador de precios dedicado.

### **3.4. Carga Local de Assets y Prevención de Hotlinking (Regla de Independencia)**

Para garantizar que Geekorium funcione independientemente del estado de las APIs de terceros (que a menudo cambian sus URLs o bloquean el hotlinking), los *Data Loaders* capturarán las URLs originales de las imágenes (image\_url\_small, image\_url\_normal, image\_url\_large).

Sin embargo, el script deberá encolar estas URLs para ser descargadas, comprimidas a formatos modernos (WebP) y respaldadas en el Storage de Supabase (o un bucket S3). La columna image\_url en nuestra base de datos siempre debe apuntar a nuestro CDN interno para garantizar tiempos de carga sub-100ms en el frontend.

## **4\. Sincronizador de Precios y Lógica SKU-Aware**

El ecosistema de precios es la columna vertebral de la rentabilidad del e-commerce. El script existente sync\_prices.py será refactorizado y extendido para ser universal, aplicando el **Algoritmo SKU-Aware** \[F\]SET-NNNN implacablemente sobre todos los juegos.

### **4.1. Generación de SKUs Universales (Stock Keeping Unit)**

El mayor problema de un TCG es la ambigüedad (ej. existen docenas de cartas llamadas "Charizard" o "Agumon"). La identificación de inventario y cruce de precios se basará exclusivamente en un SKU normalizado. Cada TCG tiene nomenclaturas diferentes que deben traducirse en los campos card\_printings.collector\_number y sets.set\_code para generar dinámicamente un SKU inmutable:

* **Pokémon:** \[F\]SWSH1-001 (Indica la versión Foil de la carta 001 de la expansión Sword & Shield Base).  
* **Digimon:** \[F\]BT1-001 (Indica Booster Tracker 1, Carta 001).  
* **One Piece:** \[F\]OP01-001 (Romance Dawn, Carta 001).  
* **MTG (Legado):** Mantiene su estructura actual intacta para evitar romper el inventario existente.  
  Este patrón garantiza que al conectar sistemas externos de POS (Point of Sale) o escanear códigos de barras, el sistema reconozca instantáneamente la variante exacta, su tratamiento y su precio.

### **4.2. Motor de Precios Dinámicos (Market Price) y Leyes de Negocio**

* **UPSERT Masivo en JSONB:** Los precios de mercado actualizados (provistos por TCGPlayer, CardMarket o TCGCollector) se inyectarán de forma masiva en la columna card\_printings.prices. La estructura se actualizará mediante operaciones atómicas en Postgres para modificar claves específicas (avg\_market\_price\_usd, foil\_price) sin destruir datos históricos adyacentes.  
* **Normalización de Moneda:** Todos los precios extraídos de cualquier API internacional deben convertirse y almacenarse estrictamente en formato decimal referenciado en USD.  
* **Protección de Precios Salvavidas (Ley 25):** Esta es la regla de negocio más crítica. Si el conector del API falla, parsea mal un dato, o la API de origen sufre un error y devuelve un valor nulo (null) o cero (0.00) para una carta altamente cotizada, el script de Python **DEBE abortar silenciosamente** la actualización de esa fila específica y mantener el precio histórico intacto. Un precio de $0.00 persistido en base de datos es considerado un incidente fatal (Severity 1\) ya que expone a la tienda a ventas a costo cero.

## **5\. Orquestación e Infraestructura Cloud (GitHub Actions)**

Toda la automatización de la ingesta de datos no residirá en la base de datos (como triggers o pg\_cron) ni en Supabase Edge Functions (que se reservan estrictamente para interacciones ultrarrápidas y ligeras del frontend). Toda la orquestación pesada vivirá en **GitHub Actions**.

### **5.1. Workflow: tcg\_metadata\_sync.yml (Expansión del Catálogo)**

* **Triggers:** schedule cron (Ej: Semanal \- Lunes 00:00 UTC) y workflow\_dispatch para ejecuciones manuales por administradores tras un anuncio de un nuevo Set.  
* **Estrategia de Matriz (Matrix Strategy):** Utilizará características de matriz de GitHub Actions para ejecutar trabajos en paralelo para diferentes TCGs y reducir el tiempo total de ejecución.  
* **Jobs (Pasos del Pipeline):**  
  1. Provisionar entorno: Setup Python 3.12 y cacheo de dependencias (pip install \-r requirements.txt).  
  2. Ejecución paralela de loaders: sync\_pokemon\_tcg.py, sync\_digimon\_tcg.py, etc.  
  3. Llamada de Consolidación: Ejecutar vía REST o cliente Python el llamado a Supabase RPC para refrescar mv\_unique\_cards de forma concurrente.  
* **Manejo Activo de Errores (Alerting):** Si el proceso de scraping falla o un API cambia su esquema abruptamente, el workflow no solo debe fallar, sino que debe extraer el volcado de error de Python y enviarlo mediante un Webhook formateado a los canales de administración de Discord/Slack, permitiendo a los ingenieros actuar de inmediato.

### **5.2. Workflow: tcg\_prices\_sync.yml (Fluctuación del Mercado)**

* **Trigger:** schedule diario a horas de bajo tráfico (Ej: 03:00 UTC) para que los precios estén listos para la apertura de la tienda física.  
* **Jobs y Prevención de Timeouts:**  
  1. Ejecutar sync\_prices.py iterando eficientemente.  
  2. **Lotes Transaccionales (Batches):** Como procesar más de 100,000 precios de golpe puede agotar la memoria del runner o causar un timeout en la base de datos, las transacciones deben enviarse en lotes paginados (ej. 1,000 registros por commit/upsert) utilizando el cliente oficial de Python de Supabase.

## **6\. Reglas Críticas para la IA (Directivas Absolutas de Compounding)**

Cualquier LLM, agente autónomo o herramienta de IA (Cursor, Devin, GitHub Copilot) que interactúe con este repositorio debe obedecer incondicionalmente las siguientes directivas operativas. Violar una de estas reglas resultará en el rechazo del Pull Request.

1. **Strict Supabase Client Usage:** El código en Python **no debe** usar conectores crudos como psycopg2 directamente a menos que sea estrictamente necesario para operaciones complejas no soportadas. Debe priorizar la librería oficial supabase-py. Las inserciones masivas deben construirse en memoria como listas de diccionarios y enviarse en un solo viaje de red usando:  
   response \= supabase.table('card\_printings').upsert(data\_list\_of\_1000\_dicts, returning="minimal").execute()  
2. **SKU over Name (Identidad Fuerte):** Toda la lógica de conciliación (matching) de precios o actualización de inventario vivo y stock en la tabla products se hace estrictamente comparando el printing\_id (UUID) o el SKU normalizado (\[F\]SET-NNNN). **Queda terminantemente prohibido generar sentencias SQL con la cláusula WHERE card\_name \= 'X'** para procesos de actualización. Los TCGs tienen miles de cartas homónimas (ej. 50 versiones diferentes de Pikachu) y buscar por nombre destruirá la integridad de los precios.  
3. **Edge Functions (Deno) para Lógica de Negocio Compleja:** Los RPCs existentes en la base de datos (como get\_products\_filtered) deben ser actualizados, o se deben crear Edge Functions en Deno para asegurar el soporte de filtrado profundo dentro de los campos JSONB. Si el usuario del frontend desea filtrar "Cartas Pokémon con HP \> 100", la IA debe escribir la función de Deno que construya dinámicamente la consulta utilizando los operadores JSONB nativos de PostgreSQL (ej. tcg\_specific\_attributes-\>\>'hp' \> '100').  
4. **No Modificar el Esquema Relacional (Inmutabilidad del DDL):** Bajo ninguna circunstancia el código generado (ya sea Python o scripts SQL) intentará ejecutar sentencias DDL como ALTER TABLE, CREATE TABLE o DROP COLUMN sobre el esquema central. El motor asume que la arquitectura actual de columnas es inmutable. Todo dato imprevisto, nuevo mecánismo de juego o atributo recién descubierto en un API externa **se inyectará dinámicamente en las columnas JSONB**.