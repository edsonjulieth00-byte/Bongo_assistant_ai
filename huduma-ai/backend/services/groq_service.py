import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()


class GroqService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            raise ValueError("GROQ_API_KEY is not set")

        self.client = Groq(api_key=api_key)

    def generate_response(
        self,
        user_message: str,
        system_prompt: str = "You are a helpful AI assistant.",
    ) -> str:

        response = self.client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_message,
                },
            ],
            temperature=0.2,
            max_tokens=1024,
        )

        return response.choices[0].message.content