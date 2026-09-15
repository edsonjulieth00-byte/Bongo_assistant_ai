from services.chat_service import ChatService


def main():
    chat = ChatService()

    question = "What documents are required to register for a National ID?"

    answer = chat.answer(question)

    print("\n================ ANSWER ================\n")
    print(answer)


if __name__ == "__main__":
    main()