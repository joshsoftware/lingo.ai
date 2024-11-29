import json
import ollama
import conversation_diarization.jd_parser as jd_parser
import re

# Initialize an instance of the Llama 3.1 model
# llm_llama = Ollama(model="llama3.1")
LLM = "llama3"
TEMPERATURE = 0.2

def align_interview_with_job_description(job_description_link, interview_qna):
    questions_string = "\n".join([f"{qa['id']}. {qa['question']}" for qa in interview_qna['result']])

    jd_result = jd_parser.read_docx(job_description_link)
    # return jd_result
    prompt = f"""Read the given Job Description below:

    {jd_result}

    and also Read the below Questions of the Interview:

    {questions_string}

    Now, Analyze the above Question's with JD, and evaluate if these Question's are relevant to the JD. Provide a rating out of 10.

    Generate the output only as JSON like:

    result = {{
        "overall_rating": 5,
        "core_skills": ["Question Numbers which are aligned for Skills (Must have)"],
        "secondary_skills": ["Question Numbers which are aligned for (Good to have)"],
        "domain_expertise": ["Question Numbers which are aligned for Responsibilities"]
    }}

    and Based on whole evaluation you've done, give me strengths and weakness's of given candidate concisely in below JSON format -
    {{
        "strengths":[],
        "weaknesses":[]
    }}
    """

    # response = llm_llama.invoke(prompt)
    response = ollama.chat(
        model=LLM,
        options={"temperature": TEMPERATURE},
        messages=[{"role": "user", "content": prompt}],
    )
    response_text = response.get("message", {}).get("content", "")
    response_text_json = re.search(r"\{.*\}", response_text, re.DOTALL)
    # return response_text_json.group()
    
    if response_text_json:
        try:
            response_text_json = json.loads(response_text_json.group())
        except json.JSONDecodeError as e:
            response_text_json = None
    else:
        response_text_json = None
        return ""

    # Extract overall rating
    # rating_match = re.search(r"overall_rating", response_text)
    # if rating_match:
    #     rating_match = rating_match.group() if rating_match else "Not available"

    # Extract question numbers for each category
    overall_rating = response_text_json["overall_rating"]
    core_skills = response_text_json["core_skills"]
    secondary_skills = response_text_json["secondary_skills"]
    domain_expertise = response_text_json["domain_expertise"]
    strengths_list = []
    weaknesses_list = []

    # Output the final result
    def get_matched_questions(question_ids):
        matched_questions = []
        for qa in interview_qna['result']:
            if str(qa['id']) in question_ids:
                matched_questions.append({
                    "id": qa['id'],
                    "question": qa["question"],
                    "answer": qa["answer"],
                    "correctness": qa["rightness"],
                    "remark": qa["remark"],
                    "rating": qa["rating"]
                })
        return matched_questions

    result = {
        "rating_scale": [1, 10],
        "overall_rating": overall_rating,
        "result": {
            "skills": {
                "core": {
                    "overall_rating": -1,
                    "matched_questions": get_matched_questions(core_skills)
                },
                "secondary": {
                    "overall_rating": -1,
                    "matched_questions": get_matched_questions(secondary_skills)
                }
            },
            "domain_expertise": {
                "overall_rating": -1,
                "matched_questions": get_matched_questions(domain_expertise)
            },
            "strengths": strengths_list,
            "weaknesses": weaknesses_list,
        }
    }

    return result
