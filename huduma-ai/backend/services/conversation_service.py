import re


def normalize_message(message: str) -> str:
    """
    Normalize a user message for simple conversation detection.
    """
    message = message.lower().strip()
    message = re.sub(r"[^\w\s]", " ", message)
    message = re.sub(r"\s+", " ", message)
    return message


def get_conversation_response(
    message: str,
    language: str = "en",
) -> str | None:
    """
    Handle simple greetings and conversational messages.

    Returns:
        A response string if the message is simple conversation.
        None if the message should continue to RAG.
    """

    text = normalize_message(message)

    # ---------------------------------------------------------
    # ENGLISH
    # ---------------------------------------------------------

    if language == "en":

        greetings = {
            "hello",
            "hi",
            "hey",
            "hello there",
            "hi there",
            "good morning",
            "good afternoon",
            "good evening",
            "morning",
            "afternoon",
            "evening",
        }

        if text in greetings:
            return (
                "Hello! 👋 I’m Tanzania Assistant. "
                "How can I help you with NIDA, Passport, "
                "or Immigration services?"
            )

        if text in {
            "how are you",
            "how are you doing",
            "how are things",
        }:
            return (
                "I’m doing well, thank you! 😊 "
                "How can I help you today?"
            )

        if text in {
            "who are you",
            "what are you",
            "what is your name",
        }:
            return (
                "I’m Tanzania Assistant, an AI assistant "
                "designed to help with Tanzanian government "
                "services such as NIDA, Passport, and Immigration."
            )

        if text in {
            "thank you",
            "thanks",
            "thank you so much",
            "thanks a lot",
        }:
            return (
                "You’re welcome! 😊 "
                "I’m happy to help."
            )

        if text in {
            "bye",
            "goodbye",
            "see you",
            "see you later",
        }:
            return (
                "Goodbye! 👋 "
                "Feel free to come back whenever you need help."
            )

    # ---------------------------------------------------------
    # SWAHILI
    # ---------------------------------------------------------

    if language == "sw":

        greetings = {
            "habari",
            "habari yako",
            "habari za leo",
            "hujambo",
            "hujambo vipi",
            "mambo",
            "mambo vipi",
            "vipi",
            "shikamoo",
            "salaam",
            "asubuhi njema",
            "mchana mwema",
            "jioni njema",
        }

        if text in greetings:
            return (
                "Habari! 👋 Mimi ni Tanzania Assistant. "
                "Ninaweza kukusaidia kuhusu huduma za NIDA, "
                "Pasipoti, au Uhamiaji. Unaweza kuuliza swali lako."
            )

        if text in {
            "habari yako",
            "ukoje",
            "unaendeleaje",
            "mambo vipi",
        }:
            return (
                "Niko vizuri, asante! 😊 "
                "Ninawezaje kukusaidia leo?"
            )

        if text in {
            "wewe ni nani",
            "unaitwa nani",
            "jina lako nani",
        }:
            return (
                "Mimi ni Tanzania Assistant, "
                "msaidizi wa AI anayesaidia kuhusu huduma "
                "za serikali za Tanzania kama NIDA, Pasipoti, na Uhamiaji."
            )

        if text in {
            "asante",
            "asante sana",
            "ahsante",
            "ahsante sana",
        }:
            return (
                "Karibu! 😊 "
                "Nimefurahi kukusaidia."
            )

        if text in {
            "kwaheri",
            "kwa heri",
            "tutaonana",
            "tutaonana baadaye",
        }:
            return (
                "Kwaheri! 👋 "
                "Karibu tena wakati wowote unapohitaji msaada."
            )

    # ---------------------------------------------------------
    # FRENCH
    # ---------------------------------------------------------

    if language == "fr":

        greetings = {
            "bonjour",
            "salut",
            "bonsoir",
            "bonne journee",
            "bonne soiree",
        }

        if text in greetings:
            return (
                "Bonjour ! 👋 Je suis Tanzania Assistant. "
                "Je peux vous aider concernant les services "
                "de NIDA, les passeports et l’immigration."
            )

        if text in {
            "comment allez vous",
            "comment vas tu",
            "comment allez vous aujourd hui",
            "comment vas tu aujourd hui",
            "ca va",
        }:
            return (
                "Je vais bien, merci ! 😊 "
                "Comment puis-je vous aider aujourd’hui ?"
            )

        if text in {
            "qui etes vous",
            "qui es tu",
            "comment vous appelez vous",
            "quel est votre nom",
        }:
            return (
                "Je suis Tanzania Assistant, un assistant IA "
                "qui aide les utilisateurs concernant les services "
                "gouvernementaux de Tanzanie."
            )

        if text in {
            "merci",
            "merci beaucoup",
        }:
            return (
                "Je vous en prie ! 😊 "
                "Je suis heureux de vous aider."
            )

        if text in {
            "au revoir",
            "a bientot",
        }:
            return (
                "Au revoir ! 👋 "
                "N’hésitez pas à revenir si vous avez besoin d’aide."
            )

    # ---------------------------------------------------------
    # Not simple conversation
    # ---------------------------------------------------------

    return None