from services.groq_service import GroqService


def main():
    groq = GroqService()

    response = groq.generate_response(
        "What is NIDA?"
    )

    print("\nAI RESPONSE:")
    print(response)


if __name__ == "__main__":
    main()