import pymupdf
from pathlib import Path


def extract_pdf_text(pdf_path: str) -> list[dict]:
    """
    Extract text from a PDF while preserving page numbers.
    """

    path = Path(pdf_path)

    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    document = pymupdf.open(path)

    pages = []

    for page_number, page in enumerate(document, start=1):
        text = page.get_text("text").strip()

        if text:
            pages.append({
                "page": page_number,
                "text": text,
            })

    document.close()

    return pages

def chunk_pages(
    pages: list[dict],
    chunk_size: int = 800,
    chunk_overlap: int = 100,
) -> list[dict]:
    """
    Split extracted page text into overlapping chunks.

    Each chunk keeps its original page number.
    """

    chunks = []

    for page in pages:
        text = page["text"]
        page_number = page["page"]

        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end].strip()

            if chunk_text:
                chunks.append({
                    "page": page_number,
                    "text": chunk_text,
                })

            if end >= len(text):
                break

            start = end - chunk_overlap

    return chunks