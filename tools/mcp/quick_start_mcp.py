#!/usr/bin/env python3
"""
Quick Start Script for MTG Documentation MCP Server
Runs complete setup, testing, and provides usage examples
"""

import subprocess
import sys
import asyncio
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors."""
    print(f"\n{description}...")
    try:
        # Use list format to handle paths with spaces
        if isinstance(command, str):
            # Split command into list for proper handling
            cmd_parts = command.split()
            result = subprocess.run(cmd_parts, check=True, capture_output=True, text=True)
        else:
            result = subprocess.run(command, check=True, capture_output=True, text=True)
        print(f"SUCCESS: {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"FAILED: {description} failed: {e}")
        if e.stdout:
            print(f"STDOUT: {e.stdout}")
        if e.stderr:
            print(f"STDERR: {e.stderr}")
        return False

def main():
    """Run the complete MCP server setup."""
    print("MTG Documentation MCP Server - Quick Start")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not Path("Documentación").exists():
        print("ERROR: Documentación directory not found!")
        print("Please run this script from the project root directory.")
        return False
    
    print("SUCCESS: Found documentation directory")
    
    # Step 1: Setup MCP server
    print("\nStep 1: Setting up MCP server...")
    if not run_command([sys.executable, "setup_mcp_server.py"], "MCP server setup"):
        return False
    
    # Step 2: Deploy MCP server
    print("\nStep 2: Deploying MCP server...")
    if not run_command([sys.executable, "deploy_mcp_server.py"], "MCP server deployment"):
        return False
    
    # Step 3: Test MCP server
    print("\nStep 3: Testing MCP server...")
    if not run_command([sys.executable, "test_mcp_server.py"], "MCP server testing"):
        return False
    
    # Step 4: Run examples
    print("\nStep 4: Running usage examples...")
    if not run_command([sys.executable, "example_mcp_usage.py"], "Usage examples"):
        return False
    
    print("\n" + "=" * 60)
    print("MCP Server Setup Complete!")
    print("\nSummary:")
    print("SUCCESS: MCP server installed and configured")
    print("SUCCESS: Server tested and working")
    print("SUCCESS: Examples executed successfully")
    
    print("\nAvailable Files:")
    files = [
        "mcp_server.py - Main MCP server",
        "setup_mcp_server.py - Setup script",
        "deploy_mcp_server.py - Deployment script",
        "test_mcp_server.py - Testing script",
        "example_mcp_usage.py - Usage examples",
        "MCP_SERVER_README.md - Documentation",
        "mcp_config.json - Configuration"
    ]
    
    for file in files:
        print(f"  - {file}")
    
    print("\nNext Steps:")
    print("1. Start the MCP server: python mcp_server.py")
    print("2. Configure your MCP client to connect")
    print("3. Use the available tools to access documentation")
    print("4. Check MCP_SERVER_README.md for detailed instructions")
    
    print("\nAvailable Tools:")
    tools = [
        "get_project_overview - Project overview and requirements",
        "get_architecture_info - System architecture details", 
        "get_database_schema - Database schema and relationships",
        "get_api_documentation - API documentation and endpoints",
        "get_environment_setup - Environment setup instructions",
        "get_tcg_structures - TCG card structures (MTG, Pokémon, etc.)",
        "get_development_guidelines - Development best practices",
        "search_documentation - Search all documentation"
    ]
    
    for tool in tools:
        print(f"  - {tool}")
    
    print("\nDocumentation Exposed:")
    doc_types = [
        "Project requirements and specifications",
        "System architecture (Supabase, Edge Functions, React)",
        "Complete database schema with data dictionary",
        "API documentation and endpoints",
        "Environment setup and deployment guides",
        "TCG card structures for multiple games",
        "Implemented improvements and development progress"
    ]
    
    for doc_type in doc_types:
        print(f"  - {doc_type}")
    
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("\nSUCCESS: Quick start completed successfully!")
    else:
        print("\nFAILED: Quick start failed. Please check the errors above.")
    sys.exit(0 if success else 1) 