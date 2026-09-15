from pathlib import Path

from services.document_processor import extract_pdf_text, chunk_pages
from services.embeddings import create_embeddings
from services.supabase_client import supabase


KNOWLEDGE_DIR = Path(__file__).resolve().parents[2] / "knowledge"


def get_agency_and_category(file_path: Path):
    """
    Determine agency and category from the knowledge folder structure.
    """

    relative_path = file_path.relative_to(KNOWLEDGE_DIR)
    top_folder = relative_path.parts[0].lower()

    if top_folder == "nida":
        return "NIDA", "National Identification"

    if top_folder == "passport":
        return "Immigration", "Passport"

    if top_folder == "immigration":
        return "Immigration", "Immigration Services"

    return "Unknown", "Unknown"


def ingest_pdf(
    pdf_path: str,
    agency: str,
    category: str,
    source_title: str,
    source_url: str,
):
    print(f"Processing PDF: {pdf_path}")

    # 1. Extract text
    pages = extract_pdf_text(pdf_path)
    print(f"Extracted {len(pages)} pages")

    # 2. Create chunks
    chunks = chunk_pages(pages)
    print(f"Created {len(chunks)} chunks")

    if not chunks:
        print("No readable content found. Skipping.")
        return None

    # 3. Create embeddings
    texts = [chunk["text"] for chunk in chunks]
    embeddings = create_embeddings(texts)
    print("Embeddings created")

    # 4. Prepare database records
    records = []

    for chunk, embedding in zip(chunks, embeddings):
        records.append({
            "content": chunk["text"],
            "embedding": embedding,
            "agency": agency,
            "category": category,
            "source_title": source_title,
            "source_url": source_url,
            "page_number": chunk["page"],
        })

    # 5. Insert into Supabase
    response = supabase.table("knowledge_chunks").insert(records).execute()

    print(f"Inserted {len(records)} chunks into Supabase")

    return response


def ingest_markdown(
    markdown_path: str,
    agency: str,
    category: str,
    source_title: str,
    source_url: str,
):
    print(f"Processing Markdown: {markdown_path}")

    # 1. Read Markdown
    path = Path(markdown_path)
    text = path.read_text(encoding="utf-8")

    if not text.strip():
        print("Markdown file is empty. Skipping.")
        return None

    # 2. Convert Markdown into the same page/chunk structure
    pages = [
        {
            "page": 0,
            "text": text,
        }
    ]

    # 3. Create chunks
    chunks = chunk_pages(pages)
    print(f"Created {len(chunks)} chunks")

    if not chunks:
        print("No readable content found. Skipping.")
        return None

    # 4. Create embeddings
    texts = [chunk["text"] for chunk in chunks]
    embeddings = create_embeddings(texts)
    print("Embeddings created")

    # 5. Prepare database records
    records = []

    for chunk, embedding in zip(chunks, embeddings):
        records.append({
            "content": chunk["text"],
            "embedding": embedding,
            "agency": agency,
            "category": category,
            "source_title": source_title,
            "source_url": source_url,
            "page_number": 0,
        })

    # 6. Insert into Supabase
    response = supabase.table("knowledge_chunks").insert(records).execute()

    print(f"Inserted {len(records)} chunks into Supabase")

    return response


def get_source_url(agency: str, category: str):
    """
    Return the official source URL associated with the knowledge category.
    """

    if agency == "NIDA":
        return "https://nida.go.tz/"

    if category == "Passport":
        return "https://www.immigration.go.tz/index.php/immigration-services/passports-and-travel-documents"

    if category == "Immigration Services":
        return "https://www.immigration.go.tz/"

    return "https://www.immigration.go.tz/"


if __name__ == "__main__":

    pdf_files = list(KNOWLEDGE_DIR.rglob("*.pdf"))
    markdown_files = list(KNOWLEDGE_DIR.rglob("*.md"))

    print(f"Found {len(pdf_files)} PDF file(s)")
    print(f"Found {len(markdown_files)} Markdown file(s)")

    # ---------------------------------------------------------
    # PDF FILES
    # ---------------------------------------------------------

    for pdf in pdf_files:

        agency, category = get_agency_and_category(pdf)

        print(f"\nAgency: {agency}")
        print(f"Category: {category}")

        ingest_pdf(
            pdf_path=str(pdf),
            agency=agency,
            category=category,
            source_title=pdf.name,
            source_url=get_source_url(
                agency,
                category,
            ),
        )

    # ---------------------------------------------------------
    # MARKDOWN FILES
    # ---------------------------------------------------------

    for markdown in markdown_files:

        agency, category = get_agency_and_category(markdown)

        print(f"\nAgency: {agency}")
        print(f"Category: {category}")

        ingest_markdown(
            markdown_path=str(markdown),
            agency=agency,
            category=category,
            source_title=markdown.name,
            source_url=get_source_url(
                agency,
                category,
            ),
        )

    print("\nKnowledge ingestion completed.")