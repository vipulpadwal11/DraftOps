import os
from dotenv import load_dotenv
from groq import Groq
import google.generativeai as genai

load_dotenv()

class LLMUnavailableError(Exception):
    pass

def call_llm(system_prompt, user_message):
    # Step 1: Try Groq
    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0,
            max_tokens=1000
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Groq failed: {e}. Switching to Gemini.")

    # Step 2: Try Gemini Fallback
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.5-flash")
        combined_prompt = f"System:\n{system_prompt}\n\nUser:\n{user_message}"
        response = model.generate_content(combined_prompt)
        return response.text
    except Exception as e:
        # Step 3: Both failed
        raise LLMUnavailableError(f"Both Groq and Gemini failed. Last error: {e}")

if __name__ == "__main__":
    system_prompt = "You are a helpful assistant. Reply only in JSON."
    user_message = 'Return this JSON: { "test": true }'
    
    try:
        result = call_llm(system_prompt, user_message)
        print(result)
    except LLMUnavailableError as e:
        print(e)
