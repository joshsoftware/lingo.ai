from langchain_core.prompts import PromptTemplate

# Define and return the reusable prompt template
def get_summarization_template():
    return PromptTemplate(
        input_variables=["conversation_text"],  # Placeholder for dynamic input
        template="""Please summarize the following conversation between two people. 
                   Focus on the main points and key takeaways, avoiding unnecessary details and repetitions: 
                   {conversation_text}"""
    )

def get_intent_template():
    return PromptTemplate(
        input_variables=["transcribed_text"],  # Placeholder for dynamic input
        template="""
You are an intent detection engine.
Your job is to classify the following user text into a known intent and extract entities. Extract key information in a structured JSON format.

### Input Text:
{transcribed_text}

### Supported Intents:
1. check_balance
   - Example: "Find balance in my account"

2. last_transaction
   - Example: "What was my last transaction?"

3. pay_someone
   - Example: "Pay someone" (no details given)

### Instructions:
- Entities object must **always** contain exactly these two keys:
  {{
    "amount": <number|null>,
    "recipient": <string|null>
  }}
- Always respond in **strict JSON** only.
- Use this schema:

{{
  "intent": "<intent_name or 'unknown'>",
  "entities": {{
    "amount": <number or null>,
    "recipient": <string or null>
  }},
  "action": "<process_payment | ask_for_details | respond | unknown>",
  "confidence": <float between 0 and 1>
}}

### Edge Cases:
- If intent is unclear → set "intent": "unknown", "action": "unknown".
- If entities are missing → keep them null and set action="ask_for_details".

### Now return ONLY the JSON object.
"""
    )
