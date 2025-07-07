# MTG MCP Server - Usage Guide

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
