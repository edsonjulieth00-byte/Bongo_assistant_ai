from fastapi import APIRouter, File, Form, UploadFile, HTTPException
import fitz

from services.groq_service import GroqService


router = APIRouter()

groq_service = GroqService()


def extract_pdf_text(contents: bytes) -> str:
    """
    Extract PDF text while clearly separating pages.
    This helps the language model understand the document structure.
    """

    document = fitz.open(
        stream=contents,
        filetype="pdf",
    )

    pages = []

    for page_number, page in enumerate(document, start=1):
        page_text = page.get_text("text")

        pages.append(
            f"\n===== PAGE {page_number} =====\n"
            f"{page_text}\n"
            f"===== END PAGE {page_number} =====\n"
        )

    document.close()

    return "\n".join(pages)


@router.post("/chat-with-file")
async def chat_with_file(
    message: str = Form(...),
    file: UploadFile = File(...),
    language: str = Form("en"),
):
    allowed_types = {
        "application/pdf",
        "text/plain",
        "text/csv",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type.",
        )

    if language not in {"en", "sw", "fr"}:
        language = "en"

    contents = await file.read()

    # ---------------------------------------------------------
    # PDF
    # ---------------------------------------------------------
    if file.content_type == "application/pdf":

        try:
            document_text = extract_pdf_text(contents)

        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Could not read the PDF file: {str(e)}",
            )

        if not document_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No readable text was found in the PDF.",
            )

        # Keep the context within a reasonable size
        document_text = document_text[:10000]

        language_names = {
            "en": "English",
            "sw": "Swahili",
            "fr": "French",
        }

        selected_language = language_names[language]

        prompt = f"""
You are Tanzania Assistant.

You are answering a question about an uploaded Tanzanian
government document.

USER QUESTION:
{message}

DOCUMENT:
{document_text}

REQUIRED RESPONSE LANGUAGE:
{selected_language}

LANGUAGE RULE — VERY IMPORTANT:

The final answer MUST be written entirely in {selected_language}.

The language of the DOCUMENT does NOT determine the language
of the answer.

The language of the USER QUESTION does NOT override the
REQUIRED RESPONSE LANGUAGE.

The REQUIRED RESPONSE LANGUAGE is the language that MUST be
used for the final answer.

If REQUIRED RESPONSE LANGUAGE is Swahili:
- Answer completely in Swahili.
- Do not begin the answer in English.
- Do not mix English sentences with Swahili.
- Government terms may remain in their original form when
  necessary, but the explanation must be in Swahili.

If REQUIRED RESPONSE LANGUAGE is English:
- Answer completely in English.

If REQUIRED RESPONSE LANGUAGE is French:
- Answer completely in French.
- Do not mix English sentences with French.

STRICT DOCUMENT RULES:

1. Use ONLY the information contained in the DOCUMENT.

2. Do not use outside knowledge.

3. Do not invent information.

4. Do not guess what a field means.

5. Do not move a field from one section to another.

6. Do not create section names that are not present in the document.

7. Preserve the document's original section names and terminology.

8. If the document shows numbered fields, preserve the field
   numbers when useful.

9. Do not say that something is mandatory unless the document
   explicitly says so.

10. Do not assume that every field applies to every applicant.

11. Do not reorganize the document into a different structure.

12. Do not use Markdown tables.

13. Do not use bullet points.

14. Use short paragraphs or numbered sections when appropriate.

15. If the document does not contain enough information to answer
    the question, say the equivalent of:
    "The information is not available in the uploaded document."
    in the REQUIRED RESPONSE LANGUAGE.

16. Answer only the user's question.

17. Keep the answer concise and accurate.

18. Before returning the answer, verify that the entire answer
    is written in the REQUIRED RESPONSE LANGUAGE.
"""

        try:
            answer = groq_service.generate_response(
                user_message=prompt,
                system_prompt=(
                    "You are Tanzania Assistant. "
                    "You analyze uploaded Tanzanian government documents. "
                    "The uploaded document is the only source of truth. "
                    "Never invent, infer, rearrange, rename, or add "
                    "information that is not explicitly supported by "
                    "the document. "
                    "Always answer in the language requested by the user."
                ),
            )

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Groq request failed: {str(e)}",
            )

        if not answer or not answer.strip():
            raise HTTPException(
                status_code=500,
                detail="Groq returned an empty response.",
            )

        return {
            "response": answer.strip(),
            "filename": file.filename,
            "status": "Document analyzed successfully",
        }

    # ---------------------------------------------------------
    # Other file types
    # ---------------------------------------------------------

    return {
        "message": message,
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(contents),
        "status": "File received successfully",
    }