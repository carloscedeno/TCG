import re
from typing import Dict, List, Any

class ManaBoxParser:
    """
    Parses ManaBox exported inventory lines.
    Expected format: `Quantity`x? `Name` (`SetCode`) `CollectorNumber` `Extras`
    Example: 1x Steam Vents (GRN) 257 *F*
    """
    PATTERN = re.compile(r"^(\d+)x?\s+(.+?)\s+\(([^)]+)\)\s+(\w+)(?:\s+(.*))?$")
    
    @classmethod
    def parse_line(cls, line: str) -> Dict[str, Any]:
        line = line.strip()
        if not line:
            return None
            
        match = cls.PATTERN.match(line)
        if not match:
            raise ValueError(f"Invalid format: {line}")
            
        quantity_str = match.group(1)
        name = match.group(2).strip()
        set_code = match.group(3).strip()
        collector_number = match.group(4).strip()
        extras = match.group(5)
        
        is_foil = False
        if extras:
            extras_upper = extras.upper()
            if "*F*" in extras_upper or "(F)" in extras_upper or "FOIL" in extras_upper:
                is_foil = True
                
        return {
            "quantity": int(quantity_str),
            "name": name,
            "set_code": set_code,
            "collector_number": collector_number,
            "is_foil": is_foil
        }

    @classmethod
    def parse_text(cls, text: str) -> Dict[str, List]:
        successful_imports = []
        failed_imports = []
        
        for index, line in enumerate(text.splitlines()):
            line = line.strip()
            if not line:
                continue
                
            try:
                parsed_data = cls.parse_line(line)
                if parsed_data:
                    parsed_data["line_number"] = index + 1
                    successful_imports.append(parsed_data)
            except ValueError as e:
                failed_imports.append({
                    "line_number": index + 1,
                    "raw_line": line,
                    "error": str(e)
                })
                
        return {
            "successful_imports": list(successful_imports),
            "failed_imports": list(failed_imports)
        }
