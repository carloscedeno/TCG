import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Navigation/Footer';

const LegalPage: React.FC = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30">
            {/* Ambient Background Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <header className="h-[70px] bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 shadow-2xl flex items-center">
                <nav className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between w-full">
                    <Link to="/" className="flex items-center gap-4 group">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-xl italic shadow-lg shadow-white/5 group-hover:scale-110 transition-transform">
                            <ArrowLeft size={18} />
                        </div>
                        <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">
                            <span className="text-neutral-500">Volver al</span> Emporio
                        </h1>
                    </Link>
                </nav>
            </header>

            {/* Content */}
            <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 lg:py-20">

                {/* Spanish Section */}
                <section className="mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-geeko-yellow-legal/10 border border-geeko-yellow-legal/20 text-geeko-yellow-legal text-[10px] font-black uppercase tracking-widest mb-6">
                        Información Importante
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-12 uppercase leading-tight">
                        Aviso Legal, Propiedad Intelectual y Transparencia Comercial
                    </h1>

                    <div className="space-y-12 text-neutral-300 font-medium leading-relaxed">

                        <div className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-sm text-neutral-400">1</span>
                                Identificación y Neutralidad
                            </h2>
                            <p className="text-sm opacity-80">
                                <strong>Geekorium El Emporio – RIF:.</strong> Geekorium es una plataforma tecnológica independiente de mercado secundario (marketplace) operada por [Nombre de tu Empresa/Proyecto]. Esta aplicación actúa única y exclusivamente como un intermediario neutral que facilita la conexión técnica entre usuarios terceros para la compra y venta de artículos coleccionables físicos de segunda mano. Geekorium no posee, no vende, no garantiza ni mantiene inventario propio de los productos listados por los usuarios, ni actúa como representante, agente o franquicia de los vendedores.
                            </p>
                        </div>

                        <div className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-sm text-neutral-400">2</span>
                                Propiedad Intelectual (WotC)
                            </h2>
                            <p className="text-sm opacity-80 mb-4">
                                Esta plataforma no está afiliada, respaldada, patrocinada ni aprobada específicamente por Wizards of the Coast LLC ni por Hasbro, Inc. Magic: The Gathering (MTG), incluyendo de manera enunciativa pero no limitativa: sus logotipos, nombres de cartas, símbolos de maná, símbolos de expansión, textos de ambientación (flavor text), reglas de juego, mecánicas originales, arte de las cartas, ilustraciones, diseños de marcos, nombres de personajes y de planos de existencia, son marcas registradas y material protegido por derechos de autor propiedad de Wizards of the Coast LLC, una subsidiaria de Hasbro, Inc. © 1993-2026 Wizards of the Coast LLC. Todos los derechos reservados.
                            </p>
                            <p className="text-sm opacity-80">
                                El uso de estos activos en esta Aplicación se realiza bajo la doctrina del Uso Nominativo y el principio de Agotamiento Internacional de Derechos de Marca, conforme al Artículo 158 de la <a href="http://www.sice.oas.org/trade/junac/decisiones/dec486s5.asp" target="_blank" rel="noopener noreferrer" className="text-geeko-cyan hover:underline">Decisión 486</a> y la Ley de Propiedad Industrial de Venezuela. Dicho uso tiene fines estrictamente informativos, referenciales y de identificación de productos originales dentro del tráfico mercantil legítimo.
                            </p>
                        </div>

                        <div className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-sm text-neutral-400">3</span>
                                Atribución de Datos y APIs
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-white mb-2 uppercase text-xs tracking-widest">Scryfall</h3>
                                    <p className="text-sm opacity-80">
                                        Toda la información literal y gráfica de las cartas visualizada en esta plataforma es proporcionada por la API de Scryfall LLC. Card data provided by Scryfall. Este contenido se utiliza conforme a la <a href="https://company.wizards.com/en/legal/fancontentpolicy" className="text-geeko-cyan hover:underline">Fan Content Policy</a> y las <a href="https://scryfall.com/docs/api" className="text-geeko-cyan hover:underline">Guías de API de Scryfall</a>. El acceso a estos datos es gratuito para el usuario final y Geekorium no impone muros de pago para la consulta de dicha información.
                                    </p>
                                </div>
                                <div className="h-px bg-white/10" />
                                <div>
                                    <h3 className="font-bold text-white mb-2 uppercase text-xs tracking-widest">CardKingdom & Precios</h3>
                                    <p className="text-sm opacity-80">
                                        Los valores monetarios mostrados como "Precio de Referencia" o "Market Price" se derivan de datos públicos de mercado de CardKingdom. Estos precios son exclusivamente referenciales y orientativos, proporcionados para facilitar la valoración equitativa en transacciones entre particulares (Peer-to-Peer). CardKingdom no garantiza la exactitud ni la disponibilidad de productos en esta Aplicación, y Geekorium se desvincula de cualquier discrepancia de precios conforme a los <a href="https://www.cardkingdom.com/static/tos" className="text-geeko-cyan hover:underline">Términos de CardKingdom</a>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-neutral-900/50 p-8 rounded-3xl border border-white/5">
                                <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-3">
                                    <span className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center text-xs text-neutral-400">4</span>
                                    Normativa (Venezuela)
                                </h2>
                                <ul className="text-xs opacity-70 list-disc list-inside space-y-2">
                                    <li>Precios establecidos libremente por el vendedor.</li>
                                    <li>Geekorium no garantiza precios referenciales externos.</li>
                                    <li>Operaciones en divisas según tasa oficial <a href="https://www.bcv.org.ve/" className="text-geeko-cyan hover:underline">BCV</a>.</li>
                                </ul>
                            </div>

                            <div className="bg-neutral-900/50 p-8 rounded-3xl border border-white/5">
                                <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-3">
                                    <span className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center text-xs text-neutral-400">5</span>
                                    Seguridad y Edad
                                </h2>
                                <p className="text-xs opacity-70">
                                    Prohibida la venta de falsificaciones/proxies. Violación causa expulsión inmediata. Servicio exclusivo para mayores de 18 años con capacidad legal.
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-16" />

                {/* English Section */}
                <section className="mb-20 opacity-70 hover:opacity-100 transition-opacity duration-500">
                    <h2 className="text-2xl font-black italic tracking-tighter text-neutral-500 mb-8 uppercase">
                        Comprehensive Legal Notice (English)
                    </h2>

                    <div className="space-y-8 text-neutral-400 text-sm font-medium leading-relaxed">

                        <div>
                            <h3 className="font-bold text-white mb-2 uppercase text-xs tracking-widest">1. Platform Identity & Neutrality</h3>
                            <p>
                                Geekorium El Emporio – Tax ID (RIF):. Geekorium is an independent, third-party technological marketplace platform operated by [Company Name]. This Application acts solely as a neutral venue to facilitate technical connections between third-party users for the peer-to-peer purchase and sale of genuine physical collectible goods. Geekorium does not own, sell, or guarantee any inventory listed by third parties, nor does it act as an agent, franchise, or official representative of such sellers.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-white mb-2 uppercase text-xs tracking-widest">2. Intellectual Property Acknowledgment</h3>
                            <p>
                                This platform is not affiliated with, endorsed, sponsored, or specifically approved by Wizards of the Coast LLC or Hasbro, Inc. Magic: The Gathering (MTG), including but not limited to its logos, card names, mana symbols, expansion symbols, flavor text, gameplay mechanics, card artwork, illustrations, frame designs, character names, and planes of existence, are trademarks and copyrighted material owned by Wizards of the Coast LLC, a subsidiary of Hasbro, Inc. © 1993-2026 Wizards of the Coast LLC. All rights reserved. The use of these assets within this Application is strictly for informational, referential, and product identification purposes in the course of trade, pursuant to the Nominative Fair Use doctrine and the International Exhaustion of Trademark Rights principle.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-white mb-2 uppercase text-xs tracking-widest">3. Third-Party Data & API Attribution</h3>
                            <p className="mb-2">
                                <strong>Scryfall:</strong> Literal and graphical card information presented is provided by the Scryfall API. Card data provided by Scryfall. This material is used in compliance with the Wizards Fan Content Policy. Access to this data remains free of charge for all end-users.
                            </p>
                            <p>
                                <strong>CardKingdom (Pricing):</strong> Monetary values displayed as "Referential Prices" are based on public market data from CardKingdom. These values are provided solely as a valuation guide for user-to-user transactions and do not constitute a binding sales offer, a price guarantee, or a reflection of CardKingdom's actual inventory on this platform.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-white mb-2 uppercase text-xs tracking-widest">4. Commercial Transparency & Regional Compliance</h3>
                            <p>
                                Pursuant to Venezuelan Fair Price Laws and SUNDDE regulations, users are informed that final sales prices are determined independently by sellers. All local transactions involving foreign currency must comply with the official exchange rates published by the <a href="https://www.bcv.org.ve/" className="text-geeko-cyan hover:underline">BCV</a> on the date of the transaction.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-white mb-2 uppercase text-xs tracking-widest">5. Anti-Counterfeiting & Age Requirements</h3>
                            <p>
                                The sale of unauthorized reproductions, counterfeits, or "proxies" is strictly prohibited and constitutes a violation of Wizards of the Coast's intellectual property rights. Users must be at least 18 years old to buy or sell on this platform.
                            </p>
                        </div>

                    </div>
                </section>

                <div className="flex justify-center mt-20">
                    <img src="/branding/Logo.jpg" alt="Logo" className="w-16 h-16 rounded-full opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700" />
                </div>

            </main>

            <Footer />
        </div>
    );
};

export default LegalPage;
