import os
import json
import re
import requests
import pandas as pd


class ResultEngine:
    def __init__(self):
        self.groq_api_key = os.environ.get("GROQ_API_KEY")
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model_name = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

        self.result_kb = [
            {
                "id": "city_visionary",
                "title": "City Visionary",
                "basecamp": "Big and Creative City Life",
                "partner": ["Kangaroo Jumper"],
                "treasure": ["Endless Gold"],
                "funBalance": ["All Work, No Play"],
                "downtime": ["City Explorer"],
                "rankingView": ["Top 100 or bust!"],
                "afterGraduation": ["Power Up Your Knowledge", "Enter the Arena"],
                "personality": "Serious Study Person",
                "priority": 1
            },
            {
                "id": "adventurous_scholar",
                "title": "Adventurous Scholar",
                "basecamp": "Fast-Paced and Exciting",
                "partner": ["Crocodile Survivor"],
                "treasure": ["Treasure Trove", "Endless Gold"],
                "funBalance": ["Balanced Adventurer"],
                "downtime": ["Surf the Waves"],
                "rankingView": ["Top 100 or bust!"],
                "afterGraduation": ["Power Up Your Knowledge"],
                "personality": "Serious Study Person",
                "priority": 2
            },
            {
                "id": "dynamic_explorer",
                "title": "Dynamic Explorer",
                "basecamp": "Fast-Paced and Exciting",
                "partner": ["Crocodile Survivor"],
                "treasure": ["Well-Stocked", "Treasure Trove"],
                "funBalance": ["Party Expert"],
                "downtime": ["Surf the Waves"],
                "rankingView": ["Top 200 works for me"],
                "afterGraduation": ["Embark on a World Tour"],
                "personality": "Relaxed Person",
                "priority": 3
            },
            {
                "id": "creative_innovator",
                "title": "Creative Innovator",
                "basecamp": "Big and Creative City Life",
                "partner": ["Platypus Explorer"],
                "treasure": ["Well-Stocked", "Treasure Trove"],
                "funBalance": ["Balanced Adventurer"],
                "downtime": ["City Explorer"],
                "rankingView": ["It's all about the program"],
                "afterGraduation": ["Build Your Own Path", "Embark on a World Tour"],
                "personality": "Relaxed Person",
                "priority": 4
            },
            {
                "id": "focused_scholar",
                "title": "Focused Scholar",
                "basecamp": "Quiet and Relaxed",
                "partner": ["Koala Chill", "Wombat Wanderer"],
                "treasure": ["Well-Stocked"],
                "funBalance": ["All Work, No Play"],
                "downtime": ["Hike the Outback"],
                "rankingView": ["It's all about the program"],
                "afterGraduation": ["Enter the Arena"],
                "personality": "Serious Study Person",
                "priority": 5
            },
            {
                "id": "balanced_adventurer",
                "title": "Balanced Adventurer",
                "basecamp": "A Mix of City and Nature",
                "partner": ["Kangaroo Jumper", "Wombat Wanderer"],
                "treasure": ["Well-Stocked"],
                "funBalance": ["Balanced Adventurer"],
                "downtime": ["Surf the Waves"],
                "rankingView": ["Top 200 works for me", "It's all about the program"],
                "afterGraduation": ["Enter the Arena"],
                "personality": "Serious Study Person",
                "priority": 6
            },
            {
                "id": "nature_loving_learner",
                "title": "Nature-Loving Learner",
                "basecamp": "A Mix of City and Nature",
                "partner": ["Wombat Wanderer"],
                "treasure": ["Small Fortune"],
                "funBalance": ["Relaxed Scholar"],
                "downtime": ["Wildlife Watcher", "Hike the Outback"],
                "rankingView": ["Top 200 works for me"],
                "afterGraduation": ["Build Your Own Path"],
                "personality": "Relaxed Person",
                "priority": 7
            },
            {
                "id": "mindful_learner",
                "title": "Mindful Learner",
                "basecamp": "Quiet and Relaxed",
                "partner": ["Koala Chill"],
                "treasure": ["Small Fortune"],
                "funBalance": ["Relaxed Scholar"],
                "downtime": ["Wildlife Watcher", "Hike the Outback"],
                "rankingView": ["Who cares about rankings?"],
                "afterGraduation": ["Embark on a World Tour"],
                "personality": "Relaxed Person",
                "priority": 8
            }
        ]

        self.universities = self._load_universities()

    def _load_universities(self):
        excel_path = os.path.join(os.path.dirname(__file__), "australian_universities_2026.xlsx")
        if not os.path.exists(excel_path):
            return []
        df = pd.read_excel(excel_path, sheet_name="University Data 2026")
        universities = []
        for _, row in df.iterrows():
            universities.append({
                "name": str(row.get("University Name", "")),
                "city": str(row.get("City", "")),
                "state": str(row.get("State", "")),
                "qs_ranking": str(row.get("QS World Ranking (2026)", "")),
                "go8": str(row.get("Group of Eight (Go8)", "")),
                "courses": str(row.get("2026 In-Demand Courses", "")),
                "intl_fee": str(row.get("Annual Intl. Tuition Fee (AUD 2026)", "")),
                "domestic_fee": str(row.get("Annual Domestic Fee (AUD 2026)", "")),
                "type": str(row.get("University Type", "")),
                "personality_match": str(row.get("Quiz Personality Match", "")),
                "environment": str(row.get("Environment Tag", ""))
            })
        return universities

    def extract_json(self, text):
        try:
            return json.loads(text)
        except Exception:
            match = re.search(r"\{[\s\S]*\}", text)
            if match:
                return json.loads(match.group(0))
            raise Exception("Invalid JSON returned from AI")

    def _call_groq(self, system_prompt, user_prompt):
        response = requests.post(
            self.groq_url,
            headers={
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": self.model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 1000
            },
            timeout=30
        )
        data = response.json()
        if response.status_code != 200:
            raise Exception(f"Groq API failed: {data}")
        return data["choices"][0]["message"]["content"]

    def build_personality_prompt(self, user_answers):
        return f"""
You are an expert personality classification AI.

The user completed an Australia study personality quiz.

Your job:
1. Compare the user's answers against the available result profiles.
2. Find the closest matching profile.
3. If multiple profiles are close, use the lower priority number as higher importance.
4. Even if the exact combination does not exist, choose the closest profile.
5. Return ONLY valid JSON. No markdown. No explanation outside JSON.

IMPORTANT RULES FOR OUTPUT:
- "confidence" must be an integer between 0 and 100 (e.g. 95, not 0.95)
- Every field must be a single string value, never an array or comma-separated list
- For fields like "partner", "rankingView", "afterGraduation" — pick the single best matching value only

AVAILABLE RESULT PROFILES:
{json.dumps(self.result_kb, indent=2)}

USER ANSWERS:
{json.dumps(user_answers, indent=2)}

Return this format:
{{
    "id": "",
    "title": "",
    "personality": "",
    "basecamp": "",
    "partner": "",
    "treasure": "",
    "funBalance": "",
    "downtime": "",
    "rankingView": "",
    "afterGraduation": "",
    "description": "",
    "reason": "",
    "confidence": 0
}}
"""

    def build_university_prompt(self, personality_result, user_answers):
        title = personality_result.get("title", "")
        passion = user_answers.get("passion", "")
        passion_line = f"- Their passion/field of study is: {passion}" if passion else ""
        passion_courses_line = f'- In the "top_courses" field, ONLY list courses related to {passion}. List at least 2-3 specific courses or specialisations, not just the field name (e.g. for Law say "Law, International Law, Corporate Law" not just "Law")' if passion else ""
        passion_why_line = f'- In the "why" field, focus specifically on why this university is great for {passion} students, mentioning specific strengths, facilities or industry connections where possible' if passion else ""

        relevant = [
            u for u in self.universities
            if title in u["personality_match"]
        ]

        if not relevant:
            relevant = self.universities

        return f"""
You are an Australian university recommendation expert.

A student just completed a personality quiz and got this result:
{json.dumps(personality_result, indent=2)}

Below are Australian universities that match this personality type.
Pick the TOP 3 best matches considering:
- Their basecamp preference (city/nature/quiet)
- Their ranking view (top 100, top 200, program-focused, doesn't care)
- Their treasure/budget (Endless Gold = high budget ok, Small Fortune = prefer affordable)
- Their afterGraduation plans
{passion_line}
{passion_courses_line}
{passion_why_line}

UNIVERSITIES TO CHOOSE FROM:
{json.dumps(relevant, indent=2)}

Return ONLY valid JSON. No markdown. No explanation outside JSON.

Return this exact format:
{{
    "recommendations": [
        {{
            "rank": 1,
            "name": "",
            "city": "",
            "state": "",
            "qs_ranking": "",
            "why": "",
            "top_courses": "",
            "intl_fee": "",
            "domestic_fee": ""
        }},
        {{
            "rank": 2,
            "name": "",
            "city": "",
            "state": "",
            "qs_ranking": "",
            "why": "",
            "top_courses": "",
            "intl_fee": "",
            "domestic_fee": ""
        }},
        {{
            "rank": 3,
            "name": "",
            "city": "",
            "state": "",
            "qs_ranking": "",
            "why": "",
            "top_courses": "",
            "intl_fee": "",
            "domestic_fee": ""
        }}
    ]
}}
"""

    def generate(self, user_answers):
        if not self.groq_api_key:
            return {
                "error": "GROQ_API_KEY is missing. Add it inside backend/.env"
            }, 500

        try:
            # Step 1: Get personality result
            personality_text = self._call_groq(
                "You are an expert personality classification AI. Return ONLY valid JSON.",
                self.build_personality_prompt(user_answers)
            )
            personality_result = self.extract_json(personality_text)

            # Step 2: Get university recommendations using both personality + raw answers
            if self.universities:
                uni_text = self._call_groq(
                    "You are an Australian university recommendation expert. Return ONLY valid JSON.",
                    self.build_university_prompt(personality_result, user_answers)
                )
                uni_result = self.extract_json(uni_text)
                personality_result["university_recommendations"] = uni_result.get("recommendations", [])
            else:
                personality_result["university_recommendations"] = []
                personality_result["uni_warning"] = "australian_universities_2026.xlsx not found in backend folder"

            return personality_result, 200

        except Exception as e:
            return {
                "error": "Failed to generate result",
                "details": str(e)
            }, 500