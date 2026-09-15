import re
import math
from collections import Counter


def _tokenize(text: str) -> list[str]:
    return re.findall(r"\b\w+\b", text.lower())


def _term_frequency(tokens: list[str]) -> dict[str, float]:
    counts = Counter(tokens)
    total = len(tokens) or 1
    return {word: count / total for word, count in counts.items()}


def _cosine_similarity(
    vector_a: dict[str, float],
    vector_b: dict[str, float],
) -> float:
    common = set(vector_a) & set(vector_b)

    dot = sum(vector_a[word] * vector_b[word] for word in common)

    magnitude_a = math.sqrt(
        sum(value * value for value in vector_a.values())
    )
    magnitude_b = math.sqrt(
        sum(value * value for value in vector_b.values())
    )

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot / (magnitude_a * magnitude_b)


def create_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Lightweight fallback embedding.

    This is intentionally CPU/memory friendly for small Render instances.
    """
    vocabulary = sorted(
        {
            word
            for text in texts
            for word in _tokenize(text)
        }
    )

    embeddings = []

    for text in texts:
        frequencies = _term_frequency(_tokenize(text))

        vector = [
            frequencies.get(word, 0.0)
            for word in vocabulary
        ]

        embeddings.append(vector)

    return embeddings