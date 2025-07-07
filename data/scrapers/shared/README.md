# Scraper de Precios TCG (Python)

Este módulo contiene los scripts y utilidades para realizar web scraping de precios de cartas coleccionables desde marketplaces que no ofrecen API pública (Cardmarket, Card Kingdom, TCGplayer, Troll and Toad, etc). Los datos extraídos se limpian y normalizan antes de ser enviados a Supabase, que actúa como backend central.

## Estructura

```
scraper/
├── main.py                # Punto de entrada principal
├── scrapers/              # Un archivo por marketplace
│   ├── cardmarket.py      # Scraper para Cardmarket (puede procesar todo el CSV)
│   ├── cardkingdom.py     # Scraper para Card Kingdom
│   ├── tcgplayer.py       # Scraper para TCGplayer
│   ├── trollandtoad.py    # Scraper para Troll and Toad
│   └── ...
├── input_urls.csv         # Lista de URLs y metadatos a scrapear (incluye columna 'source')
├── utils.py               # Funciones comunes (requests, limpieza, logging)
├── models.py              # Esquemas de datos y validaciones
├── supabase_client.py     # Cliente para insertar datos en Supabase
├── requirements.txt       # Dependencias Python
└── README.md              # Esta documentación
```

## Librerías Clave
- `requests` y `beautifulsoup4`: Scraping básico
- `pandas`: Limpieza y transformación de datos
- `supabase-py`: Interacción con Supabase
- `python-dotenv`: Variables de entorno
- `scrapy` (opcional): Scraping avanzado

## Flujo Básico
1. Agrega las URLs y metadatos de cartas a `input_urls.csv` (ver ejemplo incluido). Usa la columna `source` para indicar el marketplace.
2. Ejecuta el scraper principal:
   ```bash
   python main.py
   ```
3. Elige el marketplace a scrapear (o todos). El scraper procesa cada URL, extrae el precio, guarda el resultado en Supabase y deja logs detallados.

## Configuración
- Variables de entorno en `.env`:
  ```env
  SUPABASE_URL=https://your-project-ref.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
  ```
- Instala dependencias con:
  ```bash
  pip install -r requirements.txt
  ```

## Logging y Errores
- Todos los eventos importantes y errores se registran en consola.
- Si una página no se puede scrapear, el proceso continúa con la siguiente carta.

## Scraping Diario
- Para ejecutar el scraping automáticamente una vez al día:
  - **Windows**: Usa el Programador de Tareas (Task Scheduler) para ejecutar `python main.py` diariamente.
  - **Linux/Mac**: Usa un cron job:
    ```cron
    0 3 * * * cd /ruta/a/TCG\ Web\ App/scraper && venv/bin/python main.py
    ```

## Extensión
- Agrega nuevos scrapers en la carpeta `scrapers/` siguiendo la plantilla de ejemplo.
- Puedes adaptar el CSV para otros marketplaces agregando más columnas si es necesario.

## Ejemplo de `input_urls.csv`
```csv
source,url,card_name,set_name,condition
Cardmarket,https://www.cardmarket.com/en/Magic/Products/Singles/Commander-Masters/Sol-Ring,Sol Ring,Commander Masters,Near Mint
Card Kingdom,https://www.cardkingdom.com/mtg/commander-masters/sol-ring,Sol Ring,Commander Masters,Near Mint
TCGplayer,https://www.tcgplayer.com/product/123456/commander-masters-sol-ring,Sol Ring,Commander Masters,Near Mint
Troll and Toad,https://www.trollandtoad.com/magic-the-gathering/commander-masters/sol-ring/1234567,Sol Ring,Commander Masters,Near Mint
``` 