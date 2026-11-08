# ADR-001: Integracion de Obsidian como PKM y Centro de Control de Ingenieria

**Fecha**: 2026-10-05
**Estado**: 🟢 Aceptado
**Autores**: Dev Lead & Antigravity AI
**Tags**: #adr #architecture #pkm #obsidian #dx

---

## 📋 Contexto y Problema
El proyecto Geekorium (TCG Marketplace) maneja multiples capas: React/TS en Frontend, Edge Functions en Deno, PostgreSQL en Supabase, scripts de scraping en Python y reglas de negocio (precios, stock, checkout venezolano). La documentacion requeria un sistema unificado y conectado.

## 🎯 Criterios de Decision
- Cero friccion: Archivos Markdown (.md) dentro del mismo repositorio Git.
- Interoperabilidad: Funciona en Obsidian, VS Code, GitHub y asistentes de IA sin conversion.
- Filtrado de ruido: Exclusion de carpetas pesadas (node_modules, .venv, dumps SQL) para mantener rendimiento.

## 🚀 Decision Elegida
Se configuro Obsidian con boveda en la raiz del repositorio:
- Filtros de exclusion en .obsidian/app.json
- Estructura: docs/templates/, docs/daily-logs/, docs/architecture/adr/, docs/patterns/
- Dashboard central: [[00 - Geekorium Vault Hub]]
- Plantillas estandarizadas para Daily Logs, ADRs, Bugs, Features y Patrones.

## 💥 Consecuencias e Impacto
- Productividad y contexto tecnico inmediato antes y despues de cada sesion de codigo.
- Memoria aumentada para pair programming con agentes de IA.

