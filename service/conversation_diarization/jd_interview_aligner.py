import json
import ollama
import conversation_diarization.jd_parser as jd_parser
import re
from utils.constants import QNA_DIFFCULTY_LEVEL_RATING_FIND_PROMPT
import pandas as pd

from conversation_diarization.prompt import JD_INTERVIEW_ALIGNMENT_PROMPT

LLM = "llama3"
TEMPERATURE = 0.0

def align_interview_with_job_description(job_description_link, interview_qna):
    questions_string = "\n".join([f"{qa['id']}. {qa['question']}" for qa in interview_qna['result']])

    jd_result = jd_parser.read_docx(job_description_link)
    
    prompt = JD_INTERVIEW_ALIGNMENT_PROMPT.replace("<JOB_DESCRIPTION>", json.dumps(jd_result))
    prompt = JD_INTERVIEW_ALIGNMENT_PROMPT.replace("<QUESTIONS_AND_ANSWERS>", questions_string)

    response = ollama.chat(
        model=LLM,
        options={"temperature": TEMPERATURE},
        messages=[{"role": "user", "content": prompt}],
    )
    response_text = response.get("message", {}).get("content", "")
    response_text_json = re.search(r"\{.*\}", response_text, re.DOTALL)
    
    response_text_grouped = response_text_json.group()
    difficulty_level_ratings = get_question_level_ratings(Asked_Questions=questions_string)
    
    if response_text_json:
        try:
            response_text_json = json.loads(response_text_grouped)
            print(response_text_json)
        except json.JSONDecodeError as e:
            response_text_json = None
            return f"JSON parse error {e}"
    else:
        response_text_json = None
        return "response empty"
    
    result = {}

    overall_rating = 0
    core_skills = response_text_json["core_skills"]
    secondary_skills = response_text_json["secondary_skills"]
    domain_expertise = response_text_json["domain_expertise"]
    strengths = response_text_json["strengths"]
    weaknesses = response_text_json["weaknesses"]
    summary = response_text_json["summary"]
    
    # def get_matched_questions(question_ids):
    #     matched_questions = []
    #     for qa in interview_qna["result"]:
    #         if str(qa["id"]) in question_ids:
    #             matched_questions.append(qa)
    #     return matched_questions

    def get_matched_questions_with_difficulty(question_ids):
        matched_questions = []
        for qa in interview_qna["result"]:
            if str(qa["id"]) in question_ids:
                difficulty = next(
                    (dlr["difficulty_level"] for dlr in difficulty_level_ratings["result"] if dlr["id"] == qa["id"]),
                    "Unknown"
                )
                qa_with_difficulty = {
                    **qa,
                    "difficulty_level": difficulty
                }
                matched_questions.append(qa_with_difficulty)
        return matched_questions

    core_skills = response_text_json["core_skills"]
    secondary_skills = response_text_json["secondary_skills"]
    domain_expertise = response_text_json["domain_expertise"]
    
    core_skills_qna = get_matched_questions_with_difficulty(core_skills)
    secondary_skills_qna = get_matched_questions_with_difficulty(secondary_skills)
    domain_expertise_qna = get_matched_questions_with_difficulty(domain_expertise)
    
    core_skills_rating = 0 if not core_skills_qna else round(sum(q["rating"] for q in core_skills_qna) / len(core_skills_qna))
    secondary_skills_rating = 0 if not secondary_skills_qna else round(sum(q["rating"] for q in secondary_skills_qna) / len(secondary_skills_qna))
    domain_expertise_rating = 0 if not domain_expertise_qna else round(sum(q["rating"] for q in domain_expertise_qna) / len(domain_expertise_qna))
    
    overall_rating = round((core_skills_rating + secondary_skills_rating + domain_expertise_rating) / 3)

    result = {
        "parsed_job_description": jd_result,
        "analysis": {
            "rating_scale": [1, 10],
            "overall_rating": overall_rating,
            "summary": summary,
            "result": {
                "skills": {
                    "core": {
                        "overall_rating": core_skills_rating,
                        "questions": core_skills_qna
                    },
                    "secondary": {
                        "overall_rating": secondary_skills_rating,
                        "questions": secondary_skills_qna
                    }
                },
                "domain_expertise": {
                    "overall_rating": domain_expertise_rating,
                    "questions": domain_expertise_qna
                },
                "strengths": strengths,
                "weaknesses": weaknesses,
            }
        },
    }

    return result

def get_question_level_ratings(Asked_Questions):
  try:
    file_path = "/Users/sethupathiasokan/Documents/AiCruit/lingo.ai/Scorecard Template.xlsx"
    sheet_name = "Java"
    columns_to_fetch = ["Question", "Level"]

    questions_from_bank = fetch_columns_from_excel(file_path, sheet_name, columns_to_fetch)

    prompt = create_prompt(questionBank=questions_from_bank, asked_questions=Asked_Questions)

    response = ollama.chat(
        model=LLM,
        options={"temperature": TEMPERATURE},
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = response.get("message", {}).get("content", "")
    response_text_json = re.search(r"\{.*\}", response_text, re.DOTALL)
    
    if response_text_json:
        try:
            response_text_json = json.loads(response_text_json.group())
        except json.JSONDecodeError as e:
            response_text_json = None
    else:
        response_text_json = None
    
    return response_text_json
  except Exception as e:
    print(f"Error: {e}")
    return None
  
def fetch_columns_from_excel(file_path, sheet_name, columns_to_fetch):
  try:
      # Read the Excel file
      df = pd.read_excel(file_path, sheet_name=sheet_name)

      # Check if the required columns exist in the sheet
      if not all(col in df.columns for col in columns_to_fetch):
          raise ValueError(f"Some columns are missing in the sheet '{sheet_name}'.")

      # Fetch the specified columns
      result_df = df[columns_to_fetch]
      result = ""
      result += "\n".join([f"{row['Question']} - {row['Level']}" for _, row in result_df.iterrows()])

      return result

  except FileNotFoundError:
      return f"Error: The file at {file_path} does not exist."
  except ValueError as ve:
      return str(ve)
  except Exception as e:
      return f"An error occurred: {str(e)}"
  
def create_prompt(questionBank: str, asked_questions: str) -> str:
    return QNA_DIFFCULTY_LEVEL_RATING_FIND_PROMPT.replace("<QUESTIONS>", questionBank).replace("<ASKED_QUESTIONS>", asked_questions)
