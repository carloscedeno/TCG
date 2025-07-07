#!/usr/bin/env python3
"""
Test script for MTG Documentation MCP Server
Verifies functionality and document access
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, Any

# Import the MCP server functions
try:
    from mcp_server import server, list_resources, read_resource, list_tools, call_tool
except ImportError as e:
    print(f"Error importing MCP server: {e}")
    print("Make sure mcp_server.py is in the current directory")
    sys.exit(1)

async def test_resources():
    """Test resource listing functionality."""
    print("Testing resource listing...")
    
    try:
        resources = await list_resources()
        print(f"Found {len(resources)} resources")
        
        for i, resource in enumerate(resources[:5]):  # Show first 5
            print(f"  {i+1}. {resource.name} - {resource.description}")
        
        if len(resources) > 5:
            print(f"  ... and {len(resources) - 5} more resources")
        
        return True
    except Exception as e:
        print(f"Error listing resources: {e}")
        return False

async def test_tools():
    """Test tool listing functionality."""
    print("\nTesting tool listing...")
    
    try:
        tools = await list_tools()
        print(f"Found {len(tools)} tools")
        
        for tool in tools:
            print(f"  - {tool.name}: {tool.description}")
        
        return True
    except Exception as e:
        print(f"Error listing tools: {e}")
        return False

async def test_document_reading():
    """Test reading specific documents."""
    print("\nTesting document reading...")
    
    # Test reading a known document
    test_files = [
        "Documentación/Requisitos iniciales.txt",
        "Documentación/TechDocs/README.md",
        "Documentación/TechDocs/architecture.md"
    ]
    
    success_count = 0
    for file_path in test_files:
        try:
            content = await read_resource(f"file://{Path.cwd() / file_path}")
            if content and len(content) > 0:
                print(f"Successfully read {file_path} ({len(content)} chars)")
                success_count += 1
            else:
                print(f"Empty content for {file_path}")
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
    
    return success_count > 0

async def test_tool_execution():
    """Test specific tool execution."""
    print("\nTesting tool execution...")
    
    # Test get_project_overview
    try:
        result = await call_tool("get_project_overview", {})
        if result and len(result) > 0:
            print("get_project_overview tool works")
            return True
        else:
            print("get_project_overview returned empty result")
            return False
    except Exception as e:
        print(f"Error executing get_project_overview: {e}")
        return False

async def test_search_functionality():
    """Test search functionality."""
    print("\nTesting search functionality...")
    
    try:
        result = await call_tool("search_documentation", {
            "query": "supabase",
            "category": "all"
        })
        if result and len(result) > 0:
            print("search_documentation tool works")
            return True
        else:
            print("search_documentation returned empty result")
            return False
    except Exception as e:
        print(f"Error executing search_documentation: {e}")
        return False

async def test_tcg_structures():
    """Test TCG structures tool."""
    print("\nTesting TCG structures...")
    
    try:
        result = await call_tool("get_tcg_structures", {
            "tcg_type": "MTG"
        })
        if result and len(result) > 0:
            print("get_tcg_structures tool works")
            return True
        else:
            print("get_tcg_structures returned empty result")
            return False
    except Exception as e:
        print(f"Error executing get_tcg_structures: {e}")
        return False

def check_documentation_files():
    """Check if required documentation files exist."""
    print("\nChecking documentation files...")
    
    required_files = [
        "Documentación/Requisitos iniciales.txt",
        "Documentación/TechDocs/README.md",
        "Documentación/TechDocs/architecture.md",
        "Documentación/TechDocs/data-dictionary.md",
        "Documentación/TechDocs/environment-setup.md",
        "Documentación/TechDocs/apis/README.md",
        "Documentación/TechDocs/database/README.md"
    ]
    
    existing_files = []
    missing_files = []
    
    for file_path in required_files:
        if Path(file_path).exists():
            existing_files.append(file_path)
        else:
            missing_files.append(file_path)
    
    print(f"Found {len(existing_files)} documentation files")
    for file_path in existing_files[:3]:  # Show first 3
        print(f"  - {file_path}")
    
    if missing_files:
        print(f"Missing {len(missing_files)} files:")
        for file_path in missing_files:
            print(f"  - {file_path}")
    
    return len(existing_files) > 0

async def main():
    """Run all tests."""
    print("Testing MTG Documentation MCP Server")
    print("=" * 50)
    
    # Check documentation files
    docs_ok = check_documentation_files()
    
    # Run async tests
    tests = [
        test_resources(),
        test_tools(),
        test_document_reading(),
        test_tool_execution(),
        test_search_functionality(),
        test_tcg_structures()
    ]
    
    results = await asyncio.gather(*tests, return_exceptions=True)
    
    # Report results
    print("\n" + "=" * 50)
    print("Test Results:")
    
    test_names = [
        "Resource listing",
        "Tool listing", 
        "Document reading",
        "Tool execution",
        "Search functionality",
        "TCG structures"
    ]
    
    passed = 0
    for i, (name, result) in enumerate(zip(test_names, results)):
        if isinstance(result, Exception):
            print(f"FAILED {name}: {result}")
        elif result:
            print(f"PASSED {name}")
            passed += 1
        else:
            print(f"FAILED {name}")
    
    print(f"\nSummary: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests) and docs_ok:
        print("All tests passed! MCP server is ready to use.")
        return True
    else:
        print("Some tests failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1) 