import re
from collections import Counter

from services.supabase_client import supabase


VISA_FILES = {
    "application.md",
    "types.md",
    "requirements.md",
    "fees.md",
    "referral_visa.md",
    "visa_status.md",
    "visa.md",
}

RESIDENCE_FILES = {
    "overview.md",
    "class_a.md",
    "class_b.md",
    "class_c.md",
    "requirements.md",
    "fees.md",
    "application_process.md",
    "residence_permits.md",
}

PASS_FILES = {
    "business_pass.md",
    "student_pass.md",
    "dependant_pass.md",
    "special_pass.md",
    "exemption_certificate.md",
    "migrant_pass.md",
    "visitor_pass.md",
    "landing_pass.md",
    "re_entry_pass.md",
    "transit_pass.md",
    "immigration_passes.md",
}


def tokenize(text: str) -> list[str]:
    return re.findall(r"\b\w+\b", text.lower())


def detect_service(query: str) -> str | None:
    q = query.lower().strip()

    if any(
        term in q
        for term in [
            "residence permit",
            "residence permits",
            "kibali cha makazi",
            "permit ya makazi",
            "class a",
            "class b",
            "class c",
            "daraja a",
            "daraja b",
            "daraja c",
        ]
    ):
        return "residence"

    if any(
        term in q
        for term in [
            "nida",
            "nin",
            "national identification",
            "national id",
            "kitambulisho cha taifa",
            "namba ya nida",
        ]
    ):
        return "nida"

    if any(
        term in q
        for term in [
            "passport",
            "pasipoti",
            "travel document",
            "hati ya kusafiria",
        ]
    ):
        return "passport"

    if any(term in q for term in ["visa", "evisa", "e-visa"]):
        return "visa"

    if any(
        term in q
        for term in [
            "student pass",
            "business pass",
            "dependant pass",
            "special pass",
            "exemption certificate",
            "migrant pass",
            "visitor pass",
            "landing pass",
            "re-entry pass",
            "transit pass",
        ]
    ):
        return "passes"

    return None


def matches_service(result: dict, service: str) -> bool:
    source = (result.get("source_title") or "").lower()
    category = (result.get("category") or "").lower()
    agency = (result.get("agency") or "").lower()
    content = (result.get("content") or "").lower()

    if service == "nida":
        return agency == "nida" or "nida" in source

    if service == "passport":
        return category == "passport"

    if service == "visa":
        return (
            source in VISA_FILES
            or "visa" in source
            or "visa" in content
        )

    if service == "residence":
        if "residence" in source:
            return True

        if source == "overview.md":
            return "residence permit" in content

        return "residence permit" in content

    if service == "passes":
        if source in PASS_FILES:
            return True

        if source == "overview.md":
            return any(
                term in content
                for term in [
                    "business pass",
                    "student pass",
                    "dependant pass",
                    "special pass",
                    "migrant pass",
                    "visitor pass",
                ]
            )

        return False

    return True


def score_result(query: str, result: dict) -> float:
    """
    Lightweight lexical relevance scoring.

    This replaces sentence-transformers for the production server
    so the application can run within Render's memory limit.
    """

    query_tokens = tokenize(query)

    content = " ".join(
        [
            str(result.get("source_title") or ""),
            str(result.get("category") or ""),
            str(result.get("agency") or ""),
            str(result.get("content") or ""),
        ]
    )

    content_tokens = tokenize(content)

    if not query_tokens or not content_tokens:
        return 0.0

    query_counts = Counter(query_tokens)
    content_counts = Counter(content_tokens)

    score = 0.0

    for word, query_count in query_counts.items():
        if word in content_counts:
            score += query_count * min(content_counts[word], 5)

    # Give extra weight to exact multi-word phrases.
    query_lower = query.lower()
    content_lower = content.lower()

    important_phrases = [
        "residence permit",
        "student pass",
        "business pass",
        "dependant pass",
        "special pass",
        "passport",
        "visa",
        "nida",
        "national identification",
        "class a",
        "class b",
        "class c",
        "daraja a",
        "daraja b",
        "daraja c",
        "kibali cha makazi",
        "kitambulisho cha taifa",
        "pasipoti",
    ]

    for phrase in important_phrases:
        if phrase in query_lower and phrase in content_lower:
            score += 10

    return score


def search_knowledge(query: str, limit: int = 5):
    """
    Search the existing Supabase knowledge chunks without
    loading a machine-learning embedding model.
    """

    response = (
        supabase
        .table("knowledge_chunks")
        .select("*")
        .execute()
    )

    results = response.data or []

    service = detect_service(query)

    if service:
        filtered_results = [
            result
            for result in results
            if matches_service(result, service)
        ]

        if filtered_results:
            results = filtered_results

    scored_results = [
        (score_result(query, result), result)
        for result in results
    ]

    scored_results.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    relevant = [
        result
        for score, result in scored_results
        if score > 0
    ]

    return relevant[:limit]