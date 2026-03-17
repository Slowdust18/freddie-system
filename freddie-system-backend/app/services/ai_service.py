import openai
from ..config import settings

# Initialize client once (better performance)
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

def generate_reply(name: str, rating: int, text: str) -> str:
    """
    Generates a context-aware response using OpenAI.
    """
    if not settings.OPENAI_API_KEY:
        return "Error: AI Key missing."

    # --- SMART LOGIC: Adjust tone based on stars ---
    if rating >= 4:
        tone = "grateful, enthusiastic, and warm"
        instruction = "Thank them for the support and invite them back."
    elif rating == 3:
        tone = "polite and professional"
        instruction = "Thank them, acknowledge the feedback, and ask how we can improve."
    else:  # 1 or 2 stars
        tone = "empathetic, apologetic, and responsible"
        instruction = "Apologize sincerely, do NOT make excuses, and ask them to contact support to resolve it."

    # --- BETTER PROMPT ---
    # We use a 'System' message to define the AI's behavior
    system_message = f"You are a customer support manager. Tone: {tone}. Goal: {instruction}"
    
    user_message = f"Reviewer: {name}\nRating: {rating} stars\nReview Text: '{text}'\n\nWrite a concise reply (under 50 words)."

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Cheaper & Smarter than 3.5-turbo (or use "gpt-3.5-turbo")
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            max_tokens=100,
            temperature=0.7 
        )
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        print(f"AI Error: {e}")
        # Fallback if OpenAI is down
        return "Thank you for your feedback! We appreciate you bringing this to our attention."