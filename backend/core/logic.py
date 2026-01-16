import spacy
import math

# Load the small English model
nlp = spacy.load("en_core_web_sm")

def calculate_orp_index(word: str) -> int:
    """
    Calculates the Optimal Recognition Point (ORP) index.
    The ORP is typically slightly to the left of the center.
    """
    length = len(word)
    if length <= 1:
        return 0
    if length == 2:
        return 0 # "at" -> focus on 'a'
    if length == 3:
        return 1 # "the" -> focus on 'h'
    if length == 4:
        return 1 # "with" -> focus on 'i'
    # Formulaic approach for longer words: approx 35-40% into the word
    return math.ceil(length * 0.35) - 1

def process_text(text: str, base_wpm: int = 600):
    """
    Tokenizes text and calculates display duration for each word.
    """
    doc = nlp(text)
    base_ms_per_word = 60000 / base_wpm
    
    results = []
    
    for token in doc:
        # We only care about words, numbers, or significant punctuation if we want to display it
        # But for RSVP, we usually attach punctuation to the previous word or have it as a separate frame?
        # A simple approach: We iterate tokens. If it's punctuation attached to a word, we might have lost it?
        # spaCy splits "Hello." into ["Hello", "."]
        # We need to rejoin them or handle them smartly. 
        # For this MVP, let's treat every token as a "slide" but attach punctuation to the previous word if possible?
        # Actually, standard RSVP readers usually show "Hello." as one frame if the punctuation is attached.
        
        # Let's simplify: Just iterate tokens.
        # If token is punctuation, we might want to attach it to the previous word in the list if applicable,
        # OR just show it very quickly / merge it.
        # Better strategy for MVP: Reconstruct "displayable words".
        pass 

    # Re-approach: Iterate tokens and merge punctuation to the previous word if straight-forward
    # Or simply:
    display_tokens = []
    
    # Simple merger logic
    for token in doc:
        text_content = token.text
        
        # Heuristic: If it's a punctuation mark like . , ! ? and the previous token was a word, append it.
        if token.is_punct and display_tokens:
            # Check if we should merge
            # e.g. "word" + "." -> "word."
            if not token.is_space:
                display_tokens[-1]['word'] += text_content
                display_tokens[-1]['has_punct'] = True
                display_tokens[-1]['punct_type'] = text_content
        elif not token.is_space and not token.is_punct:
             display_tokens.append({
                'word': text_content,
                'token_obj': token,
                'has_punct': False,
                'punct_type': None
            })
        elif not token.is_space:
             # Standalone punctuation or symbols
             display_tokens.append({
                'word': text_content,
                'token_obj': token,
                'has_punct': False,
                 'punct_type': None
            })

    final_sequence = []
    
    for item in display_tokens:
        word = item['word']
        token = item['token_obj']
        
        duration = base_ms_per_word
        
        # 1. Length Factor
        if len(word) > 7:
            duration *= 1.2
        if len(word) > 12:
            duration *= 1.4
            
        # 2. Stop words (the, a, is) -> Faster
        if token.is_stop:
            duration *= 0.7
            
        # 3. Proper Nouns / Entities -> Slower
        if token.pos_ == "PROPN" or token.ent_type_:
            duration *= 1.5
            
        # 4. Punctuation Pauses
        if item['has_punct']:
            if '.' in item['punct_type'] or '!' in item['punct_type'] or '?' in item['punct_type']:
                duration += 300 # End of sentence major pause
            elif ',' in item['punct_type'] or ';' in item['punct_type']:
                duration += 150 # Clause pause

        orp = calculate_orp_index(word)
        
        final_sequence.append({
            "word": word,
            "orp_index": orp,
            "duration_ms": int(duration),
            "is_red": True # Always highlight ORP for now
        })
        
    return final_sequence
