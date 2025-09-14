# pdf_processing.py
import fitz  # PyMuPDF

def extract_text_from_pdf(file):
    """
    file: Werkzeug FileStorage from Flask (file.read() available)
    returns extracted text or an error message starting with 'Error'
    """
    try:
        data = file.read()
        if not data:
            return "No data in PDF file."
        doc = fitz.open(stream=data, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text if text.strip() else "No extractable text found in PDF."
    except Exception as e:
        return f"Error extracting PDF text: {str(e)}"
