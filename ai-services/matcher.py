import spacy
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import re

# Load spacy model for NLP
try:
    nlp = spacy.load("en_core_web_sm")
except:
    nlp = None

# Real Dataset: Curated list of technical skills for better analysis
SKILLS_DB = {
    "languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "php", "ruby", "go", "rust", "swift", "kotlin", "sql", "html", "css", "sass", "less", "r", "dart"
    ],
    "frameworks": [
        "react", "angular", "vue", "next.js", "nuxt.js", "svelte", "express", "django", "flask", "fastapi", "spring boot", "laravel", "rails", "asp.net", "flutter", "react native", "tailwind", "bootstrap", "jquery", "redux", "pytorch", "tensorflow", "keras", "scikit-learn", "pandas", "numpy"
    ],
    "tools": [
        "git", "github", "gitlab", "docker", "kubernetes", "aws", "azure", "gcp", "firebase", "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "jenkins", "terraform", "ansible", "postman", "jira", "figma", "unity", "unreal engine"
    ],
    "concepts": [
        "data science", "machine learning", "artificial intelligence", "deep learning", "nlp", "devops", "cloud computing", "blockchain", "cybersecurity", "frontend", "backend", "fullstack", "agile", "scrum", "microservices", "rest api", "graphql", "websocket", "ci/cd", "unit testing", "system design", "data structures", "algorithms"
    ]
}

# Flatten skills for easier matching
ALL_SKILLS = set()
for category in SKILLS_DB.values():
    for skill in category:
        ALL_SKILLS.add(skill.lower())

def extract_keywords(text):
    text = text.lower()
    found_keywords = set()
    
    # 1. Look for predefined skills (handles multi-word skills like "data science")
    for skill in ALL_SKILLS:
        if re.search(r'\b' + re.escape(skill) + r'\b', text):
            found_keywords.add(skill)
            
    # 2. Add NLP-based extraction for additional context/nouns
    if nlp:
        doc = nlp(text)
        for token in doc:
            if token.pos_ in ["NOUN", "PROPN"] and not token.is_stop and len(token.text) > 2:
                # Only add if it's not already found and seems technical
                if token.text not in found_keywords:
                    # Generic heuristic: avoid common non-tech nouns
                    common_non_tech = {"experience", "work", "job", "education", "summary", "skills", "projects", "team", "years"}
                    if token.text not in common_non_tech:
                        found_keywords.add(token.text)
    
    return found_keywords

def calculate_match_score(resume_text: str, jd_text: str):
    """
    Calculates the match score between a resume and job description.
    Returns a dictionary with score and detailed analysis.
    """
    # Clean text for vectorization
    documents = [resume_text.lower(), jd_text.lower()]
    
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
    tfidf_matrix = vectorizer.fit_transform(documents)
    
    # Calculate Cosine Similarity
    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
    base_score = float(similarity[0][0]) * 100
    
    # Keyword analysis
    resume_keywords = extract_keywords(resume_text)
    jd_keywords = extract_keywords(jd_text)
    
    # Prioritize SKILLS_DB matches for the "found" and "missing" lists
    db_resume_skills = resume_keywords.intersection(ALL_SKILLS)
    db_jd_skills = jd_keywords.intersection(ALL_SKILLS)
    
    found_skills = sorted(list(db_resume_skills.intersection(db_jd_skills)))
    missing_skills = sorted(list(db_jd_skills.difference(db_resume_skills)))
    
    # If no DB skills found, fall back to general keywords
    if not found_skills:
        found_skills = sorted(list(resume_keywords.intersection(jd_keywords)))[:10]
    if not missing_skills:
        missing_skills = sorted(list(jd_keywords.difference(resume_keywords)))[:10]
    
    # Score adjustment based on keyword coverage
    coverage_score = 0
    if jd_keywords:
        coverage_score = (len(resume_keywords.intersection(jd_keywords)) / len(jd_keywords)) * 100
    
    # Final weighted score
    weighted_score = (base_score * 0.4) + (coverage_score * 0.6)
    
    # Adjust for fresher-specific keywords
    fresher_boost = 0
    if "internship" in resume_text.lower(): fresher_boost += 5
    if "project" in resume_text.lower(): fresher_boost += 5
    
    final_score = min(100, round(weighted_score + fresher_boost, 1))
    
    # Analysis summary
    analysis = ""
    if final_score > 90:
        analysis = "Outstanding alignment! Your resume closely matches the technical requirements of this role."
    elif final_score > 75:
        analysis = "Strong match. You have most of the core skills, but consider highlighting more experience with: " + ", ".join(missing_skills[:2])
    elif final_score > 50:
        analysis = "Moderate match. To improve your score, explicitly mention your experience with " + ", ".join(missing_skills[:3]) + "."
    else:
        analysis = "Low alignment. We recommend tailoring your resume to emphasize the specific technologies mentioned in the JD, especially: " + ", ".join(missing_skills[:3])

    return {
        "match_score": final_score,
        "found_skills": found_skills[:20],
        "missing_skills": missing_skills[:20],
        "analysis": analysis
    }

