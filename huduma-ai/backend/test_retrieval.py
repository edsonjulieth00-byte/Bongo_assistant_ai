from backend.services.retrieval import search_knowledge


results = search_knowledge(
    "What documents are required to register for a National ID?",
    limit=3,
)

print(f"Results found: {len(results)}")

for i, result in enumerate(results, start=1):
    print(f"\n--- Result {i} ---")
    print(f"Agency: {result['agency']}")
    print(f"Category: {result['category']}")
    print(f"Source: {result['source_title']}")
    print(f"Page: {result['page_number']}")
    print(f"Similarity: {result['similarity']}")
    print(f"Content:\n{result['content']}")