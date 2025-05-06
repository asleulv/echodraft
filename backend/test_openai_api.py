import os
import openai
import json
import argparse

def test_openai_api(api_key, model="gpt-3.5-turbo-0125", temperature=0.9, max_tokens=3000):
    """
    Test the OpenAI API directly with the same parameters used in the application.
    """
    # Set the API key
    openai.api_key = api_key
    
    # Define the system message
    system_message = """You are a helpful assistant that creates beautifully formatted documents in HTML format.

IMPORTANT: Your output MUST be valid HTML with proper tags for headings, paragraphs, lists, etc. 
DO NOT return plain text or markdown - ONLY return HTML.

For example:
- Use <h1>, <h2>, <h3> tags for headings
- Wrap paragraphs in <p> tags
- Use <ul> and <li> tags for bullet lists
- Use <ol> and <li> tags for numbered lists
- Use <strong> or <b> tags for bold text
- Use <em> or <i> tags for italic text

The HTML will be displayed in a rich text editor, so ensure it has proper structure and formatting.
Always respond in the EXACT SAME LANGUAGE as the user's concept/request."""

    # Define the user prompt
    user_prompt = """I want you to create an expanded, well-structured HTML document based on this concept:

Anmeldelse av Skid Row si Subhuman Race, ei plate som meir eller mindre var slutten på bandet som ei stormakt i rocken. Ei plate der dei prøvde å etterape grungen som hadde blitt så stor, men som viste seg å være ei sjanger dei ikkje meistra.

Requirements:
1. Length: Create a Medium (750-1500 words) document. PLEASE TAKE NOTICE OF THE LENGTH REQUIRED
2. Style: Match the writing style, tone, warmth/coldness, and formality of the example documents below.
3. Format: Use proper HTML formatting with appropriate tags
4. Language: Maintain the same language as the original concept
5. Do not add a title, but split the text into fitting paragraphs

Your response MUST:
- Use paragraph tags (<p>) for all text blocks
- Use appropriate HTML elements for emphasis (<strong>, <em>), lists (<ul>, <ol>, <li>), and quotes (<blockquote>) where relevant   
- Maintain the factual accuracy of the original concept while adding depth, ensuring it reflects the characteristics of the example documents.

Example documents for style reference. Analyze the tone and mood of the texts. Is it cold and factual, or warm and emotive? Does it focus on objective facts, or does it use metaphors and emotional language to engage the reader?:
Title: Cigarettes After Sex - X's

Content: Så, er du klar for enda ei samling emosjonelle, saktegåande og kliss like songar om kva som skjer under dyna til Greg Gonzalez etter at lyset er sløkt? Verda elskar El Paso-trioen som er streama milliardar av gonger og som til hausten skal på stadionturné i både USA og Europa. Og no er dei altså ute med noko nytt. Og dette er nytt i den rausaste forstand - for "X's" høyrest nøyaktig ut som den førre. Og den før der igjen. Joda, dei hadde noko ved seg då dei debuterte i 2017. Den draumande og minimalistiske instrumenteringa mot den androgyne, semi-kviskrande stemma til Gonzalez var som ein klem me ikkje visste me ville ha. Og i toppar som "K" og "Each Time You Fall In Love" var det opplagte kvalitetar i rørsle og me begynte å sjå for oss eit nytt Beach House eller Mazzy Star. Den kritiske lyttaren ville nok allereie då ha peika på at Cigarettes After Sex var i overkant einspora, der alt skjedde i same tempo og humør. No, to plater seinare, har musikken framleis ikkje rikka seg av flekken og kjensla av déjà vu er like sterk som behovet for å opne eit vindauge og sette på ei maskin med sengetøy. For i lengden er det nesten litt guffent, dette tekstuniverset. Her blir du varsomt byssa i søvn til historiar frå eit soverom som alltid har ein sokk tredd over dørhåndtaket. Som på den førre. Og den før der igjen. Forskjellen frå då til no er berre at det som den gong pirra, no kjennest resirkulert og klissete - som eit kondom brukt fleire gonger. Det er liksom ikkje måte på kor mykje tid Gonzalez brukar i ei seng - og han vil at du skal vite det! Som han syng i "Tejano Blue": "We wanted to fuck like all the time" Ja da, Greg, me har skjønt det. Det gjorde me allereie på den førre. Og den før der igjen.



DO NOT simply return the original text with HTML tags added. Create a new, expanded text with the same vibe and style as the example documents."""

    # Make the API call
    print("Calling OpenAI API...")
    try:
        response = openai.ChatCompletion.create(
            model=model,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        # Print the response
        print("\n=== API RESPONSE ===")
        print(f"Model: {model}")
        print(f"Temperature: {temperature}")
        print(f"Max Tokens: {max_tokens}")
        print(f"Finish Reason: {response.choices[0].finish_reason}")
        print(f"Completion Tokens: {response.usage.completion_tokens}")
        print(f"Prompt Tokens: {response.usage.prompt_tokens}")
        print(f"Total Tokens: {response.usage.total_tokens}")
        
        # Save the generated content to a file
        generated_content = response.choices[0].message.content
        with open("api_test_result.html", "w", encoding="utf-8") as f:
            f.write(generated_content)
        
        print("\n=== GENERATED CONTENT (FIRST 500 CHARS) ===")
        print(generated_content[:500] + "..." if len(generated_content) > 500 else generated_content)
        print("\nFull content saved to api_test_result.html")
        
        return response
    
    except Exception as e:
        print(f"Error calling OpenAI API: {str(e)}")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test OpenAI API directly")
    parser.add_argument("--api_key", required=True, help="Your OpenAI API key")
    parser.add_argument("--model", default="gpt-3.5-turbo-0125", help="Model to use")
    parser.add_argument("--temperature", type=float, default=0.9, help="Temperature setting")
    parser.add_argument("--max_tokens", type=int, default=3000, help="Maximum tokens for completion")
    
    args = parser.parse_args()
    
    test_openai_api(args.api_key, args.model, args.temperature, args.max_tokens)
