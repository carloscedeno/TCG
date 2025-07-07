#!/usr/bin/env python3
"""
Setup script for MTG Documentation MCP Server
Installs dependencies and configures the server
"""

import subprocess
import sys
import os
from pathlib import Path

def install_dependencies():
    """Install required Python packages."""
    requirements = [
        "mcp>=1.0.0",
        "asyncio",
        "pathlib"
    ]
    
    print("Installing MCP server dependencies...")
    for package in requirements:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"Installed {package}")
        except subprocess.CalledProcessError as e:
            print(f"Failed to install {package}: {e}")
            return False
    
    return True

def create_config_files():
    """Create necessary configuration files."""
    
    # Create .mcp directory if it doesn't exist
    mcp_dir = Path.home() / ".mcp"
    mcp_dir.mkdir(exist_ok=True)
    
    # Create config file
    config_content = {
        "mcpServers": {
            "mtg-docs": {
                "command": "python",
                "args": [str(Path.cwd() / "mcp_server.py")],
                "env": {
                    "PYTHONPATH": str(Path.cwd())
                }
            }
        }
    }
    
    config_file = mcp_dir / "config.json"
    import json
    with open(config_file, 'w') as f:
        json.dump(config_content, f, indent=2)
    
    print(f"Created MCP config at {config_file}")
    return True

def test_server():
    """Test if the MCP server can be imported and initialized."""
    try:
        import mcp_server
        print("MCP server module can be imported")
        return True
    except ImportError as e:
        print(f"Failed to import MCP server: {e}")
        return False

def main():
    """Main setup function."""
    print("Setting up MTG Documentation MCP Server...")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("Python 3.8+ is required")
        return False
    
    print(f"Python {sys.version_info.major}.{sys.version_info.minor} detected")
    
    # Install dependencies
    if not install_dependencies():
        return False
    
    # Create config files
    if not create_config_files():
        return False
    
    # Test server
    if not test_server():
        return False
    
    print("\n" + "=" * 50)
    print("MCP Server setup completed successfully!")
    print("\nTo use the MCP server:")
    print("1. Add the config to your MCP client")
    print("2. The server will expose all MTG project documentation")
    print("3. Available tools:")
    print("   - get_project_overview")
    print("   - get_architecture_info")
    print("   - get_database_schema")
    print("   - get_api_documentation")
    print("   - get_environment_setup")
    print("   - get_tcg_structures")
    print("   - get_development_guidelines")
    print("   - search_documentation")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 