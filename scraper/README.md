# Scraper de Precios TCG (Python)

Este módulo contiene los scripts y utilidades para realizar web scraping de precios de cartas coleccionables desde marketplaces que no ofrecen API pública (ej: Cardmarket, Troll and Toad, etc). Los datos extraídos se limpian y normalizan antes de ser enviados a Supabase, que actúa como backend central.

## Estructura

```
scraper/
├── main.py                # Punto de entrada principal
├── scrapers/              # Un archivo por marketplace
│   ├── cardmarket.py      # Scraper para Cardmarket
│   └── ...
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
1. Ejecutar el scraper para el marketplace deseado.
2. Limpiar y normalizar los datos obtenidos.
3. Insertar o actualizar los datos en Supabase.

## Ejecución
```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar el scraper principal
python main.py
```

## Configuración
- Variables de entorno en `.env` (ver ejemplo en el README principal del proyecto)
- Configura tus claves de Supabase y otros secretos en `.env`

## Extensión
Agrega nuevos scrapers en la carpeta `scrapers/` siguiendo la plantilla de ejemplo. 