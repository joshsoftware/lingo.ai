from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain.schema.runnable.base import RunnableSequence
from template_config import get_summarization_template
import logging
import ollama
import json
import re
from config import ollama_host, ollama_model_name
import re
import json
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI model and LLMChain globally for reuse
model = ChatOpenAI(
    model_name="gpt-4",  # Specify GPT-4 model
    temperature=0.2  # Adjust temperature for deterministic responses
)

# Get the template from template_config
prompt_template = get_summarization_template()

# Create the LLMChain globally
llm_chain = RunnableSequence(prompt_template, model)

def summarize_using_openai(text):
    """
    Function to summarize the input conversation text using OpenAI.`
    :param text: The conversation text to be summarized.
    :return: Summarized text.
    """
    if not text or len(text.strip()) == 0:
        return "The conversation text is empty. Please provide valid input."

    logger.info("summary started")
    try:
        # Run the chain with the conversation text

        summary = llm_chain.invoke({"conversation_text": text})
        return summary.content
    except Exception as e:
        logger.error(f"Error occurred during summarization: {str(e)}")
        return "An error occurred while summarizing the text."

#Using Ollama and llama3.2 model, summarize the English translation
def summarize_using_ollama(text):
    response = ollama.Client(host=ollama_host).generate(model=ollama_model_name, prompt = text+"\n \n""Provide highlights above conversation in Markdown bullet points, ready for direct inclusion in a file, with no pretext, and formatted as a multiline string.")
    summary = response["response"]
    return summary

def _extract_first_json_block(text: str) -> dict | None:
    """Helper to find the first JSON block in a string."""
    try:
        start_index = text.find('{')
        end_index = text.rfind('}')
        if start_index != -1 and end_index != -1 and end_index > start_index:
            json_str = text[start_index:end_index + 1]
            return json.loads(json_str)
    except json.JSONDecodeError:
        return None
    return None

def extract_contact_detailed_using_ollama(text: str):
    """Use LLM to extract detailed contact and address fields for CRM."""
    if not text or not text.strip():
        return {"name": None, "phone": None, "address": None, "street": None, "city": None, "state": None, "zip": None, "country": None}
    
    # Try to extract name using regex first as a fallback
    name_pattern = r'(?:this is|my name is|I am|I\'m) ([A-Z][a-z]+ [A-Z][a-z]+)'
    name_match = re.search(name_pattern, text)
    extracted_name = name_match.group(1) if name_match else None
    
    # Common patterns for addresses with apartment/flat information
    address_patterns = [
        # Pattern for addresses with flat/apartment info and city
        r'(?:residence|address|live at|located at)[,\s]+(\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way)[,\s]+(?:flat|apartment|apt|suite|ste|unit|#)\s+[\w\d]+)[,\s]+([\w\s]+)',
        
        # Simpler pattern as fallback
        r'(\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way)[,\s]+(?:flat|apartment|apt|suite|ste|unit|#)\s+[\w\d]+)[,\s]+([\w\s]+)'
    ]
    
    street_address = None
    city = None
    
    for pattern in address_patterns:
        matches = re.search(pattern, text, re.IGNORECASE)
        if matches:
            street_address = matches.group(1).strip()
            city = matches.group(2).strip()
            break
    
    # Use a more specific prompt for the LLM
    instruction = (
        "Extract contact fields from the transcript. Return STRICT JSON with keys: name, phone, street, city, state, zip, country.\n\n"
        "VERY IMPORTANT INSTRUCTIONS:\n"
        "1. For name extraction, look for full names like 'Sofia Martinez' or 'John Smith'. "
        "   Extract both first name and last name. The name should NEVER be null if a name is mentioned.\n\n"
        "2. For address extraction:\n"
        "   - The 'street' field should include ONLY the street address with building number and apartment/flat info\n"
        "   - Do NOT include the city name in the street field\n"
        "   - Put the city name ONLY in the city field\n\n"
        "Example 1: 'Good morning, this is Sofia Martinez here. Call me on 555-123-4567. My residence, 89 Queen Street, flat 7C, London.'\n"
        "Correct extraction:\n"
        "{\n"
        "  \"name\": \"Sofia Martinez\",\n"
        "  \"phone\": \"+5551234567\",\n"
        "  \"street\": \"89 Queen Street, flat 7C\",\n"
        "  \"city\": \"London\",\n"
        "  \"state\": null,\n"
        "  \"zip\": null,\n"
        "  \"country\": null\n"
        "}\n\n"
        "Example 2: 'Hello, I'm Alice Johnson. You can reach me at 987-654-3210. I live at 56 Park Avenue Suite 12, Boston.'\n"
        "Correct extraction:\n"
        "{\n"
        "  \"name\": \"Alice Johnson\",\n"
        "  \"phone\": \"+9876543210\",\n"
        "  \"street\": \"56 Park Avenue Suite 12\",\n"
        "  \"city\": \"Boston\",\n"
        "  \"state\": null,\n"
        "  \"zip\": null,\n"
        "  \"country\": null\n"
        "}\n"
    )
    prompt = f"{instruction}\n\nTranscript:\n{text}\n\nExtract only these fields and return as JSON."

    try:
        client = ollama.Client(host=ollama_host)
        resp = client.generate(model=ollama_model_name, prompt=prompt)
        raw = resp.get("response", "")
        parsed = _extract_first_json_block(raw)
        if not parsed:
            # Fallback if _extract_first_json_block fails
            parsed = json.loads(raw.strip())
        
        if not isinstance(parsed, dict):
            raise ValueError("LLM returned non-dict JSON")

        def get_str(key):
            val = parsed.get(key)
            return val.strip() if isinstance(val, str) and val.strip() else None

        name = get_str("name")
        phone = get_str("phone")
        llm_street = get_str("street")
        llm_city = get_str("city")
        state = get_str("state")
        zip_code = get_str("zip")
        country = get_str("country")
        
        # Post-processing to fix common issues
        
        # 1. Fix name if it's null but we found one with regex
        if not name and extracted_name:
            name = extracted_name
            
        # 2. Try to extract name directly if still null
        if not name:
            # Look for common name patterns in the text
            name_patterns = [
                r'((?:[A-Z][a-z]+ ){1,2}[A-Z][a-z]+) (?:here|speaking)',
                r'(?:this is|my name is|I am|I\'m) ([A-Z][a-z]+ [A-Z][a-z]+)',
                r'(?:name|caller):? ([A-Z][a-z]+ [A-Z][a-z]+)'
            ]
            
            for pattern in name_patterns:
                name_match = re.search(pattern, text, re.IGNORECASE)
                if name_match:
                    name = name_match.group(1).strip()
                    break
        
        # 3. Clean up street address - remove city name from street if it appears there
        if llm_street and llm_city and llm_city in llm_street:
            # Remove the city and any trailing commas/spaces
            llm_street = re.sub(r',?\s*' + re.escape(llm_city) + r'(?:,|\s|$)', '', llm_street).strip().rstrip(',')
        
        # Use LLM values with fallbacks
        final_street = llm_street or street_address
        final_city = llm_city or city
        
        # Final normalization and cleaning for phone
        if phone:
            phone = re.sub(r"[^\d+]", "", phone)
            if phone.startswith("00"):
                phone = "+" + phone[2:]
            if phone and phone[0] != "+" and len(phone) >= 10:
                phone = "+" + phone
        
        # Create full address string, ensuring no duplicates
        address_parts = []
        if final_street:
            address_parts.append(final_street)
        if final_city and final_city not in final_street:
            address_parts.append(final_city)
        if state:
            address_parts.append(state)
        if zip_code:
            address_parts.append(zip_code)
        if country:
            address_parts.append(country)
            
        address = ", ".join(address_parts) if address_parts else None
        
        result = {
            "name": name,
            "phone": phone,
            "address": address,
            "street": final_street,
            "city": final_city,
            "state": state,
            "zip": zip_code,
            "country": country,
        }
        
        # Debug log the extraction
        logger.info(f"Address extraction results - Input: '{text}', Extracted: {json.dumps(result, indent=2)}")
        
        return result
    except Exception as e:
        logger.warning(f"LLM detailed extraction failed: {e}")
        # Return a basic extraction using regex patterns if LLM fails
        return {
            "name": extracted_name, 
            "phone": re.search(r'(\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4})', text).group(1).replace('-', '') if re.search(r'(\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4})', text) else None,
            "address": f"{street_address}, {city}" if street_address and city else None,
            "street": street_address, 
            "city": city, 
            "state": None, 
            "zip": None, 
            "country": None
        }
