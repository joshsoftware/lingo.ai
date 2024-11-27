UPDATED_QNA_PROMPT_MSG = """
    <TRANSCRIPTION>

    1. Above is the transcription of an interview. Analyze the communication and make a list of questions asked by the interviewer and their answers given by the candidate.
    2. Evaluate whether the answer is 'right', 'partially right,' or 'wrong.' Put 'unknown' if you are unsure about the correctness of the answer.
    3. Rate each answer out of 10 (1 to 10).
    4. Add a remark stating what could be improved when the rating for an answer is not 10 out of 10. Otherwise, keep it empty.
    5. I want your response as a **pure JSON string**, in the following format:

    ```json
    {
        "rating_scale": [1, 10],
        "result": [
            {
                "id": 1,
                "question": "",
                "answer": "",
                "correctness": "",
                "remark": "",
                "rating": 1
            }
        ]
    }
    
    
    Important: You must return only the JSON object. Do not add any explanations, headers, or other text outside the JSON object. If you include anything outside of the JSON, the response will be considered invalid.
    Do not prefix or suffix the response with anything like "Here is the analysis."
    """

QNA_PROMPT_MESSAGE = """
    <TRANSCRIPTION>
    
    1. Above is the transcription of an interview. Analyse the communication and make a list of questions asked by interviewer and their 2. answers given by the candidate.
    3. Evaluate whether the answer is 'right', 'partially right' or 'wrong'. Put 'unknown' if you are not sure about correctness of the answer.
    4. Rate each answer out of 10 (1 to 10).
    5. Add a remark stating what could be improved when rating for an answer is not 10 out of 10. Otherwise keep it empty.
    6. I want your response as a pure JSON, in following format:
    
    {
        "rating_scale": [1,10],
        "result": [
            {
                "id": 1,
                "question": "",
                "answer": "",
                "correctness": "",
                "remark": "",
                "rating": 1
            },
            {
                "id": 2,
                "question": "",
                "answer": "",
                "correctness": "",
                "remark": "",
                "rating": 1
            }
        ]
    }
    
    I'll be parsing your response directly as a JSON string, so make sure apart JSON, no other text is present in response.
    """