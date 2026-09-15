from services.retrieval import search_knowledge
from services.groq_service import GroqService
from app.rag.prompt import SYSTEM_PROMPT, build_rag_prompt
from services.conversation_service import get_conversation_response


class ChatService:
    def __init__(self):
        self.groq = GroqService()

    def _clean_response(self, answer: str) -> str:
        replacements = {
            "\u00a0": " ",
            "\u2018": "'",
            "\u2019": "'",
            "\u201c": '"',
            "\u201d": '"',
            "\u2013": "-",
            "\u2014": "-",
            "\u2026": "...",
        }

        for old, new in replacements.items():
            answer = answer.replace(old, new)

        # Repair UTF-8 text that was incorrectly decoded.
        if any(
            marker in answer
            for marker in ["â€", "â€™", "â€œ", "â€“", "â€”"]
        ):
            try:
                answer = answer.encode("latin1").decode("utf-8")
            except (UnicodeEncodeError, UnicodeDecodeError):
                pass

        return answer.strip()

    def answer(
        self,
        question: str,
        language: str = "en",
        limit: int = 5,
    ):
        # Handle greetings and simple conversation first.
        conversation_response = get_conversation_response(
            question,
            language=language,
        )

        if conversation_response is not None:
            return conversation_response

        # Search the government knowledge base.
        results = search_knowledge(
            question,
            limit=limit,
        )

        if not results:
            if language == "sw":
                return (
                    "Samahani, taarifa hiyo haipatikani katika "
                    "kanzidata yangu ya sasa."
                )

            if language == "fr":
                return (
                    "Désolé, cette information n'est pas disponible "
                    "dans ma base de connaissances actuelle."
                )

            return (
                "Sorry, that information is not available in "
                "my current knowledge base."
            )

        # Build the RAG prompt.
        prompt = build_rag_prompt(
            question,
            results,
            language=language,
        )

        # Generate the answer.
        answer = self.groq.generate_response(
            user_message=prompt,
            system_prompt=SYSTEM_PROMPT,
        )

        # Clean encoding and formatting issues.
        return self._clean_response(answer)