LLM = "llama3"
TEMPERATURE = 0.2
SCOPES = [
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents.readonly"
]
QNA_DIFFCULTY_LEVEL_RATING_FIND_PROMPT = """
    <QUESTIONS>

    1. The above questions with their difficulty levels are from the question bank for the interview. Please analyze them.
    2. Now, analyze the following questions that were asked in the interview and match them with the questions from the bank. For each question, assign a difficulty level based on the corresponding question in the question bank.
    3. Evaluate whether the difficulty level is 'Basic', 'Medium', or 'Advanced'. If you are unsure about the level of a question or if it is not present in the question bank, mark it as 'unknown'.
    4. Please provide your response as a **pure JSON string** in the following format:

    ```json
    {
      "result": [
          {
              "id": "<question_id>",
              "question": "<question>",
              "difficulty_level": "<level>"
          },
          {
              "id": "<question_id>",
              "question": "<question>",
              "difficulty_level": "<level>"
          },
      ]
    }
    ```

    5. The questions that were asked to the candidate are as follows:

    <ASKED_QUESTIONS>

    
    Important: You must return only the JSON object. Do not add any explanations, headers, or other text outside the JSON object. If you include anything outside of the JSON, the response will be considered invalid.
    Do not prefix or suffix the response with any text like "Here is the analysis."
"""