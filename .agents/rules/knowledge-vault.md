## Obsidian Knowledge Vault & Documentation Protocol

Este proyecto utiliza **Obsidian** en la raiz como su Segundo Cerebro (PKM) de Ingenieria.

### Reglas para Agentes e Ingenieros:

1. **Arquitectura y ADRs**:
   - Todo cambio significativo de arquitectura o modelo de datos DEBE tener un ADR en docs/architecture/adr/ usando la plantilla rchitecture-decision-record-template.md.

2. **Bitacoras de Sesion**:
   - Cada sesion de desarrollo, feature compleja o debug DEBE registrarse en docs/daily-logs/YYYY-MM-DD.md.
   - Incluir: Objetivos, archivos modificados, decisiones tecnicas, soluciones a bugs y proximos pasos.

3. **Bugs e Incidentes**:
   - Investigaciones complejas de fallos deben documentarse en docs/incident_reports/ con causa raiz y prevencion de regresiones.

4. **Integridad de Enlaces**:
   - Usar enlaces bidireccionales [[Ruta/Nota|Titulo]] para interconectar documentos, PRDs y codigo.
   - El punto de entrada principal es [[00 - Geekorium Vault Hub]].

5. **Sinergia con Graphify**:
   - Graphify provee el grafo AST de bajo nivel (graphify query, query_graph).
   - Obsidian provee la vision conceptual y arquitectonica de alto nivel.
   - Despues de cambios de codigo mayores, ejecutar graphify update ..
