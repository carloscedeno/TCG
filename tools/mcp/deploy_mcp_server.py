#!/usr/bin/env python3
"""
Deployment script for MTG Documentation MCP Server
Sets up the server in different environments
"""

import os
import sys
import subprocess
import json
import shutil
from pathlib import Path
import platform

def detect_environment():
    """Detect the current environment."""
    system = platform.system().lower()
    home = Path.home()
    
    print(f"Detected environment:")
    print(f"  System: {system}")
    print(f"  Home directory: {home}")
    
    return system, home

def install_dependencies():
    """Install required dependencies."""
    print("\nInstalling dependencies...")
    
    requirements = [
        "mcp>=1.0.0",
        "asyncio",
        "pathlib"
    ]
    
    for package in requirements:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"Installed {package}")
        except subprocess.CalledProcessError as e:
            print(f"Failed to install {package}: {e}")
            return False
    
    return True

def setup_config_files(system, home):
    """Setup configuration files for the detected environment."""
    print(f"\nSetting up configuration files...")
    
    # Create MCP directory
    mcp_dir = home / ".mcp"
    mcp_dir.mkdir(exist_ok=True)
    print(f"Created MCP directory: {mcp_dir}")
    
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
    with open(config_file, 'w') as f:
        json.dump(config_content, f, indent=2)
    
    print(f"Created config file: {config_file}")
    
    # Create environment-specific configs
    if system == "windows":
        setup_windows_config(home)
    elif system == "darwin":  # macOS
        setup_macos_config(home)
    else:  # Linux
        setup_linux_config(home)
    
    return True

def setup_windows_config(home):
    """Setup Windows-specific configuration."""
    print("Setting up Windows configuration...")
    
    # Create batch file for easy execution
    batch_content = f"""@echo off
cd /d "{Path.cwd()}"
python mcp_server.py
"""
    
    batch_file = Path.cwd() / "run_mcp_server.bat"
    with open(batch_file, 'w') as f:
        f.write(batch_content)
    
    print(f"Created batch file: {batch_file}")

def setup_macos_config(home):
    """Setup macOS-specific configuration."""
    print("Setting up macOS configuration...")
    
    # Create shell script for easy execution
    script_content = f"""#!/bin/bash
cd "{Path.cwd()}"
python3 mcp_server.py
"""
    
    script_file = Path.cwd() / "run_mcp_server.sh"
    with open(script_file, 'w') as f:
        f.write(script_content)
    
    # Make executable
    os.chmod(script_file, 0o755)
    print(f"Created shell script: {script_file}")

def setup_linux_config(home):
    """Setup Linux-specific configuration."""
    print("Setting up Linux configuration...")
    
    # Create shell script for easy execution
    script_content = f"""#!/bin/bash
cd "{Path.cwd()}"
python3 mcp_server.py
"""
    
    script_file = Path.cwd() / "run_mcp_server.sh"
    with open(script_file, 'w') as f:
        f.write(script_content)
    
    # Make executable
    os.chmod(script_file, 0o755)
    print(f"Created shell script: {script_file}")

def create_desktop_shortcut(system, home):
    """Create desktop shortcut for easy access."""
    print(f"\nCreating desktop shortcut...")
    
    if system == "windows":
        desktop = home / "Desktop"
        shortcut_content = f"""[InternetShortcut]
URL=file://{Path.cwd()}/run_mcp_server.bat
"""
        shortcut_file = desktop / "MTG MCP Server.url"
        with open(shortcut_file, 'w') as f:
            f.write(shortcut_content)
        print(f"Created desktop shortcut: {shortcut_file}")
    
    elif system == "darwin":
        # macOS doesn't typically use desktop shortcuts
        print("Desktop shortcuts not typically used on macOS")
    
    else:
        # Linux desktop shortcut
        desktop = home / "Desktop"
        if desktop.exists():
            desktop_entry = f"""[Desktop Entry]
Version=1.0
Type=Application
Name=MTG MCP Server
Comment=MTG Documentation MCP Server
Exec={Path.cwd()}/run_mcp_server.sh
Terminal=true
Categories=Development;
"""
            desktop_file = desktop / "mtg-mcp-server.desktop"
            with open(desktop_file, 'w') as f:
                f.write(desktop_entry)
            os.chmod(desktop_file, 0o755)
            print(f"Created desktop shortcut: {desktop_file}")

def test_deployment():
    """Test the deployment."""
    print(f"\nTesting deployment...")
    
    try:
        # Test if server can be imported
        import mcp_server
        print("MCP server module imports successfully")
        
        # Test basic functionality
        import asyncio
        from mcp_server import list_tools
        
        async def test():
            tools = await list_tools()
            return len(tools) > 0
        
        result = asyncio.run(test())
        if result:
            print("MCP server tools are accessible")
        else:
            print("No tools found")
        
        return True
        
    except Exception as e:
        print(f"Deployment test failed: {e}")
        return False

def create_usage_guide(system):
    """Create a usage guide for the deployed server."""
    print(f"\nCreating usage guide...")
    
    guide_content = f"""# MTG MCP Server - Usage Guide

## Quick Start

### Windows
1. Double-click `run_mcp_server.bat` or the desktop shortcut
2. The server will start and be available for MCP clients

### macOS/Linux
1. Run `./run_mcp_server.sh` in terminal
2. Or double-click the desktop shortcut (Linux)

## Available Tools

- `get_project_overview` - Project overview and requirements
- `get_architecture_info` - System architecture details
- `get_database_schema` - Database schema and relationships
- `get_api_documentation` - API documentation and endpoints
- `get_environment_setup` - Environment setup instructions
- `get_tcg_structures` - TCG card structures (MTG, Pokémon, etc.)
- `get_development_guidelines` - Development best practices
- `search_documentation` - Search all documentation

## Configuration

The server is configured in `~/.mcp/config.json` and will automatically:
- Load all MTG project documentation
- Expose tools for accessing different aspects
- Handle search and filtering

## Troubleshooting

1. **Server won't start**: Check Python installation and dependencies
2. **No tools available**: Verify documentation files exist
3. **Connection issues**: Check MCP client configuration

## Support

For issues or questions, check the project documentation or create an issue.
"""
    
    guide_file = Path.cwd() / "USAGE_GUIDE.md"
    with open(guide_file, 'w') as f:
        f.write(guide_content)
    
    print(f"Created usage guide: {guide_file}")

def main():
    """Main deployment function."""
    print("Deploying MTG Documentation MCP Server")
    print("=" * 50)
    
    # Detect environment
    system, home = detect_environment()
    
    # Install dependencies
    if not install_dependencies():
        print("Failed to install dependencies")
        return False
    
    # Setup configuration
    if not setup_config_files(system, home):
        print("Failed to setup configuration")
        return False
    
    # Create desktop shortcut
    create_desktop_shortcut(system, home)
    
    # Test deployment
    if not test_deployment():
        print("Deployment test failed")
        return False
    
    # Create usage guide
    create_usage_guide(system)
    
    print("\n" + "=" * 50)
    print("Deployment completed successfully!")
    print("\nYour MTG MCP Server is ready to use!")
    print("\nNext steps:")
    print("1. Start the server using the provided script")
    print("2. Configure your MCP client to connect")
    print("3. Use the available tools to access documentation")
    print("4. Check USAGE_GUIDE.md for detailed instructions")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 