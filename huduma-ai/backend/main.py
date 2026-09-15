from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File, Form
import fitz  # PyMuPDF
import tempfile
import os

from api.chat import router as chat_router
from api.file_chat import router as file_chat_router


app = FastAPI(
    title="Huduma AI API",
    description="AI assistant for Tanzania government services",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    chat_router,
    prefix="/api",
    tags=["Chat"],
)

app.include_router(
    file_chat_router,
    prefix="/api",
    tags=["File Chat"],
)


@app.get("/")
def root():
    return {
        "message": "Huduma AI API is running!",
        "status": "success",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }