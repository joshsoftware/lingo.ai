from langchain_core.prompts import PromptTemplate

# Define and return the reusable prompt template
def get_summarization_template():
    return PromptTemplate(
        input_variables=["conversation_text"],  # Placeholder for dynamic input
        template="""Please summarize the following conversation between two people. 
                   Focus on the main points and key takeaways, avoiding unnecessary details and repetitions: 
                   {conversation_text}"""
    )
