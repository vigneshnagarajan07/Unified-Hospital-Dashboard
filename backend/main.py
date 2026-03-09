from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from groq import Groq

from routers import m1_aggregation, m2_kpi, m3_anomaly, m4_insights, m5_recommendations, m6_roles, m7_forecast

app = FastAPI(title="GKM_8 Hospital Dashboard API")

# Setup CORS for Vite UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Modules
app.include_router(m1_aggregation.router)
app.include_router(m2_kpi.router)
app.include_router(m3_anomaly.router)
app.include_router(m4_insights.router)
app.include_router(m5_recommendations.router)
app.include_router(m6_roles.router)
app.include_router(m7_forecast.router)

# Extras: Ask-the-Dashboard Chatbot Endpoint
class ChatMessage(BaseModel):
    message: str

@app.post("/api/chat")
async def dashboard_chat(chat_data: ChatMessage):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key_here":
        return {"response": "I am the GKM_8 AI assistant. (Demo mode: valid Groq key missing.)"}
        
    try:
        from data.hospital_data import get_hospital_data
        import json
        
        context = json.dumps(get_hospital_data()["departments"])
        system_prompt = f"You are GKM_8, a hospital dashboard AI assistant. Use the following real-time data to answer user questions concisely and accurately: {context}"
        
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            max_tokens=300,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": chat_data.message}
            ]
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        return {"response": f"Error connecting to AI: {str(e)}"}

@app.get("/")
def read_root():
    return {"status": "ok", "message": "GKM_8 Hospital Backend Running"}
