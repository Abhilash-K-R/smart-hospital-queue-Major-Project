from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "alive", "db_configured": os.getenv("DATABASE_URL") is not None}