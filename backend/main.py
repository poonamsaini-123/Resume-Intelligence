from fastapi import FastAPI, UploadFile, File
from .gemini_service import analyze_text
from .pdf_reader import extract_text
import shutil
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="RESUME-INTELLIGENCE",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.get("/")
def home():
    return {"message": "Welcome to Resume-Intelligence 🚀"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join("uploads", file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted_text = extract_text(file_path)
    print("EXTRACTED TEXT:", extracted_text)

    analysis = analyze_text(extracted_text)
    print("ANALYSIS:", analysis)  
    
    return {
    "filename": file.filename,
    "analysis": analysis
}