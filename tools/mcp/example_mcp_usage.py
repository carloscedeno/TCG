#!/usr/bin/env python3
"""
Example usage of MTG Documentation MCP Server
Demonstrates how to use different tools and access documentation
"""

import asyncio
import json
from pathlib import Path

# Import MCP server functions
from mcp_server import call_tool, list_tools, list_resources

async def example_project_overview():
    """Example: Get project overview."""
    print("Example: Getting Project Overview")
    print("-" * 40)
    
    result = await call_tool("get_project_overview", {})
    
    for content in result:
        # Show first 500 characters of each content block
        if hasattr(content, 'text'):
            text = content.text[:500] + "..." if len(content.text) > 500 else content.text
        else:
            text = str(content)[:500] + "..." if len(str(content)) > 500 else str(content)
        print(f"Content Type: {getattr(content, 'type', type(content))}")
        print(f"Content Preview:\n{text}\n")

async def example_architecture_info():
    """Example: Get architecture information."""
    print("Example: Getting Architecture Information")
    print("-" * 40)
    
    result = await call_tool("get_architecture_info", {})
    
    for content in result:
        if hasattr(content, 'text'):
            text = content.text[:500] + "..." if len(content.text) > 500 else content.text
        else:
            text = str(content)[:500] + "..." if len(str(content)) > 500 else str(content)
        print(f"Content Type: {getattr(content, 'type', type(content))}")
        print(f"Content Preview:\n{text}\n")

async def example_database_schema():
    """Example: Get database schema."""
    print("Example: Getting Database Schema")
    print("-" * 40)
    
    result = await call_tool("get_database_schema", {})
    
    for content in result:
        if hasattr(content, 'text'):
            text = content.text[:500] + "..." if len(content.text) > 500 else content.text
        else:
            text = str(content)[:500] + "..." if len(str(content)) > 500 else str(content)
        print(f"Content Type: {getattr(content, 'type', type(content))}")
        print(f"Content Preview:\n{text}\n")

async def example_search_documentation():
    """Example: Search documentation."""
    print("Example: Searching Documentation")
    print("-" * 40)
    
    # Search for Supabase related content
    result = await call_tool("search_documentation", {
        "query": "supabase",
        "category": "all"
    })
    
    for content in result:
        if hasattr(content, 'text'):
            text = content.text[:500] + "..." if len(content.text) > 500 else content.text
        else:
            text = str(content)[:500] + "..." if len(str(content)) > 500 else str(content)
        print(f"Content Type: {getattr(content, 'type', type(content))}")
        print(f"Content Preview:\n{text}\n")

async def example_tcg_structures():
    """Example: Get TCG structures."""
    print("Example: Getting TCG Structures")
    print("-" * 40)
    
    # Get MTG structure
    result = await call_tool("get_tcg_structures", {
        "tcg_type": "MTG"
    })
    
    for content in result:
        if hasattr(content, 'text'):
            text = content.text[:500] + "..." if len(content.text) > 500 else content.text
        else:
            text = str(content)[:500] + "..." if len(str(content)) > 500 else str(content)
        print(f"Content Type: {getattr(content, 'type', type(content))}")
        print(f"Content Preview:\n{text}\n")

async def example_list_all_tools():
    """Example: List all available tools."""
    print("Example: Listing All Available Tools")
    print("-" * 40)
    
    tools = await list_tools()
    
    for tool in tools:
        print(f"Tool: {tool.name}")
        print(f"Description: {tool.description}")
        print(f"Input Schema: {json.dumps(tool.inputSchema, indent=2)}")
        print()

async def example_list_all_resources():
    """Example: List all available resources."""
    print("Example: Listing All Available Resources")
    print("-" * 40)
    
    resources = await list_resources()
    
    print(f"Total Resources: {len(resources)}")
    print("\nFirst 10 resources:")
    
    for i, resource in enumerate(resources[:10]):
        print(f"{i+1}. {resource.name}")
        print(f"   Description: {resource.description}")
        print(f"   MIME Type: {resource.mimeType}")
        print()

async def example_api_documentation():
    """Example: Get API documentation."""
    print("Example: Getting API Documentation")
    print("-" * 40)
    
    result = await call_tool("get_api_documentation", {})
    
    for content in result:
        if hasattr(content, 'text'):
            text = content.text[:500] + "..." if len(content.text) > 500 else content.text
        else:
            text = str(content)[:500] + "..." if len(str(content)) > 500 else str(content)
        print(f"Content Type: {getattr(content, 'type', type(content))}")
        print(f"Content Preview:\n{text}\n")

async def example_environment_setup():
    """Example: Get environment setup information."""
    print("Example: Getting Environment Setup")
    print("-" * 40)
    
    result = await call_tool("get_environment_setup", {})
    
    for content in result:
        if hasattr(content, 'text'):
            text = content.text[:500] + "..." if len(content.text) > 500 else content.text
        else:
            text = str(content)[:500] + "..." if len(str(content)) > 500 else str(content)
        print(f"Content Type: {getattr(content, 'type', type(content))}")
        print(f"Content Preview:\n{text}\n")

async def main():
    """Run all examples."""
    print("MTG Documentation MCP Server - Usage Examples")
    print("=" * 60)
    
    examples = [
        ("Project Overview", example_project_overview),
        ("Architecture Info", example_architecture_info),
        ("Database Schema", example_database_schema),
        ("Search Documentation", example_search_documentation),
        ("TCG Structures", example_tcg_structures),
        ("List All Tools", example_list_all_tools),
        ("List All Resources", example_list_all_resources),
        ("API Documentation", example_api_documentation),
        ("Environment Setup", example_environment_setup)
    ]
    
    for name, example_func in examples:
        try:
            await example_func()
            print("\n" + "=" * 60 + "\n")
        except Exception as e:
            print(f"ERROR in {name}: {e}")
            print("\n" + "=" * 60 + "\n")
    
    print("All examples completed!")

if __name__ == "__main__":
    asyncio.run(main()) 