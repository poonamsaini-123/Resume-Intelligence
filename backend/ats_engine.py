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
        suggestions.append("Resume ka overall keyword match kam hai, job description ke hisaab se relevant skills add karo.")
    if missing:
        suggestions.append(f"Ye skills add karne se ATS score badh sakta hai: {', '.join(missing[:3])}.")
    if len(found) < 5:
        suggestions.append("Projects/Experience section mein tools aur technologies clearly mention karo.")
    if not suggestions:
        suggestions.append("Resume achi tarah optimized hai, minor formatting hi check kar lo.")
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