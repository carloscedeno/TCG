
import sys
import pypdf

def extract_text_to_file(pdf_path, output_path):
    try:
        reader = pypdf.PdfReader(pdf_path)
        width_threshold = 0 # basic check for layout if needed, but let's stick to simple extraction first
        
        with open(output_path, "w", encoding="utf-8") as f:
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    f.write(f"--- Page {i+1} ---\n")
                    f.write(text + "\n")
        return f"Successfully wrote to {output_path}"
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python read_pdf.py <path_to_pdf> <output_txt_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_path = sys.argv[2]
    print(extract_text_to_file(pdf_path, output_path))
