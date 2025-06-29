"""
Sistema avanzado de anti-bot y scraping ético
Implementa técnicas para evitar detección y bloqueos
"""

import random
import time
import requests
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class ProxyConfig:
    """Configuración de proxy para rotación"""
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    protocol: str = "http"
    
    @property
    def url(self) -> str:
        """Genera la URL del proxy"""
        if self.username and self.password:
            return f"{self.protocol}://{self.username}:{self.password}@{self.host}:{self.port}"
        return f"{self.protocol}://{self.host}:{self.port}"

class UserAgentRotator:
    """Rotador de User-Agents para evitar detección"""
    
    # Lista de User-Agents realistas
    USER_AGENTS = [
        # Chrome
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        
        # Firefox
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
        
        # Safari
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
        
        # Edge
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        
        # Mobile
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    ]
    
    def __init__(self):
        self.used_agents = []
        self.current_index = 0
    
    def get_random_agent(self) -> str:
        """Obtiene un User-Agent aleatorio"""
        return random.choice(self.USER_AGENTS)
    
    def get_next_agent(self) -> str:
        """Obtiene el siguiente User-Agent en secuencia"""
        agent = self.USER_AGENTS[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.USER_AGENTS)
        return agent
    
    def get_agent_for_platform(self, platform: str) -> str:
        """Obtiene un User-Agent específico para una plataforma"""
        platform_agents = {
            'mobile': [agent for agent in self.USER_AGENTS if 'Mobile' in agent or 'iPhone' in agent],
            'desktop': [agent for agent in self.USER_AGENTS if 'Mobile' not in agent and 'iPhone' not in agent],
            'chrome': [agent for agent in self.USER_AGENTS if 'Chrome' in agent],
            'firefox': [agent for agent in self.USER_AGENTS if 'Firefox' in agent],
            'safari': [agent for agent in self.USER_AGENTS if 'Safari' in agent and 'Chrome' not in agent]
        }
        
        available = platform_agents.get(platform.lower(), self.USER_AGENTS)
        return random.choice(available)

class ProxyManager:
    """Gestor de proxies para rotación y distribución de carga"""
    
    def __init__(self):
        self.proxies: List[ProxyConfig] = []
        self.current_index = 0
        self.failed_proxies: Dict[str, int] = {}  # proxy_url -> failure_count
    
    def add_proxy(self, proxy: ProxyConfig):
        """Agrega un proxy a la lista"""
        self.proxies.append(proxy)
    
    def add_proxy_list(self, proxy_list: List[ProxyConfig]):
        """Agrega múltiples proxies"""
        self.proxies.extend(proxy_list)
    
    def get_next_proxy(self) -> Optional[ProxyConfig]:
        """Obtiene el siguiente proxy en rotación"""
        if not self.proxies:
            return None
        
        # Filtrar proxies que han fallado demasiado
        working_proxies = [
            proxy for proxy in self.proxies 
            if self.failed_proxies.get(proxy.url, 0) < 3
        ]
        
        if not working_proxies:
            # Resetear contadores de fallos si todos han fallado
            self.failed_proxies.clear()
            working_proxies = self.proxies
        
        proxy = working_proxies[self.current_index % len(working_proxies)]
        self.current_index += 1
        return proxy
    
    def get_random_proxy(self) -> Optional[ProxyConfig]:
        """Obtiene un proxy aleatorio"""
        if not self.proxies:
            return None
        
        working_proxies = [
            proxy for proxy in self.proxies 
            if self.failed_proxies.get(proxy.url, 0) < 3
        ]
        
        if not working_proxies:
            self.failed_proxies.clear()
            working_proxies = self.proxies
        
        return random.choice(working_proxies)
    
    def mark_proxy_failed(self, proxy: ProxyConfig):
        """Marca un proxy como fallido"""
        self.failed_proxies[proxy.url] = self.failed_proxies.get(proxy.url, 0) + 1
        logger.warning(f"Proxy {proxy.host}:{proxy.port} marcado como fallido")
    
    def mark_proxy_success(self, proxy: ProxyConfig):
        """Marca un proxy como exitoso (resetea contador de fallos)"""
        if proxy.url in self.failed_proxies:
            del self.failed_proxies[proxy.url]
    
    def test_proxy(self, proxy: ProxyConfig, timeout: int = 10) -> bool:
        """Prueba si un proxy funciona"""
        try:
            proxies = {
                'http': proxy.url,
                'https': proxy.url
            }
            
            response = requests.get(
                'https://httpbin.org/ip',
                proxies=proxies,
                timeout=timeout,
                headers={'User-Agent': UserAgentRotator().get_random_agent()}
            )
            
            if response.status_code == 200:
                logger.info(f"Proxy {proxy.host}:{proxy.port} funciona correctamente")
                return True
            else:
                logger.warning(f"Proxy {proxy.host}:{proxy.port} falló con status {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error probando proxy {proxy.host}:{proxy.port}: {e}")
            return False

class RateLimiter:
    """Limitador de tasa para evitar sobrecarga de servidores"""
    
    def __init__(self, requests_per_minute: int = 30, requests_per_hour: int = 1000):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.request_times: List[float] = []
    
    def can_make_request(self) -> bool:
        """Verifica si se puede hacer una nueva petición"""
        current_time = time.time()
        
        # Limpiar peticiones antiguas
        self.request_times = [t for t in self.request_times if current_time - t < 3600]  # 1 hora
        
        # Verificar límite por minuto
        recent_requests = [t for t in self.request_times if current_time - t < 60]
        if len(recent_requests) >= self.requests_per_minute:
            return False
        
        # Verificar límite por hora
        if len(self.request_times) >= self.requests_per_hour:
            return False
        
        return True
    
    def record_request(self):
        """Registra una petición realizada"""
        self.request_times.append(time.time())
    
    def get_wait_time(self) -> float:
        """Calcula cuánto tiempo esperar antes de la siguiente petición"""
        current_time = time.time()
        
        # Verificar límite por minuto
        recent_requests = [t for t in self.request_times if current_time - t < 60]
        if len(recent_requests) >= self.requests_per_minute:
            oldest_recent = min(recent_requests)
            return 60 - (current_time - oldest_recent) + 1
        
        # Verificar límite por hora
        if len(self.request_times) >= self.requests_per_hour:
            oldest_request = min(self.request_times)
            return 3600 - (current_time - oldest_request) + 1
        
        return 0
    
    def wait_if_needed(self):
        """Espera si es necesario según los límites de tasa"""
        wait_time = self.get_wait_time()
        if wait_time > 0:
            logger.info(f"Esperando {wait_time:.2f} segundos por límite de tasa")
            time.sleep(wait_time)

class AntiBotManager:
    """Gestor principal de anti-bot que coordina todas las técnicas"""
    
    def __init__(self, 
                 use_proxies: bool = False,
                 use_user_agent_rotation: bool = True,
                 requests_per_minute: int = 30,
                 requests_per_hour: int = 1000):
        
        self.use_proxies = use_proxies
        self.use_user_agent_rotation = use_user_agent_rotation
        
        # Inicializar componentes
        self.user_agent_rotator = UserAgentRotator() if use_user_agent_rotation else None
        self.proxy_manager = ProxyManager() if use_proxies else None
        self.rate_limiter = RateLimiter(requests_per_minute, requests_per_hour)
        
        # Configuración de pausas
        self.min_delay = 1.0  # segundos mínimo entre peticiones
        self.max_delay = 3.0  # segundos máximo entre peticiones
        self.last_request_time = 0
    
    def get_request_config(self) -> Dict[str, Any]:
        """Obtiene la configuración para una petición HTTP"""
        config = {
            'headers': {},
            'proxies': None,
            'timeout': 30
        }
        
        # Agregar User-Agent rotado
        if self.use_user_agent_rotation and self.user_agent_rotator:
            config['headers']['User-Agent'] = self.user_agent_rotator.get_next_agent()
        
        # Agregar headers adicionales para parecer más humano
        config['headers'].update({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        
        # Agregar proxy si está habilitado
        if self.use_proxies and self.proxy_manager:
            proxy = self.proxy_manager.get_next_proxy()
            if proxy:
                config['proxies'] = {
                    'http': proxy.url,
                    'https': proxy.url
                }
        
        return config
    
    def pre_request(self):
        """Acciones a realizar antes de una petición"""
        # Verificar límites de tasa
        self.rate_limiter.wait_if_needed()
        
        # Pausa aleatoria para parecer más humano
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_delay:
            sleep_time = self.min_delay - time_since_last + random.uniform(0, 1)
            logger.debug(f"Pausa de {sleep_time:.2f} segundos para simular comportamiento humano")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
        self.rate_limiter.record_request()
    
    def post_request(self, success: bool, proxy: Optional[ProxyConfig] = None):
        """Acciones a realizar después de una petición"""
        if self.use_proxies and self.proxy_manager and proxy:
            if success:
                self.proxy_manager.mark_proxy_success(proxy)
            else:
                self.proxy_manager.mark_proxy_failed(proxy)
    
    def handle_captcha(self, response_text: str) -> bool:
        """Detecta y maneja CAPTCHAs (implementación básica)"""
        captcha_indicators = [
            'captcha', 'recaptcha', 'verify you are human', 'robot check',
            'security check', 'please verify', 'human verification'
        ]
        
        response_lower = response_text.lower()
        for indicator in captcha_indicators:
            if indicator in response_lower:
                logger.warning("CAPTCHA detectado en la respuesta")
                return True
        
        return False
    
    def handle_blocked(self, response_text: str, status_code: int) -> bool:
        """Detecta si la IP ha sido bloqueada"""
        blocked_indicators = [
            'blocked', 'access denied', 'forbidden', 'rate limit exceeded',
            'too many requests', 'temporarily blocked', 'suspicious activity'
        ]
        
        if status_code in [403, 429, 503]:
            logger.warning(f"Posible bloqueo detectado (status {status_code})")
            return True
        
        response_lower = response_text.lower()
        for indicator in blocked_indicators:
            if indicator in response_lower:
                logger.warning(f"Bloqueo detectado: {indicator}")
                return True
        
        return False
    
    def get_random_delay(self) -> float:
        """Obtiene un delay aleatorio para peticiones"""
        return random.uniform(self.min_delay, self.max_delay)
    
    def set_delays(self, min_delay: float, max_delay: float):
        """Configura los delays de peticiones"""
        self.min_delay = min_delay
        self.max_delay = max_delay
    
    def add_proxy(self, proxy: ProxyConfig):
        """Agrega un proxy al gestor"""
        if self.proxy_manager:
            self.proxy_manager.add_proxy(proxy)
    
    def test_all_proxies(self) -> List[ProxyConfig]:
        """Prueba todos los proxies y retorna los que funcionan"""
        if not self.proxy_manager:
            return []
        
        working_proxies = []
        for proxy in self.proxy_manager.proxies:
            if self.proxy_manager.test_proxy(proxy):
                working_proxies.append(proxy)
        
        logger.info(f"Proxies funcionando: {len(working_proxies)}/{len(self.proxy_manager.proxies)}")
        return working_proxies 

__all__ = [
    'AntiBotManager',
    'ProxyConfig',
    'UserAgentRotator',
] 