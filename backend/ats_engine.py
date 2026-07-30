import re

SKILL_KEYWORDS = [
    "python", "sql", "machine learning", "fastapi", "api", "project",
    "java", "javascript", "html", "css", "git", "github", "docker",
    "aws", "django", "flask", "react", "node", "pandas", "numpy",
    "tensorflow", "pytorch", "excel", "communication", "leadership"
]


def extract_skills(text):
    text_lower = text.lower()
    found = [k for k in SKILL_KEYWORDS if k in text_lower]
    missing = [k for k in SKILL_KEYWORDS if k not in text_lower][:6]
    return found, missing


def generate_suggestions(found, missing, score):
    suggestions = []
    if score < 60:
        suggestions.append("Improve your resume by adding more job-relevant keywords and tailoring it to the target role.")
    if missing:
        suggestions.append(f"Consider adding the following skills if you have practical experience: {', '.join(missing[:3])}.")
    if len(found) < 5:
        suggestions.append("Include more technical skills, tools, and technologies in your Projects or Experience section.")
    if not suggestions:
        suggestions.append("Your resume is well structured. Review formatting and grammar before submitting applications.")
    return suggestions


def calculate_ats_score(text):

    score = 0

    # length check
    if len(text) > 1000:
        score += 20

    # keywords
    keywords = ["python", "sql", "machine learning", "fastapi", "api", "project"]
    found = sum(1 for k in keywords if k.lower() in text.lower())

    score += found * 10

    # formatting signals
    if re.search(r"\bexperience\b", text.lower()):
        score += 10

    if re.search(r"\beducation\b", text.lower()):
        score += 10

    return min(score, 100)