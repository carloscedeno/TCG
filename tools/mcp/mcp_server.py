#!/usr/bin/env python3
"""
MCP Server for MTG TCG Web App Documentation
Exposes all project documentation, architecture, and technical specifications
"""

import asyncio
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence
import logging

from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from mcp.types import (
    Resource,
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
    LoggingLevel,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the MCP server
server = Server("mtg-docs")

# Project root path
PROJECT_ROOT = Path(__file__).parent
DOCS_PATH = PROJECT_ROOT / "Documentación"
TECHDOCS_PATH = DOCS_PATH / "TechDocs"

@server.list_resources()
async def list_resources() -> List[Resource]:
    """List all available documentation resources."""
    resources = []
    
    # Add main documentation files
    main_docs = [
        "Requisitos iniciales.txt",
        "Mejoras_Implementadas.md",
        "TCG_MARKETPLACE_MAPPING.md",
        "ROBUST_SYSTEM_SUMMARY.md"
    ]
    
    for doc in main_docs:
        doc_path = DOCS_PATH / doc
        if doc_path.exists():
            resources.append(
                Resource(
                    uri=f"file://{doc_path}",
                    name=doc,
                    description=f"Main project documentation: {doc}",
                    mimeType="text/plain" if doc.endswith('.txt') else "text/markdown"
                )
            )
    
    # Add TCG structure documents
    tcg_docs = [
        "Estructura Detallada Cartas MTG_.txt",
        "Estructura Detallada Cartas Pokémon_.txt",
        "Estructura Detallada Cartas Yu-Gi-Oh! TCG_.txt",
        "Estructura Detallada Cartas Lorcana TCG_.txt",
        "Estructura Detallada Cartas One Piece TCG_.txt",
        "Estructura Detallada Cartas Flesh and Blood TCG_.txt",
        "Estructura Detallada Cartas Wixoss TCG_.txt"
    ]
    
    for doc in tcg_docs:
        doc_path = DOCS_PATH / doc
        if doc_path.exists():
            resources.append(
                Resource(
                    uri=f"file://{doc_path}",
                    name=doc,
                    description=f"TCG structure documentation: {doc}",
                    mimeType="text/plain"
                )
            )
    
    # Add TechDocs resources
    techdocs_files = [
        "README.md",
        "architecture.md",
        "data-dictionary.md",
        "environment-setup.md"
    ]
    
    for doc in techdocs_files:
        doc_path = TECHDOCS_PATH / doc
        if doc_path.exists():
            resources.append(
                Resource(
                    uri=f"file://{doc_path}",
                    name=f"TechDocs/{doc}",
                    description=f"Technical documentation: {doc}",
                    mimeType="text/markdown"
                )
            )
    
    # Add database documentation
    db_readme = TECHDOCS_PATH / "database" / "README.md"
    if db_readme.exists():
        resources.append(
            Resource(
                uri=f"file://{db_readme}",
                name="TechDocs/database/README.md",
                description="Database documentation and schema",
                mimeType="text/markdown"
            )
        )
    
    # Add API documentation
    api_readme = TECHDOCS_PATH / "apis" / "README.md"
    if api_readme.exists():
        resources.append(
            Resource(
                uri=f"file://{api_readme}",
                name="TechDocs/apis/README.md",
                description="API documentation and endpoints",
                mimeType="text/markdown"
            )
        )
    
    return resources

@server.read_resource()
async def read_resource(uri: str) -> str:
    """Read the content of a resource."""
    try:
        # Remove file:// prefix if present
        if uri.startswith("file://"):
            file_path = Path(uri[7:])
        else:
            file_path = Path(uri)
        
        if not file_path.exists():
            raise FileNotFoundError(f"Resource not found: {uri}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        logger.info(f"Read resource: {uri}")
        return content
        
    except Exception as e:
        logger.error(f"Error reading resource {uri}: {e}")
        raise

@server.list_tools()
async def list_tools() -> List[Tool]:
    """List all available tools for querying documentation."""
    return [
        Tool(
            name="get_project_overview",
            description="Get an overview of the MTG TCG Web App project structure and main components",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="get_architecture_info",
            description="Get detailed information about the system architecture, including Supabase setup, Edge Functions, and database design",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="get_database_schema",
            description="Get the complete database schema including tables, relationships, and data dictionary",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="get_api_documentation",
            description="Get API documentation including endpoints, Edge Functions, and integration details",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="get_environment_setup",
            description="Get environment setup instructions, configuration, and deployment information",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="get_tcg_structures",
            description="Get information about TCG card structures for different games (MTG, Pokémon, Yu-Gi-Oh!, etc.)",
            inputSchema={
                "type": "object",
                "properties": {
                    "tcg_type": {
                        "type": "string",
                        "enum": ["MTG", "Pokémon", "Yu-Gi-Oh!", "Lorcana", "One Piece", "Flesh and Blood", "Wixoss"],
                        "description": "The specific TCG to get structure information for"
                    }
                },
                "required": []
            }
        ),
        Tool(
            name="get_development_guidelines",
            description="Get development guidelines, testing procedures, and best practices",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="search_documentation",
            description="Search through all documentation for specific topics, keywords, or technical concepts",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query to find in documentation"
                    },
                    "category": {
                        "type": "string",
                        "enum": ["all", "architecture", "database", "api", "setup", "tcg", "development"],
                        "description": "Category to search in (optional)"
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="get_test_status",
            description="Get the status of all automated tests (unit and integration), including pass/fail counts and last run.",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="get_test_coverage",
            description="Get the code coverage report for all automated tests, including global and per-module coverage.",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Execute tools to retrieve specific documentation information."""
    
    async def read_file_content(file_path: Path) -> str:
        """Helper to read file content with error handling."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error reading {file_path}: {e}")
            return f"Error reading file: {e}"
    
    if name == "get_project_overview":
        content = []
        
        # Read main requirements
        req_file = DOCS_PATH / "Requisitos iniciales.txt"
        if req_file.exists():
            content.append(TextContent(
                type="text",
                text=f"## Project Requirements\n\n{await read_file_content(req_file)}"
            ))
        
        # Read improvements
        improvements_file = DOCS_PATH / "Mejoras_Implementadas.md"
        if improvements_file.exists():
            content.append(TextContent(
                type="text",
                text=f"## Implemented Improvements\n\n{await read_file_content(improvements_file)}"
            ))
        
        # Read system summary
        summary_file = TECHDOCS_PATH / "ROBUST_SYSTEM_SUMMARY.md"
        if summary_file.exists():
            content.append(TextContent(
                type="text",
                text=f"## System Summary\n\n{await read_file_content(summary_file)}"
            ))
        
        return content
    
    elif name == "get_architecture_info":
        content = []
        
        # Read architecture document
        arch_file = TECHDOCS_PATH / "architecture.md"
        if arch_file.exists():
            content.append(TextContent(
                type="text",
                text=f"## System Architecture\n\n{await read_file_content(arch_file)}"
            ))
        
        # Read Supabase documentation
        supabase_readme = TECHDOCS_PATH / "supabase" / "README.md"
        if supabase_readme.exists():
            content.append(TextContent(
                type="text",
                text=f"## Supabase Configuration\n\n{await read_file_content(supabase_readme)}"
            ))
        
        return content
    
    elif name == "get_database_schema":
        content = []
        
        # Read data dictionary
        data_dict_file = TECHDOCS_PATH / "data-dictionary.md"
        if data_dict_file.exists():
            content.append(TextContent(
                type="text",
                text=f"## Data Dictionary\n\n{await read_file_content(data_dict_file)}"
            ))
        
        # Read database README
        db_readme = TECHDOCS_PATH / "database" / "README.md"
        if db_readme.exists():
            content.append(TextContent(
                type="text",
                text=f"## Database Documentation\n\n{await read_file_content(db_readme)}"
            ))
        
        return content
    
    elif name == "get_api_documentation":
        content = []
        
        # Read API documentation
        api_readme = TECHDOCS_PATH / "apis" / "README.md"
        if api_readme.exists():
            content.append(TextContent(
                type="text",
                text=f"## API Documentation\n\n{await read_file_content(api_readme)}"
            ))
        
        return content
    
    elif name == "get_environment_setup":
        content = []
        
        # Read environment setup
        setup_file = TECHDOCS_PATH / "environment-setup.md"
        if setup_file.exists():
            content.append(TextContent(
                type="text",
                text=f"## Environment Setup\n\n{await read_file_content(setup_file)}"
            ))
        
        return content
    
    elif name == "get_tcg_structures":
        tcg_type = arguments.get("tcg_type", "MTG")
        
        # Map TCG types to file names
        tcg_files = {
            "MTG": "Estructura Detallada Cartas MTG_.txt",
            "Pokémon": "Estructura Detallada Cartas Pokémon_.txt",
            "Yu-Gi-Oh!": "Estructura Detallada Cartas Yu-Gi-Oh! TCG_.txt",
            "Lorcana": "Estructura Detallada Cartas Lorcana TCG_.txt",
            "One Piece": "Estructura Detallada Cartas One Piece TCG_.txt",
            "Flesh and Blood": "Estructura Detallada Cartas Flesh and Blood TCG_.txt",
            "Wixoss": "Estructura Detallada Cartas Wixoss TCG_.txt"
        }
        
        file_name = tcg_files.get(tcg_type, tcg_files["MTG"])
        file_path = DOCS_PATH / file_name
        
        if file_path.exists():
            return [TextContent(
                type="text",
                text=f"## {tcg_type} Card Structure\n\n{await read_file_content(file_path)}"
            )]
        else:
            return [TextContent(
                type="text",
                text=f"Documentation for {tcg_type} not found."
            )]
    
    elif name == "get_development_guidelines":
        content = []
        
        # Read development documentation
        dev_readme = TECHDOCS_PATH / "development" / "README.md"
        if dev_readme.exists():
            content.append(TextContent(
                type="text",
                text=f"## Development Guidelines\n\n{await read_file_content(dev_readme)}"
            ))
        
        return content
    
    elif name == "search_documentation":
        query = arguments.get("query", "").lower()
        category = arguments.get("category", "all")
        
        if not query:
            return [TextContent(
                type="text",
                text="Please provide a search query."
            )]
        
        # Define searchable files by category
        searchable_files = {
            "all": [
                (DOCS_PATH / "Requisitos iniciales.txt", "Requirements"),
                (DOCS_PATH / "Mejoras_Implementadas.md", "Improvements"),
                (TECHDOCS_PATH / "architecture.md", "Architecture"),
                (TECHDOCS_PATH / "data-dictionary.md", "Data Dictionary"),
                (TECHDOCS_PATH / "environment-setup.md", "Environment Setup"),
                (TECHDOCS_PATH / "README.md", "TechDocs Overview"),
                (TECHDOCS_PATH / "apis" / "README.md", "API Documentation"),
                (TECHDOCS_PATH / "database" / "README.md", "Database Documentation")
            ],
            "architecture": [
                (TECHDOCS_PATH / "architecture.md", "Architecture"),
                (TECHDOCS_PATH / "README.md", "TechDocs Overview")
            ],
            "database": [
                (TECHDOCS_PATH / "data-dictionary.md", "Data Dictionary"),
                (TECHDOCS_PATH / "database" / "README.md", "Database Documentation")
            ],
            "api": [
                (TECHDOCS_PATH / "apis" / "README.md", "API Documentation")
            ],
            "setup": [
                (TECHDOCS_PATH / "environment-setup.md", "Environment Setup")
            ],
            "tcg": [
                (DOCS_PATH / "Estructura Detallada Cartas MTG_.txt", "MTG Structure"),
                (DOCS_PATH / "Estructura Detallada Cartas Pokémon_.txt", "Pokémon Structure"),
                (DOCS_PATH / "Estructura Detallada Cartas Yu-Gi-Oh! TCG_.txt", "Yu-Gi-Oh! Structure")
            ],
            "development": [
                (TECHDOCS_PATH / "development" / "README.md", "Development Guidelines")
            ]
        }
        
        files_to_search = searchable_files.get(category, searchable_files["all"])
        results = []
        
        for file_path, description in files_to_search:
            if file_path.exists():
                try:
                    content = await read_file_content(file_path)
                    if query in content.lower():
                        # Extract relevant section (simplified)
                        lines = content.split('\n')
                        relevant_lines = []
                        for i, line in enumerate(lines):
                            if query in line.lower():
                                # Get context around the match
                                start = max(0, i - 5)
                                end = min(len(lines), i + 6)
                                relevant_lines.extend(lines[start:end])
                        
                        if relevant_lines:
                            results.append(f"## {description}\n\n" + '\n'.join(relevant_lines))
                except Exception as e:
                    logger.error(f"Error searching {file_path}: {e}")
        
        if results:
            return [TextContent(
                type="text",
                text=f"## Search Results for '{query}'\n\n" + "\n\n---\n\n".join(results)
            )]
        else:
            return [TextContent(
                type="text",
                text=f"No results found for '{query}' in category '{category}'."
            )]
    
    elif name == "get_test_status":
        import subprocess
        import re
        result = subprocess.run([
            "pytest", "--maxfail=1", "--disable-warnings", "--tb=short", "--no-header", "--no-summary"
        ], capture_output=True, text=True)
        output = result.stdout + result.stderr
        passed = len(re.findall(r"PASSED", output))
        failed = len(re.findall(r"FAILED|ERROR", output))
        total = passed + failed
        return [TextContent(
            text=f"Test status: {passed} passed, {failed} failed, {total} total.\n\nOutput:\n{output[:1000]}"
        )]
    
    elif name == "get_test_coverage":
        import subprocess
        result = subprocess.run([
            "pytest", "--cov=src", "--cov-report=term-missing", "--maxfail=1", "--disable-warnings", "--tb=short", "--no-header", "--no-summary"
        ], capture_output=True, text=True)
        output = result.stdout + result.stderr
        # Buscar línea de cobertura global
        import re
        match = re.search(r"TOTAL\s+\d+\s+\d+\s+\d+%", output)
        coverage = match.group(0) if match else "No coverage info found."
        return [TextContent(
            text=f"Coverage summary: {coverage}\n\nOutput:\n{output[:1000]}"
        )]
    
    else:
        return [TextContent(
            type="text",
            text=f"Unknown tool: {name}"
        )]

async def main():
    """Run the MCP server."""
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Create stdio server
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="mtg-docs",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=None,
                    experimental_capabilities=None,
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main()) 