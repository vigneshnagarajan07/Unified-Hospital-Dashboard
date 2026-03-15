from fastapi import APIRouter
import os
import json
from groq import Groq
from data.hospital_data import get_hospital_data

router = APIRouter(prefix="/api/m4", tags=["AI Insights"])

@router.get("/insights")
async def get_insights():
    """
    M4 - AI Insight Generator
    Uses Claude API to analyze current hospital data and return structured insights.
    Falls back to mock insights if API key is invalid or an error occurs.
    """
    data = get_hospital_data()
    api_key = os.getenv("GROQ_API_KEY")
    
    # Fallback mock insights in case Claude is not reachable
    mock_insights = [
        {
            "insight": "Cardiology OPD wait times have spiked by 38% above baseline.",
            "department": "Cardiology",
            "priority": "High",
            "category": "operational",
            "recommended_action": "Deploy 2 standby doctors to Cardiology OPD immediately to clear the 84 patient backlog."
        },
        {
            "insight": "General Medicine has reached 97% bed occupancy, severely limiting new admissions.",
            "department": "General Medicine",
            "priority": "Critical",
            "category": "clinical",
            "recommended_action": "Initiate expedited discharge protocols for stable patients. Redirect elective admissions to partner facilities."
        },
        {
            "insight": "Emergency ICU is at 100% capacity (6/6 beds filled) with 12 critical patients waiting.",
            "department": "Emergency",
            "priority": "Critical",
            "category": "operational",
            "recommended_action": "Move stable ED ICU patients to step-down wards. Alert nearby hospitals for diversion."
        },
        {
            "insight": "Patient satisfaction in Cardiology dropped to 3.9, likely correlated with extended wait times.",
            "department": "Cardiology",
            "priority": "Medium",
            "category": "staffing",
            "recommended_action": "Deploy patient relations executive to communicate wait times transparently and offer refreshments."
        },
        {
            "insight": "Orthopedics and Pediatrics have healthy bed availability (65% and 72% respectively).",
            "department": "Hospital-wide",
            "priority": "Low",
            "category": "financial",
            "recommended_action": "Consider temporary internal cross-ward patient transfers utilizing available pediatric/ortho beds for stable medicine patients."
        }
    ]

    if not api_key or api_key == "your_groq_api_key_here":
        return {"insights": mock_insights, "source": "mock_fallback"}

    try:
        # Format the data for Claude
        context = json.dumps(data["departments"])
        
        prompt = f"""
        You are an expert hospital administrator and data analyst AI.
        Analyze the following real-time hospital department data and identify the 5 most critical insights.
        Focus on anomalies, operational bottlenecks, staffing issues, and clinical risks.
        
        Hospital Data:
        {context}
        
        Respond ONLY with a JSON array of 5 objects matching this exact structure:
        [
          {{
            "insight": "Description of what is happening",
            "department": "Specific department or 'Hospital-wide'",
            "priority": "Critical, High, Medium, Low",
            "category": "operational, clinical, financial, or staffing",
            "recommended_action": "Clear actionable recommendation"
          }}
        ]
        """
        
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            max_tokens=1000,
            temperature=0,
            messages=[
                {"role": "system", "content": "You are an AI that only outputs valid JSON arrays."},
                {"role": "user", "content": prompt}
            ]
        )
        
        json_output = response.choices[0].message.content
        # Optional: Clean up if Groq included markdown block
        if "```json" in json_output:
            json_output = json_output.split("```json")[1].split("```")[0].strip()
        elif "```" in json_output:
            json_output = json_output.split("```")[1].strip()
            
        insights = json.loads(json_output)
        return {"insights": insights, "source": "groq"}
        
    except Exception as e:
        print(f"Groq API Error: {str(e)}")
        # Return fallback if network/API fails
        return {"insights": mock_insights, "source": "error_fallback", "error": str(e)}
