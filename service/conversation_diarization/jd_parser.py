import os
from docx import Document
from PyPDF2 import PdfReader
import re

def read_docx(file_path):
    """Reads and extracts the relevant sections from a .docx file into a dictionary."""
    print(f"\nReading: {file_path}")
    try:
        result = {
            "Skills (Must have)": [],
            "Skills (Good to have)": [],
            "Responsibilities": []
        }
        
        doc = Document(file_path)
        
        current_section = None
        
        for paragraph in doc.paragraphs:
            if "Skills (Must have)" in paragraph.text:
                current_section = "Skills (Must have)"
            elif "Skills (Good to have)" in paragraph.text:
                current_section = "Skills (Good to have)"
            elif "Responsibilities" in paragraph.text:
                current_section = "Responsibilities"
            elif current_section:
                if paragraph.text.strip():
                    result[current_section].append(paragraph.text.strip())
        
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    cell_text = cell.text.strip()
                    if cell_text:
                        result[current_section].append(cell_text)
        
        print("Result : ", result)
        return result
    except Exception as e:
        print(f"Error reading .docx file {file_path}: {e}")
        return None


def read_pdf(file_path):
    """Reads and prints the content of a .pdf file."""
    print(f"\nReading: {file_path}")
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            print(page.extract_text())
    except Exception as e:
        print(f"Error reading .pdf file {file_path}: {e}")

def process_directory(directory_path):
    """Reads all .docx and .pdf files in the given directory."""
    try:
        for root, _, files in os.walk(directory_path):
            cnt = 0
            for file in files:
                cnt+=1
                print("***********************\n\n\nReading File No : ",cnt)

                original_file_path = os.path.join(root, file)
                if " " in file:
                    new_file_name = file.replace(" ", "_")
                    new_file_path = os.path.join(root, new_file_name)
                    os.rename(original_file_path, new_file_path)
                    print(f"Renamed file: {original_file_path} -> {new_file_path}")
                    file = new_file_name
                
                file_path = os.path.join(root, file)

                if file.lower().endswith('.docx'):
                    read_docx(file_path)
                elif file.lower().endswith('.pdf'):
                    read_pdf(file_path)
                else:
                    print(f"Unsupported file type: {file_path}")
    except Exception as e:
        print(f"Error processing directory {directory_path}: {e}")

if __name__ == "__main__":
    directory_path = input("Enter the directory path: ")
    process_directory(directory_path)

