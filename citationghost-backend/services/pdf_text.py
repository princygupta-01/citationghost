import base64
import io

from pypdf import PdfReader


def extract_pdf_text(base64_data: str) -> str:
    pdf_bytes = base64.b64decode(base64_data)
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages).strip()
