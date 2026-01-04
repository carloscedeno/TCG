#!/usr/bin/env python3
"""
Script principal para scraping de precios de cartas TCG
Sistema robusto compatible con múltiples TCG y estructura de base de datos avanzada
"""

import csv
import logging
import sys
from datetime import datetime
from typing import List, Dict, Any, Optional
import argparse
from pathlib import Path

# Importar módulos locales con rutas relativas correctas
try:
    from .data.models import (
        CardData, CardPrice, CardVariant, ScrapingResult, ScrapingBatch,
        PriceNormalizer, ConditionMapper, TCGAttributeMapper, TCGMarketplaceMapper,
        VariantDetector, CardIdentifier
    )
    from .utils.anti_bot import AntiBotManager, ProxyConfig
    from .data.manager import IncrementalUpdateManager, DataRetentionManager, DataQualityManager
except (ImportError, ValueError):
    # Fallback for direct execution or when not imported as a package
    sys.path.append(str(Path(__file__).parent))
    from data.models import (
        CardData, CardPrice, CardVariant, ScrapingResult, ScrapingBatch,
        PriceNormalizer, ConditionMapper, TCGAttributeMapper, TCGMarketplaceMapper,
        VariantDetector, CardIdentifier
    )
    from utils.anti_bot import AntiBotManager, ProxyConfig
    from data.manager import IncrementalUpdateManager, DataRetentionManager, DataQualityManager

# Importaciones opcionales para evitar errores si no existen
try:
    from supabase_client import SupabaseClient
except ImportError:
    SupabaseClient = None

try:
    from .scrapers.cardmarket import CardmarketScraper
    from .scrapers.cardkingdom import CardKingdomScraper
    from .scrapers.tcgplayer import TCGPlayerScraper
    from .scrapers.trollandtoad import TrollAndToadScraper
except (ImportError, ValueError):
    # Fallback for direct execution
    from scrapers.cardmarket import CardmarketScraper
    from scrapers.cardkingdom import CardKingdomScraper
    from scrapers.tcgplayer import TCGPlayerScraper
    from scrapers.trollandtoad import TrollAndToadScraper

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class TCGScraperManager:
    """Gestor principal del sistema de scraping multi-TCG con funcionalidades avanzadas"""
    
    def __init__(self, supabase_url: str, supabase_key: str, 
                 use_anti_bot: bool = True, use_proxies: bool = False,
                 data_dir: str = "data"):
        """Inicializar el gestor de scraping"""
        if SupabaseClient:
            self.supabase = SupabaseClient(supabase_url, supabase_key)
        else:
            self.supabase = None
            logger.warning("SupabaseClient no disponible - funcionalidad de base de datos deshabilitada")
        
        # Sistema anti-bot
        self.anti_bot_manager = None
        if use_anti_bot:
            self.anti_bot_manager = AntiBotManager(
                use_proxies=use_proxies,
                use_user_agent_rotation=True,
                requests_per_minute=30,
                requests_per_hour=1000
            )
        
        # Inicializar scrapers solo si están disponibles
        self.scrapers = {}
        if CardmarketScraper:
            self.scrapers['cardmarket'] = CardmarketScraper(self.anti_bot_manager)
        if CardKingdomScraper:
            self.scrapers['cardkingdom'] = CardKingdomScraper(self.anti_bot_manager)
        if TCGPlayerScraper:
            self.scrapers['tcgplayer'] = TCGPlayerScraper(self.anti_bot_manager)
        if TrollAndToadScraper:
            self.scrapers['trollandtoad'] = TrollAndToadScraper(self.anti_bot_manager)
        
        if not self.scrapers:
            logger.warning("No hay scrapers disponibles")
        
        # Gestión de datos
        self.incremental_manager = IncrementalUpdateManager(data_dir)
        self.retention_manager = DataRetentionManager(data_dir)
        self.quality_manager = DataQualityManager()

        # Componentes de normalización y mapeo
        self.price_normalizer = PriceNormalizer()
        self.condition_mapper = ConditionMapper()
        self.attribute_mapper = TCGAttributeMapper()
        self.marketplace_mapper = TCGMarketplaceMapper()
        
        # Nuevos componentes avanzados
        self.variant_detector = VariantDetector()
        self.card_identifier = CardIdentifier()
        
        # Estadísticas
        self.stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'blocked_requests': 0,
            'captcha_encounters': 0,
            'variants_detected': 0,
            'anomalies_found': 0
        }
    
    def load_input_data(self, csv_file: Optional[str] = None, from_supabase: bool = False) -> List[Dict[str, Any]]:
        """Cargar datos de entrada desde CSV o Supabase"""
        if from_supabase and self.supabase:
            logger.info("Cargando cartas desde Supabase...")
            return self.load_cards_from_supabase()
        
        if not csv_file:
            logger.error("Se requiere un archivo CSV si no se carga desde Supabase")
            return []
            
        try:
            with open(csv_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                return list(reader)
        except FileNotFoundError:
            logger.error(f"Archivo CSV no encontrado: {csv_file}")
            return []
        except Exception as e:
            logger.error(f"Error al leer CSV: {e}")
            return []

    def load_cards_from_supabase(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Cargar cartas de la base de datos que necesitan actualización"""
        try:
            # Esta es una implementación simplificada. 
            # En un sistema real, buscaríamos cartas cuya última actualización sea antigua.
            # O cartas marcadas como 'priority' para trackeo.
            query = self.supabase.supabase.table('card_printings').select(
                'printing_id, image_url, cards(card_name, game_id, games(game_code)), sets(set_name)'
            ).limit(limit).execute()
            
            cards_from_db = []
            for item in query.data:
                cards_from_db.append({
                    'card_name': item['cards']['card_name'],
                    'set_name': item['sets']['set_name'],
                    'game_code': item['cards']['games']['game_code'],
                    'source': 'cardmarket' if 'cardmarket' in (item.get('image_url') or '') else 'tcgplayer',
                    'url': item.get('image_url') or '' # Esto es un placeholder, idealmente tendríamos la URL del marketplace
                })
            
            return cards_from_db
        except Exception as e:
            logger.error(f"Error cargando cartas de Supabase: {e}")
            return []
    
    def detect_game_from_url(self, url: str, source: str) -> str:
        """Detectar el juego basado en la URL usando el mapeador inteligente"""
        # Usar el nuevo mapeador de marketplace
        detected_tcg = self.marketplace_mapper.detect_tcg_from_url(url, source)
        
        if detected_tcg:
            logger.info(f"TCG detectado: {detected_tcg} para {source}")
            return detected_tcg
        
        # Fallback al método anterior si no se detecta
        url_lower = url.lower()
        
        # Detectar por dominio o contenido de URL
        if 'cardmarket.com' in url_lower:
            if '/magic/' in url_lower:
                return 'MTG'
            elif '/pokemon/' in url_lower:
                return 'POKEMON'
            elif '/yugioh/' in url_lower:
                return 'YUGIOH'
            elif '/lorcana/' in url_lower:
                return 'LORCANA'
            elif '/flesh-and-blood/' in url_lower:
                return 'FAB'
            elif '/wixoss/' in url_lower:
                return 'WIXOSS'
            elif '/one-piece/' in url_lower:
                return 'ONEPIECE'
        
        elif 'cardkingdom.com' in url_lower:
            if '/magic_the_gathering/' in url_lower:
                return 'MTG'
            elif '/pokemon/' in url_lower:
                return 'POKEMON'
            elif '/yugioh/' in url_lower:
                return 'YUGIOH'
            elif '/lorcana/' in url_lower:
                return 'LORCANA'
            elif '/flesh_and_blood/' in url_lower:
                return 'FAB'
            elif '/one_piece/' in url_lower:
                return 'ONEPIECE'
        
        elif 'tcgplayer.com' in url_lower:
            if '/magic/' in url_lower:
                return 'MTG'
            elif '/pokemon/' in url_lower:
                return 'POKEMON'
            elif '/yugioh/' in url_lower:
                return 'YUGIOH'
            elif '/lorcana/' in url_lower:
                return 'LORCANA'
            elif '/flesh-and-blood/' in url_lower:
                return 'FAB'
            elif '/one-piece/' in url_lower:
                return 'ONEPIECE'
        
        elif 'trollandtoad.com' in url_lower:
            if '/magic-the-gathering/' in url_lower:
                return 'MTG'
            elif '/pokemon/' in url_lower:
                return 'POKEMON'
            elif '/yugioh/' in url_lower:
                return 'YUGIOH'
            elif '/lorcana/' in url_lower:
                return 'LORCANA'
            elif '/flesh-and-blood/' in url_lower:
                return 'FAB'
            elif '/one-piece/' in url_lower:
                return 'ONEPIECE'
        
        # Por defecto, asumir MTG si no se puede detectar
        logger.warning(f"No se pudo detectar el juego para URL: {url}. Asumiendo MTG.")
        return 'MTG'
    
    def validate_tcg_support(self, tcg: str, source: str) -> bool:
        """Validar si un TCG está soportado en un marketplace específico"""
        is_supported = self.marketplace_mapper.is_tcg_supported(tcg, source)
        
        if not is_supported:
            supported_tcgs = self.marketplace_mapper.get_supported_tcgs(source)
            logger.warning(f"TCG {tcg} no está soportado en {source}. TCGs soportados: {supported_tcgs}")
        
        return is_supported
    
    def get_marketplace_info(self) -> Dict[str, Any]:
        """Obtener información completa de cobertura de marketplaces"""
        coverage = self.marketplace_mapper.get_marketplace_coverage()
        
        info = {
            'coverage': coverage,
            'summary': {}
        }
        
        # Crear resumen por TCG
        all_tcgs = set()
        for tcgs in coverage.values():
            all_tcgs.update(tcgs)
        
        for tcg in sorted(all_tcgs):
            best_marketplaces = self.marketplace_mapper.get_best_marketplace_for_tcg(tcg)
            info['summary'][tcg] = {
                'available_in': best_marketplaces,
                'count': len(best_marketplaces)
            }
        
        return info
    
    def extract_set_info(self, url: str, card_name: str, set_name: str) -> Dict[str, str]:
        """Extraer información del set desde la URL o datos proporcionados"""
        set_info = {
            'set_code': '',
            'set_name': set_name or '',
            'collector_number': ''
        }
        
        # Intentar extraer set_code de la URL
        url_parts = url.split('/')
        for i, part in enumerate(url_parts):
            if part in ['singles', 'products', 'cards'] and i + 1 < len(url_parts):
                potential_set = url_parts[i + 1]
                # Validar que parece un código de set (3-5 caracteres, alfanumérico)
                if len(potential_set) >= 3 and len(potential_set) <= 5 and potential_set.isalnum():
                    set_info['set_code'] = potential_set.upper()
                    break
        
        # Si no se encontró en la URL, intentar inferir desde set_name
        if not set_info['set_code'] and set_name:
            # Mapeo básico de nombres de set a códigos
            set_mapping = {
                'commander masters': 'cmm',
                'commander 2021': 'c21',
                'commander 2022': 'c22',
                'commander 2023': 'c23',
                'base set': 'base1',
                'jungle': 'base2',
                'fossil': 'base3',
                'the first chapter': 'tfc',
                'rise of the floodborn': 'rotf'
            }
            
            set_name_lower = set_name.lower()
            for name, code in set_mapping.items():
                if name in set_name_lower:
                    set_info['set_code'] = code
                    break
        
        return set_info
    
    def detect_variants(self, card_data: Dict[str, Any], url: str, game_code: str) -> Dict[str, Any]:
        """Detectar variantes de cartas usando el detector inteligente"""
        variants = {}
        
        # Detectar desde texto descriptivo
        card_name = card_data.get('card_name', '')
        set_name = card_data.get('set_name', '')
        description = f"{card_name} {set_name}".lower()
        
        text_variants = self.variant_detector.detect_variant_from_text(description, game_code)
        variants.update(text_variants)
        
        # Detectar desde URL
        url_variants = self.variant_detector.detect_variant_from_url(url, game_code)
        variants.update(url_variants)
        
        if variants:
            self.stats['variants_detected'] += 1
            logger.info(f"Variantes detectadas para {card_name}: {variants}")
        
        return variants
    
    def validate_data_quality(self, data: Dict[str, Any]) -> List[str]:
        """Validar calidad de los datos"""
        errors = self.quality_manager.validate_card_data(data)
        
        if errors:
            logger.warning(f"Errores de validación para {data.get('card_name', '')}: {errors}")
        
        return errors
    
    def detect_anomalies(self, price_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detectar anomalías en los datos de precios"""
        anomalies = self.quality_manager.detect_anomalies(price_data)
        
        if anomalies:
            self.stats['anomalies_found'] += len(anomalies)
            logger.warning(f"Anomalías detectadas: {len(anomalies)}")
            for anomaly in anomalies:
                logger.warning(f"Anomalía: {anomaly}")
        
        return anomalies
    
    def scrape_card(self, card_data: Dict[str, Any]) -> ScrapingResult:
        """Scrapear una carta individual con todas las funcionalidades avanzadas"""
        try:
            source = card_data.get('source', '').lower()
            url = card_data.get('url', '')
            card_name = card_data.get('card_name', '')
            set_name = card_data.get('set_name', '')
            condition = card_data.get('condition', 'Near Mint')
            
            # Verificar si necesita actualización (actualización incremental)
            game_code = card_data.get('game_code', '')
            if not game_code:
                game_code = self.detect_game_from_url(url, source)
            
            if not self.incremental_manager.should_update_card(card_name, game_code, source):
                logger.info(f"Saltando {card_name} - actualización reciente")
                return ScrapingResult(
                    success=True,
                    card_name=card_name,
                    source=source,
                    price=0.0,  # No actualizar precio
                    currency="USD",
                    scraped_at=datetime.utcnow().isoformat(),
                    url=url,
                    condition=condition
                )
            
            # Validar si el TCG está soportado en este marketplace
            if game_code and not self.validate_tcg_support(game_code, source):
                return ScrapingResult(
                    success=False,
                    card_name=card_name,
                    source=source,
                    error_message=f"TCG {game_code} no está soportado en {source}",
                    url=url,
                    scraped_at=datetime.utcnow().isoformat()
                )
            
            # Aplicar técnicas anti-bot antes de la petición
            if self.anti_bot_manager:
                self.anti_bot_manager.pre_request()
            
            # Extraer información del set
            set_info = self.extract_set_info(url, card_name, set_name)
            
            # Seleccionar scraper apropiado
            scraper = self.scrapers.get(source)
            if not scraper:
                return ScrapingResult(
                    success=False,
                    card_name=card_name,
                    source=source,
                    error_message=f"Scraper no encontrado para fuente: {source}",
                    url=url,
                    scraped_at=datetime.utcnow().isoformat()
                )
            
            # Realizar scraping
            raw_data = scraper.scrape_card(url)
            
            if not raw_data or not raw_data.get('success'):
                # Manejar bloqueos y CAPTCHAs
                if self.anti_bot_manager and raw_data:
                    response_text = raw_data.get('error', '')
                    if self.anti_bot_manager.handle_captcha(response_text):
                        self.stats['captcha_encounters'] += 1
                    elif self.anti_bot_manager.handle_blocked(response_text, 0):
                        self.stats['blocked_requests'] += 1
                
                self.stats['failed_requests'] += 1
                return ScrapingResult(
                    success=False,
                    card_name=card_name,
                    source=source,
                    error_message=raw_data.get('error', 'No se obtuvieron datos') if raw_data else 'Error desconocido en scraping',
                    url=url,
                    scraped_at=datetime.utcnow().isoformat()
                )
            
            # Normalizar precio
            price_text = raw_data.get('price', '')
            price, currency = self.price_normalizer.normalize_price(price_text)
            
            # Normalizar condición
            raw_condition = raw_data.get('condition', condition)
            normalized_condition = self.condition_mapper.normalize_condition(raw_condition, source)
            
            # Mapear atributos específicos del TCG
            tcg_attrs = self.attribute_mapper.map_attributes(game_code, raw_data)
            
            # Detectar variantes
            variants = self.detect_variants(card_data, url, game_code)
            
            # Crear datos completos para validación
            complete_data = {
                'card_name': card_name,
                'game_code': game_code,
                'price': price,
                'condition': normalized_condition,
                'source': source,
                'url': url,
                'is_foil': raw_data.get('is_foil', False),
                'is_etched': raw_data.get('is_etched', False),
                'stock_quantity': raw_data.get('stock_quantity'),
                **variants,
                **tcg_attrs
            }
            
            # Validar calidad de datos
            validation_errors = self.validate_data_quality(complete_data)
            
            # Registrar actualización exitosa
            self.incremental_manager.record_update(card_name, game_code, source)
            self.stats['successful_requests'] += 1
            
            # Aplicar técnicas anti-bot después de la petición
            if self.anti_bot_manager:
                self.anti_bot_manager.post_request(True)
            
            # Crear resultado exitoso
            return ScrapingResult(
                success=True,
                card_name=card_name,
                source=source,
                price=price,
                currency=currency,
                scraped_at=datetime.utcnow().isoformat(),
                url=url,
                condition=normalized_condition,
                stock_quantity=raw_data.get('stock_quantity'),
                is_foil=raw_data.get('is_foil', False),
                is_etched=raw_data.get('is_etched', False)
            )
            
        except Exception as e:
            logger.error(f"Error al scrapear {card_name}: {e}")
            self.stats['failed_requests'] += 1
            
            if self.anti_bot_manager:
                self.anti_bot_manager.post_request(False)
            
            return ScrapingResult(
                success=False,
                card_name=card_name,
                source=source,
                error_message=str(e),
                url=url,
                scraped_at=datetime.utcnow().isoformat()
            )
    
    def scrape_batch(self, input_data: List[Dict[str, Any]], sources_filter: Optional[List[str]] = None) -> ScrapingBatch:
        """Scrapear un lote de cartas con todas las funcionalidades avanzadas"""
        batch = ScrapingBatch(total_cards=len(input_data))
        
        logger.info(f"Iniciando scraping de {len(input_data)} cartas con funcionalidades avanzadas...")
        
        # Mostrar información de cobertura de marketplaces
        marketplace_info = self.get_marketplace_info()
        logger.info("Cobertura de TCGs por marketplace:")
        for source, tcgs in marketplace_info['coverage'].items():
            logger.info(f"  {source}: {', '.join(tcgs)}")
        
        for i, card_data in enumerate(input_data, 1):
            # Filtrar por fuentes si se especifica
            if sources_filter:
                source = card_data.get('source', '').lower()
                if source not in [s.lower() for s in sources_filter]:
                    logger.info(f"Saltando {card_data.get('card_name', '')} - fuente {source} no incluida en filtro")
                    continue
            
            logger.info(f"Scrapeando {i}/{len(input_data)}: {card_data.get('card_name', '')}")
            
            result = self.scrape_card(card_data)
            batch.results.append(result)
            
            if result.success:
                batch.successful_scrapes += 1
                logger.info(f"✓ {result.card_name}: ${result.price} ({result.currency})")
            else:
                batch.failed_scrapes += 1
                logger.error(f"✗ {result.card_name}: {result.error_message}")
            
            # Pausa entre requests para ser respetuoso
            import time
            if self.anti_bot_manager:
                time.sleep(self.anti_bot_manager.get_random_delay())
            else:
                time.sleep(1)
        
        batch.end_time = datetime.utcnow()
        
        # Mostrar estadísticas finales
        self.print_final_statistics(batch)
        
        return batch
    
    def print_final_statistics(self, batch: ScrapingBatch):
        """Imprimir estadísticas finales del scraping"""
        logger.info("=" * 50)
        logger.info("ESTADÍSTICAS FINALES DEL SCRAPING")
        logger.info("=" * 50)
        logger.info(f"Total de cartas: {batch.total_cards}")
        logger.info(f"Scrapes exitosos: {batch.successful_scrapes}")
        logger.info(f"Scrapes fallidos: {batch.failed_scrapes}")
        logger.info(f"Tasa de éxito: {batch.success_rate:.1f}%")
        logger.info(f"Duración: {batch.duration:.1f} segundos")
        
        logger.info("\nESTADÍSTICAS AVANZADAS:")
        logger.info(f"Total de peticiones: {self.stats['total_requests']}")
        logger.info(f"Peticiones exitosas: {self.stats['successful_requests']}")
        logger.info(f"Peticiones fallidas: {self.stats['failed_requests']}")
        logger.info(f"Peticiones bloqueadas: {self.stats['blocked_requests']}")
        logger.info(f"Encuentros con CAPTCHA: {self.stats['captcha_encounters']}")
        logger.info(f"Variantes detectadas: {self.stats['variants_detected']}")
        logger.info(f"Anomalías encontradas: {self.stats['anomalies_found']}")
        
        # Estadísticas de datos
        data_stats = self.incremental_manager.get_data_statistics()
        logger.info(f"\nESTADÍSTICAS DE DATOS:")
        logger.info(f"Total de snapshots: {data_stats['total_snapshots']}")
        logger.info(f"Crecimiento de datos: {data_stats['data_growth']}")
        logger.info(f"Frecuencia de actualización: {data_stats['update_frequency']:.2f} por día")
        
        # Uso de almacenamiento
        storage_stats = self.retention_manager.get_storage_usage()
        logger.info(f"\nUSO DE ALMACENAMIENTO:")
        logger.info(f"Tamaño total: {storage_stats['total_size_mb']:.2f} MB")
        logger.info(f"Número de archivos: {storage_stats['file_count']}")
    
    def save_to_supabase(self, batch: ScrapingBatch) -> bool:
        """Guardar resultados en Supabase con funcionalidades avanzadas"""
        try:
            successful_results = [r for r in batch.results if r.success]
            
            if not successful_results:
                logger.warning("No hay resultados exitosos para guardar")
                return False
            
            # Preparar datos para inserción
            price_data = []
            for result in successful_results:
                # Detectar juego
                game_code = self.detect_game_from_url(result.url, result.source)
                
                # Extraer información del set
                set_info = self.extract_set_info(result.url, result.card_name, '')
                
                # Detectar variantes
                variants = self.detect_variants({
                    'card_name': result.card_name,
                    'set_name': set_info['set_name']
                }, result.url, game_code)
                
                price_entry = {
                    'card_name': result.card_name,
                    'game_code': game_code,
                    'set_code': set_info['set_code'],
                    'set_name': set_info['set_name'],
                    'collector_number': set_info['collector_number'],
                    'condition': result.condition,
                    'price_usd': result.price if result.currency == 'USD' else None,
                    'price_eur': result.price if result.currency == 'EUR' else None,
                    'source': result.source,
                    'url': result.url,
                    'scraped_at': result.scraped_at,
                    'is_foil': result.is_foil,
                    'is_etched': result.is_etched,
                    'stock_quantity': result.stock_quantity,
                    'price_type': 'market',
                    # Agregar variantes detectadas
                    'art_variant_type': variants.get('art_variant_type'),
                    'foil_type': variants.get('foil_type'),
                    'edition': variants.get('edition'),
                    'treatment': variants.get('treatment'),
                    'promo_type': variants.get('promo_type')
                }
                price_data.append(price_entry)
            
            # Detectar anomalías antes de guardar
            anomalies = self.detect_anomalies(price_data)
            if anomalies:
                logger.warning(f"Anomalías detectadas antes de guardar: {len(anomalies)}")
            
            # Insertar en Supabase
            success = self.supabase.insert_price_history(price_data)
            
            if success:
                logger.info(f"Guardados {len(price_data)} precios en Supabase")
                
                # Crear snapshot después de guardar
                self.incremental_manager.create_snapshot()
            else:
                logger.error("Error al guardar en Supabase")
            
            return success
            
        except Exception as e:
            logger.error(f"Error al guardar en Supabase: {e}")
            return False
    
    def run(self, csv_file: str, sources_filter: Optional[List[str]] = None, save_to_db: bool = True) -> bool:
        """Ejecutar el proceso completo de scraping con todas las funcionalidades"""
        try:
            # Cargar datos de entrada
            input_data = self.load_input_data(csv_file)
            if not input_data:
                logger.error("No se pudieron cargar datos de entrada")
                return False
            
            # Realizar scraping
            batch = self.scrape_batch(input_data, sources_filter)
            
            # Guardar en base de datos si se solicita
            if save_to_db and batch.successful_scrapes > 0:
                self.save_to_supabase(batch)
            
            # Guardar resultados en CSV
            self.save_results_to_csv(batch, f"results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
            
            # Limpiar datos expirados
            self.retention_manager.cleanup_expired_data()
            
            return batch.successful_scrapes > 0
            
        except Exception as e:
            logger.error(f"Error en el proceso de scraping: {e}")
            return False
    
    def save_results_to_csv(self, batch: ScrapingBatch, filename: str):
        """Guardar resultados en archivo CSV con datos adicionales"""
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as file:
                fieldnames = [
                    'card_name', 'source', 'price', 'currency', 'condition',
                    'is_foil', 'is_etched', 'stock_quantity', 'url', 'scraped_at',
                    'success', 'error_message', 'art_variant_type', 'foil_type',
                    'edition', 'treatment', 'promo_type'
                ]
                
                writer = csv.DictWriter(file, fieldnames=fieldnames)
                writer.writeheader()
                
                for result in batch.results:
                    # Detectar variantes para cada resultado
                    variants = {}
                    if result.success:
                        game_code = self.detect_game_from_url(result.url, result.source)
                        variants = self.detect_variants({
                            'card_name': result.card_name
                        }, result.url, game_code)
                    
                    writer.writerow({
                        'card_name': result.card_name,
                        'source': result.source,
                        'price': result.price,
                        'currency': result.currency,
                        'condition': result.condition,
                        'is_foil': result.is_foil,
                        'is_etched': result.is_etched,
                        'stock_quantity': result.stock_quantity,
                        'url': result.url,
                        'scraped_at': result.scraped_at,
                        'success': result.success,
                        'error_message': result.error_message,
                        'art_variant_type': variants.get('art_variant_type'),
                        'foil_type': variants.get('foil_type'),
                        'edition': variants.get('edition'),
                        'treatment': variants.get('treatment'),
                        'promo_type': variants.get('promo_type')
                    })
            
            logger.info(f"Resultados guardados en {filename}")
            
        except Exception as e:
            logger.error(f"Error al guardar resultados en CSV: {e}")

def main():
    """Función principal"""
    parser = argparse.ArgumentParser(description='Scraper avanzado de precios de cartas TCG')
    parser.add_argument('csv_file', help='Archivo CSV con URLs de cartas')
    parser.add_argument('--sources', nargs='+', help='Fuentes específicas a scrapear (cardmarket, cardkingdom, tcgplayer, trollandtoad)')
    parser.add_argument('--no-save', action='store_true', help='No guardar en base de datos')
    parser.add_argument('--supabase-url', help='URL de Supabase (opcional, usa variables de entorno)')
    parser.add_argument('--supabase-key', help='Clave de Supabase (opcional, usa variables de entorno)')
    parser.add_argument('--show-coverage', action='store_true', help='Mostrar cobertura de TCGs por marketplace')
    parser.add_argument('--no-anti-bot', action='store_true', help='Deshabilitar sistema anti-bot')
    parser.add_argument('--use-proxies', action='store_true', help='Usar proxies para rotación')
    parser.add_argument('--data-dir', default='data', help='Directorio para datos históricos')
    
    args = parser.parse_args()
    
    # Verificar que el archivo CSV existe
    if not Path(args.csv_file).exists():
        logger.error(f"Archivo CSV no encontrado: {args.csv_file}")
        sys.exit(1)
    
    # Obtener configuración de Supabase
    supabase_url = args.supabase_url or 'your-supabase-url'
    supabase_key = args.supabase_key or 'your-supabase-key'
    
    # Crear y ejecutar scraper
    scraper_manager = TCGScraperManager(
        supabase_url=supabase_url,
        supabase_key=supabase_key,
        use_anti_bot=not args.no_anti_bot,
        use_proxies=args.use_proxies,
        data_dir=args.data_dir
    )
    
    # Mostrar cobertura si se solicita
    if args.show_coverage:
        marketplace_info = scraper_manager.get_marketplace_info()
        print("\n=== COBERTURA DE TCGs POR MARKETPLACE ===")
        for source, tcgs in marketplace_info['coverage'].items():
            print(f"\n{source.upper()}:")
            for tcg in tcgs:
                print(f"  ✓ {tcg}")
        
        print("\n=== RESUMEN POR TCG ===")
        for tcg, info in marketplace_info['summary'].items():
            print(f"\n{tcg}:")
            print(f"  Disponible en: {', '.join(info['available_in'])}")
            print(f"  Marketplaces: {info['count']}")
        
        sys.exit(0)
    
    success = scraper_manager.run(
        csv_file=args.csv_file,
        sources_filter=args.sources,
        save_to_db=not args.no_save
    )
    
    if success:
        logger.info("Proceso completado exitosamente")
        sys.exit(0)
    else:
        logger.error("Proceso falló")
        sys.exit(1)

if __name__ == "__main__":
    main() 