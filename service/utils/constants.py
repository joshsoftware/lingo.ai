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

    1. Above are the questions from question bank. Analyze them.
    2. Now, analyze the below questions that were asked in the interview and align them with above questions bank. For each question, assign a difficulty level based on the corresponding question in the question bank.

    <ASKED_QUESTIONS>



    3. Evaluate whether the difficulty level is 'Basic', 'Medium', or 'Advanced'. 
    4. If you are unsure about the level of a question then provide a difficulty level by your own.
    5. If it is not present in the question bank, mark it as 'Unknown'.
    6. Please provide your response as a **pure JSON string** in the following format:

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
    Important: You must return only the JSON object. Do not add any explanations, headers, or other text outside the JSON object. If you include anything outside of the JSON, the response will be considered invalid.
    Do not prefix or suffix the response with any text like "Here is the analysis."
"""