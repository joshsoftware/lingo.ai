from langchain_community.llms import Ollama
import conversation_diarization.jd_parser as jd_parser
import re

# Initialize an instance of the Llama 3.1 model
llm_llama = Ollama(model="llama3.1")

def align_interview_with_job_description(job_description_link, interview_qna):
    questions_string = "\n".join([f"{qa['id']}. {qa['question']}" for qa in interview_qna['result']])

    jd_result = jd_parser.read_docx(job_description_link)
    prompt = f"""Read the given Job Description below:

    {jd_result}

    and also Read the below Questions of the Interview:

    {questions_string}

    Now, Analyze the above Question's with JD, and evaluate if these Question's are relevant to the JD. Provide a rating out of 10.

    Generate the output as:

    Overall rating X/10

    Only Return a JSON like:

    result = {{
        "overall_rating": x/10,
        "Skills (Must have)": ['Question Numbers which are aligned for Skills (Must have)'],
        "Skills (Good to have)": ['Question Numbers which are aligned for Skills (Good to have)'],
        "Responsibilities": ['Question Numbers which are aligned for Responsibilities']
    }}

    and Based on whole evaluation you've done, give me strengths and weakness's of given candidate concisely in below JSON format -
    {{
        "strengths":[],
        "weakness":[]
    }}
    """

    response = llm_llama.invoke(prompt)

    # Extract overall rating
    rating_match = re.search(r"Overall rating: (\d+/10)", response)
    if rating_match:
        rating_match = rating_match.group(1) if rating_match else "Not available"

    # Extract question numbers for each category
    # overall_rating = re.search(r'"overall_rating": \[(.*?)\]', response)
    skills_must_have_match = re.search(r'"Skills \(Must have\)": \[(.*?)\]', response)
    skills_good_to_have_match = re.search(r'"Skills \(Good to have\)": \[(.*?)\]', response)
    responsibilities_match = re.search(r'"Responsibilities": \[(.*?)\]', response)
    strengths_match = re.search(r'"strengths": \[(.*?)\]', response)
    weaknesses_match = strengths = re.search(r'"weaknesses": \[(.*?)\]', response)

    if skills_must_have_match:
        matched_string = skills_must_have_match.group(0)
    if skills_good_to_have_match:
        matched_string = skills_good_to_have_match.group(0)
    if responsibilities_match:
        matched_string = responsibilities_match.group(0)
    if strengths_match:
        matched_string = strengths_match.group(0)
    if weaknesses_match:
        matched_string = weaknesses_match.group(0)

    # Extract question numbers as lists from the matched strings
    skills_must_have_list = skills_must_have_match.group(1).split(",") if skills_must_have_match else []
    skills_good_to_have_list = skills_good_to_have_match.group(1).split(",") if skills_good_to_have_match else []
    responsibilities_list = responsibilities_match.group(1).split(",") if responsibilities_match else []
    strengths_list = strengths_match.group(1).split(",") if strengths_match else []
    weaknesses_list = weaknesses_match.group(1).split(",") if weaknesses_match else []

    # Clean up the lists by stripping unwanted characters
    skills_must_have_list = [item.strip() for item in skills_must_have_list]
    skills_good_to_have_list = [item.strip() for item in skills_good_to_have_list]
    responsibilities_list = [item.strip() for item in responsibilities_list]

    # Construct the final result
    final_result = {
        "overall_rating": rating_match,
        "results": {
            "Skills (Must have)": skills_must_have_list,
            "Skills (Good to have)": skills_good_to_have_list,
            "Responsibilities": responsibilities_list
        }
    }

    final_result["results"]

    # Output the final result
    def get_matched_questions(question_ids):
        matched_questions = []
        for qa in input_QAs['result']:
            if str(qa['id']) in question_ids:
                matched_questions.append({
                    "question": qa["question"],
                    "answer": qa["answer"],
                    "correctness": qa["rightness"],
                    "remark": qa["remark"],
                    "rating": qa["rating"]
                })
        return matched_questions

    final_result_structured = {
        "rating_scale": [1, 10],
        "overall_rating": rating_match,
        "result": {
            "skills": {
                "skills_must_have": {
                    "overall_rating": 1,
                    "matched_questions": get_matched_questions(final_result['results']['Skills (Must have)'])
                },
                "skills_good_to_have": {
                    "overall_rating": 1,
                    "matched_questions": get_matched_questions(final_result['results']['Skills (Good to have)'])
                }
            },
            "domain_expertise": {
                "overall_rating": 1,
                "matched_questions": get_matched_questions(final_result['results']['Responsibilities'])
            },
            "strengths": strengths_list,
            "weaknesses": weaknesses_list,
        }
    }

    return final_result_structured
