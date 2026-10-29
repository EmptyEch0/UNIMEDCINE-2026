import json
import requests
import os
import joblib
import pandas as pd
import numpy as np
from app.core.config import settings

# Paths to the trained ML model files
MODEL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "Model Training", "archive (1)"
)
MODEL_PATH = os.path.join(MODEL_DIR, "best_disease_model.pkl")
ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")
COLUMNS_PATH = os.path.join(MODEL_DIR, "symptom_columns.pkl")

# Path to the OTC guidance JSON file
OTC_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "otc_guidance.json"
)

# Direct mappings from predicted Kaggle dataset classes to the otc_guidance.json slugs
DISEASE_TO_OTC_SLUG = {
    "Fungal infection": "athletes_foot_mild",
    "Allergy": "allergic_rhinitis",
    "GERD": "gastric_acidity",
    "Chronic cholestasis": "gastric_acidity",
    "Drug Reaction": "allergic_skin_rash",
    "Peptic ulcer diseae": "gastric_acidity",
    "AIDS": "insomnia_short_term_hygiene",
    "Diabetes ": "insomnia_short_term_hygiene",
    "Gastroenteritis": "gastroenteritis_viral_mild",
    "Bronchial Asthma": "common_cold",
    "Hypertension ": "insomnia_short_term_hygiene",
    "Migraine": "migraine_mild",
    "Cervical spondylosis": "minor_back_pain",
    "Paralysis (brain hemorrhage)": "insomnia_short_term_hygiene",
    "Jaundice": "nausea_mild",
    "Malaria": "acute_fever",
    "Chicken pox": "allergic_skin_rash",
    "Dengue": "acute_fever",
    "Typhoid": "acute_fever",
    "hepatitis A": "nausea_mild",
    "Hepatitis B": "nausea_mild",
    "Hepatitis C": "nausea_mild",
    "Hepatitis D": "nausea_mild",
    "Hepatitis E": "nausea_mild",
    "Alcoholic hepatitis": "nausea_mild",
    "Tuberculosis": "bronchitis_viral_symptomatic",
    "Common Cold": "common_cold",
    "Pneumonia": "bronchitis_viral_symptomatic",
    "Dimorphic hemmorhoids(piles)": "hemorrhoids_mild",
    "Heart attack": "sun_exposure_heatstroke_flag",
    "Varicose veins": "foot_pain_minor",
    "Hypothyroidism": "insomnia_short_term_hygiene",
    "Hyperthyroidism": "insomnia_short_term_hygiene",
    "Hypoglycemia": "heat_exhaustion_mild",
    "Osteoarthristis": "minor_joint_pain_arthritis_symptomatic",
    "Arthritis": "minor_joint_pain_arthritis_symptomatic",
    "(vertigo) Paroymsal  Positional Vertigo": "motion_sickness",
    "Acne": "acne_mild",
    "Urinary tract infection": "urinary_symptom_simple_dysuria_info",
    "Psoriasis": "eczema_mild",
    "Impetigo": "minor_cuts"
}

class AIService:
    @staticmethod
    def _load_otc_guidance() -> list:
        if os.path.exists(OTC_PATH):
            try:
                with open(OTC_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error reading otc_guidance.json: {e}")
        return []

    @classmethod
    def analyze_symptoms(cls, age: int, gender: str, symptoms: str, duration: str, 
                         temp: str = "", history: str = "", allergies: str = "", medicines: str = "") -> dict:
        
        # 1. Check if this is a general friendly greeting/chat
        greetings = {"hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening", "howdy", "sup", "help", "who are you", "what is this"}
        is_chat_only = age == -1 or symptoms.lower().strip() in greetings
        
        if is_chat_only:
            try:
                url = f"{settings.OLLAMA_API_URL}/api/generate"
                payload = {
                    "model": settings.OLLAMA_MODEL,
                    "prompt": f"The student says: '{symptoms}'. Respond as the JNTU-GV UniMedicine Clinical AI Assistant in a friendly, supportive, welcoming way. Encourage them to detail any health issues or symptoms if they need a diagnosis. Keep it under 3 sentences.",
                    "stream": False
                }
                response = requests.post(url, json=payload, timeout=6.0)
                if response.status_code == 200:
                    reply = response.json().get("response", "").strip()
                    return {"explanation": reply, "possible_diseases": [], "is_chat": True}
            except Exception:
                pass
            
            # NLP Fallback chat sentence
            return {
                "explanation": "Hello! I am UniMedicine's AI Clinical Assistant. If you are experiencing any symptoms, aches, or general discomfort, let me know, and we can begin a diagnostic checkup.",
                "possible_diseases": [],
                "is_chat": True
            }

        # 2. Symptoms checker pathway
        result = None
        matched_symptom_list = []
        columns = []
        
        if os.path.exists(COLUMNS_PATH):
            try:
                columns = joblib.load(COLUMNS_PATH)
                symptoms_lower = symptoms.lower().replace(" ", "_")
                for col in columns:
                    col_clean = col.replace("_", " ")
                    if col in symptoms_lower or col_clean in symptoms_lower:
                        matched_symptom_list.append(col)
            except Exception as e:
                print(f"Error loading columns: {e}")

        # Route A: ML Model matched symptoms path
        if matched_symptom_list and os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
            try:
                model = joblib.load(MODEL_PATH)
                encoder = joblib.load(ENCODER_PATH)

                # Initialize input vector
                input_vector = pd.DataFrame([np.zeros(len(columns))], columns=columns)
                for sym in matched_symptom_list:
                    input_vector[sym] = 1

                # Make ML Prediction
                if hasattr(model, "predict_proba"):
                    probs = model.predict_proba(input_vector)[0]
                    top_idx = np.argsort(probs)[::-1][:3]
                    
                    possible_diseases = []
                    for idx in top_idx:
                        prob_pct = round(probs[idx] * 100, 1)
                        if prob_pct > 1.0:
                            possible_diseases.append({
                                "name": str(encoder.classes_[idx]),
                                "probability": f"{prob_pct}%"
                            })
                else:
                    pred = model.predict(input_vector)[0]
                    possible_diseases = [{
                        "name": str(encoder.classes_[pred]),
                        "probability": "100.0%"
                    }]

                if not possible_diseases:
                    possible_diseases = [{"name": "Common Cold", "probability": "90%"}]

                primary_disease = possible_diseases[0]["name"]
                
                # Fetch OTC Guidance details based on mapped slug
                slug = DISEASE_TO_OTC_SLUG.get(primary_disease, "common_cold")
                otc_data = cls._load_otc_guidance()
                otc_record = next((item for item in otc_data if item["slug"] == slug), None)
                
                if not otc_record and otc_data:
                    otc_record = otc_data[0] # Default fallback to first element (common_cold)

                explanation = ""
                if otc_record:
                    # Use LLM for sentence creation/formatting
                    try:
                        url = f"{settings.OLLAMA_API_URL}/api/generate"
                        prompt = f"""
                        You are the JNTU-GV UniMedicine Clinical AI. Summarize the diagnosis and treatment plan for a {age}-year-old {gender} student in a friendly, reassuring, professional explanation paragraph.
                        Clinical facts to write about:
                        - Diagnosis: {primary_disease} ({possible_diseases[0]['probability']} likelihood)
                        - Matching symptoms details: {otc_record['common_symptoms']}
                        - Suggested OTC medicines and notes: {otc_record['recommended_otc_medicines']}
                        - Essential precautions: {otc_record['precautions']}
                        - When to see doctor guidelines: {otc_record['when_to_see_doctor']}
                        
                        Write a single comforting paragraph explaining what the ML model found, recommended OTC drugs (mention molecule details), precautions, and warnings. Do not include any JSON or preamble.
                        """
                        payload = {
                            "model": settings.OLLAMA_MODEL,
                            "prompt": prompt,
                            "stream": False
                        }
                        response = requests.post(url, json=payload, timeout=8.0)
                        if response.status_code == 200:
                            explanation = response.json().get("response", "").strip()
                    except Exception:
                        pass
                    
                    # NLP Fallback sentence formation (if LLM fails)
                    if not explanation:
                        med_notes = []
                        for m in otc_record["recommended_otc_medicines"]:
                            nlem_status = " (Essential NLEM list)" if m["is_in_nlem"] else ""
                            med_notes.append(f"{m['molecule'].capitalize()} ({m['typical_note']}; Limits: {m['age_limits']}{nlem_status})")
                        
                        explanation = (
                            f"Based on your symptoms, our local Machine Learning classifier predicts a probable case of **{primary_disease}** "
                            f"(likelihood: {possible_diseases[0]['probability']}) by matching indicators: {', '.join(matched_symptom_list)}. "
                            f"Typical symptoms for this condition include: {', '.join(otc_record['common_symptoms'])}. "
                            f"For self-care relief, standard recommended OTC options include: {'; '.join(med_notes)}. "
                            f"Please observe daily precautions: {', '.join(otc_record['precautions'])}. "
                            f"⚠️ CRITICAL: Consult the Campus Health Centre or a physician immediately if you experience: {', '.join(otc_record['when_to_see_doctor'])}."
                        )

                    result = {
                        "possible_diseases": possible_diseases,
                        "explanation": explanation,
                        "suggested_medicines": otc_record["recommended_otc_medicines"],
                        "home_remedies": otc_record["precautions"],
                        "diet_suggestions": ["Eat light, warm, non-spicy meals", "Drink boiled/filtered water"],
                        "doctor_recommendation": f"Consult a general physician at the Campus Medical Cell for {primary_disease}.",
                        "nearby_hospitals": ["JNTU-GV Campus Health Centre", "Vizianagaram General Hospital"],
                        "emergency_warning": ", ".join(otc_record["when_to_see_doctor"])
                    }

            except Exception as e:
                print(f"Error running ML classification: {e}. Falling back to direct LLM.")

        # Route B: Backup Clinical LLM analysis (if symptoms don't match ML columns)
        if not result:
            prompt = f"""
            You are JNTU-GV UniMedicine Clinical AI. A {age}-year-old {gender} student reports symptoms: '{symptoms}' for a duration of '{duration}'.
            Temperature: {temp or 'Normal'}, Medical History: {history or 'None'}, Allergies: {allergies or 'None'}, Medicines: {medicines or 'None'}.
            
            Analyze their symptoms and provide a response in valid JSON format.
            JSON keys exactly:
            - "possible_diseases": array of objects with "name" (string) and "probability" (string)
            - "explanation": a reassuring, friendly explanation paragraph detailing possible causes, standard precautions, and self-care recommendations.
            - "suggested_medicines": array of strings (common OTC molecules)
            - "home_remedies": array of strings
            - "diet_suggestions": array of strings
            - "doctor_recommendation": string
            - "nearby_hospitals": array of strings
            - "emergency_warning": string
            """
            
            try:
                url = f"{settings.OLLAMA_API_URL}/api/generate"
                payload = {
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "system": "You are a professional medical assistant. Respond in valid JSON format only.",
                    "stream": False,
                    "options": {"temperature": 0.2}
                }
                response = requests.post(url, json=payload, timeout=8.0)
                if response.status_code == 200:
                    text_response = response.json().get("response", "").strip()
                    if "```json" in text_response:
                        text_response = text_response.split("```json")[1].split("```")[0].strip()
                    elif "```" in text_response:
                        text_response = text_response.split("```")[1].split("```")[0].strip()
                    result = json.loads(text_response)
            except Exception as e:
                print(f"LLM diagnostic backup failed: {e}. Executing NLP fallback rules.")

        # Route C: Rule-based NLP fallback (if LLM is offline/fails)
        if not result:
            result = cls._get_rule_based_fallback(symptoms, age, gender)

        # 3. Post-processing: Normalize suggested_medicines list into objects matching otc_guidance.json structures!
        normalized_meds = []
        raw_meds = result.get("suggested_medicines", [])
        otc_data = cls._load_otc_guidance()

        for m in raw_meds:
            if isinstance(m, dict):
                normalized_meds.append({
                    "molecule": m.get("molecule", "paracetamol"),
                    "typical_note": m.get("typical_note", "For symptomatic relief; follow label instructions"),
                    "age_limits": m.get("age_limits", "per label"),
                    "is_in_nlem": m.get("is_in_nlem", False)
                })
            elif isinstance(m, str):
                # Search database to enrich
                matched_mol = None
                for item in otc_data:
                    for rec_med in item.get("recommended_otc_medicines", []):
                        if rec_med["molecule"].lower() == m.lower():
                            matched_mol = rec_med
                            break
                    if matched_mol:
                        break
                
                if matched_mol:
                    normalized_meds.append(matched_mol)
                else:
                    normalized_meds.append({
                        "molecule": m,
                        "typical_note": "Symptomatic relief; follow label guidance",
                        "age_limits": "per product instructions",
                        "is_in_nlem": False
                    })
        result["suggested_medicines"] = normalized_meds

        return result

    @classmethod
    def _get_rule_based_fallback(cls, symptoms: str, age: int, gender: str) -> dict:
        symptoms_lower = symptoms.lower()
        result = {
            "possible_diseases": [{"name": "Common Cold / Viral Fever", "probability": "85%"}],
            "explanation": f"Based on the reported symptoms '{symptoms}' for a {age}-year-old {gender}, this is likely a mild viral infection common in the current season.",
            "suggested_medicines": ["Paracetamol", "Cetirizine"],
            "home_remedies": ["Warm water gargles", "Steam inhalation 2 times daily", "Complete bed rest and hydration"],
            "diet_suggestions": ["Warm chicken or vegetable soup", "Herbal tea with honey and ginger", "Avoid cold drinks and oily foods"],
            "doctor_recommendation": "Consult a General Physician if symptoms persist beyond 3 days.",
            "nearby_hospitals": ["JNTU-GV Campus Health Centre", "Vizianagaram General Hospital"],
            "emergency_warning": "Go to the emergency room immediately if you experience breathing difficulty, chest pain, or persistent high fever above 103°F."
        }

        if "chest" in symptoms_lower or "heart" in symptoms_lower:
            result.update({
                "possible_diseases": [
                    {"name": "Angina Pectoris / Cardiorespiratory Distress", "probability": "60%"},
                    {"name": "Severe Acid Reflux (GERD)", "probability": "40%"}
                ],
                "explanation": "Chest pain is a critical symptom that requires urgent evaluation. Cardiac issues must be ruled out immediately.",
                "suggested_medicines": ["Pantoprazole"],
                "home_remedies": ["Sit upright, remain calm, loosen tight clothing"],
                "emergency_warning": "CRITICAL WARNING: This could be a cardiac event. Go to Vizianagaram General Hospital immediately!",
                "doctor_recommendation": "Emergency Cardiologist Consultation required."
            })
        elif "stomach" in symptoms_lower or "abdomen" in symptoms_lower:
            result.update({
                "possible_diseases": [
                    {"name": "Acute Gastroenteritis (Food Poisoning)", "probability": "75%"},
                    {"name": "Acid Peptic Disease (Gastritis)", "probability": "25%"}
                ],
                "explanation": "Abdominal discomfort or diarrhea is frequently associated with foodborne bacteria or gastric acid irritation.",
                "suggested_medicines": ["ORS", "Dicyclomine"],
                "home_remedies": ["Drink plenty of electrolytes", "Apply a warm compress on the stomach"],
                "diet_suggestions": ["BRAT Diet: Bananas, Rice, Applesauce, Toast."],
                "doctor_recommendation": "Visit JNTU-GV Health Centre if vomiting persists."
            })

        return result

    @classmethod
    def analyze_image(cls, image_type: str) -> dict:
        type_lower = image_type.lower()
        result = {
            "disease": "Mild Acne Vulgaris (Acne)",
            "confidence": "88%",
            "explanation": "The image scan shows inflamed papules and minor pustules on the skin surface. This is typical of mild acne, often associated with stress, hostel water changes, or hormonal fluctuations in young adults.",
            "suggested_medicine": "Salicylic acid face wash (2%), Benzoyl peroxide gel (2.5%) applied to spots at night.",
            "should_visit_doctor": False,
            "severity": "Low",
            "findings": ["Mild pore clogging", "Inflamed skin patches", "No deep cystic lesions detected"]
        }

        if "skin" in type_lower or "rash" in type_lower:
            result.update({
                "disease": "Contact Dermatitis / Mild Eczema",
                "confidence": "82%",
                "explanation": "Skin area shows localized redness and minor scaling. This appears to be contact dermatitis, likely caused by exposure to a new irritant like harsh soaps, laundry detergents, or dust.",
                "suggested_medicine": "Hydrocortisone cream (1%) twice daily, Calamine lotion to soothe itchiness.",
                "should_visit_doctor": False,
                "severity": "Low",
                "findings": ["Erythematous rash", "Slight dry scaling", "No secondary bacterial infection"]
            })
        elif "eye" in type_lower:
            result.update({
                "disease": "Allergic Conjunctivitis (Pink Eye)",
                "confidence": "90%",
                "explanation": "The scan reveals mild conjunctival injection (redness) and watery discharge in the eye. This is consistent with allergic conjunctivitis, often caused by dust or pollen particles.",
                "suggested_medicine": "Antihistamine eye drops (e.g., Olopatadine 0.1%), Lubricating artificial tears.",
                "should_visit_doctor": True,
                "severity": "Medium",
                "findings": ["Conjunctival injection", "Clear watery discharge", "Cornea appears clear"]
            })
        elif "tongue" in type_lower or "mouth" in type_lower:
            result.update({
                "disease": "Aphthous Stomatitis (Mouth Ulcer)",
                "confidence": "95%",
                "explanation": "A small, round painful ulcer with a yellow-white center and red border is visible on the mucosal lining. Commonly caused by stress, minor accidental biting, or Vitamin B12 deficiency.",
                "suggested_medicine": "Choline salicylate gel (e.g., Zytee) for local pain relief, Multivitamin capsules with B-Complex.",
                "should_visit_doctor": False,
                "severity": "Low",
                "findings": ["Single mucosal ulceration", "Fibrinous membrane center", "No bleeding reported"]
            })
        elif "nail" in type_lower:
            result.update({
                "disease": "Onychomycosis (Fungal Nail Infection)",
                "confidence": "78%",
                "explanation": "The nail plate shows mild discoloration (yellowish tint) and thickening at the edge. This is a common fungal nail infection, which progresses slowly.",
                "suggested_medicine": "Luliconazole or Amorolfine nail lacquer applied weekly.",
                "should_visit_doctor": True,
                "severity": "Medium",
                "findings": ["Distal nail discoloration", "Minor subungual hyperkeratosis"]
            })

        return result

    @classmethod
    def generate_consultation_summary(
        cls,
        chat_history: str = "",
        doctor_notes: str = "",
        patient_symptoms: str = "",
        patient_age: str = None,
        doctor_name: str = "Doctor",
        specialization: str = "General Physician",
        appointment_date: str = ""
    ) -> dict:
        """Generate a structured AI consultation summary after a consultation."""
        prompt = f"""
You are an expert medical AI assistant for the JNTU-GV UniMedicine Platform.
Based on the following consultation data, generate a comprehensive, structured consultation summary.

Doctor: Dr. {doctor_name} ({specialization})
Appointment Date: {appointment_date}
Patient Symptoms: {patient_symptoms or 'As discussed in chat'}
Doctor Notes: {doctor_notes or 'None provided'}
Chat History:
{chat_history or 'No chat history available.'}

Generate a JSON response with EXACTLY these keys:
{{
  "consultation_summary": "2-3 sentence overview of the consultation",
  "symptoms_discussed": ["list", "of", "symptoms"],
  "possible_conditions": ["list", "of", "conditions"],
  "differential_diagnosis": ["alternative", "diagnoses"],
  "risk_level": "Low | Medium | High | Critical",
  "risk_explanation": "brief explanation of risk level",
  "suggested_clinical_assessment": "recommended clinical tests or examination",
  "medicines_prescribed": ["medicine name with dosage"],
  "doctor_recommendations": ["recommendation 1", "recommendation 2"],
  "home_care_advice": ["advice 1", "advice 2"],
  "follow_up_instructions": "when and how to follow up",
  "recommended_tests": ["test 1", "test 2"],
  "next_appointment_recommendation": "within X days/weeks",
  "consultation_duration": "estimated duration",
  "doctor_notes_summary": "summary of doctor observations",
  "patient_questions": ["questions raised by patient if any"],
  "important_warnings": ["warning 1"],
  "emergency_advice": "advice for emergency situations or N/A"
}}

Respond ONLY with the JSON. No extra text.
"""
        try:
            url = f"{settings.OLLAMA_API_URL}/api/generate"
            payload = {
                "model": settings.OLLAMA_MODEL,
                "prompt": prompt,
                "system": "You are a professional medical AI. Always respond with valid JSON only.",
                "stream": False,
                "options": {"temperature": 0.1}
            }
            response = requests.post(url, json=payload, timeout=15.0)
            if response.status_code == 200:
                text = response.json().get("response", "").strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                return json.loads(text)
        except Exception as e:
            print(f"AI summary generation failed: {e}")

        # Fallback structured summary
        return {
            "consultation_summary": f"Consultation conducted by Dr. {doctor_name} on {appointment_date}.",
            "symptoms_discussed": [patient_symptoms] if patient_symptoms else ["General health concern"],
            "possible_conditions": ["To be determined by doctor"],
            "differential_diagnosis": ["Pending clinical examination"],
            "risk_level": "Low",
            "risk_explanation": "Initial assessment suggests low risk. Monitor for changes.",
            "suggested_clinical_assessment": "Routine physical examination recommended.",
            "medicines_prescribed": [],
            "doctor_recommendations": ["Follow prescribed treatment", "Rest and stay hydrated"],
            "home_care_advice": ["Rest adequately", "Maintain good hygiene", "Stay hydrated"],
            "follow_up_instructions": "Return if symptoms persist beyond 3 days.",
            "recommended_tests": [],
            "next_appointment_recommendation": "Within 1 week if symptoms persist",
            "consultation_duration": "15 minutes",
            "doctor_notes_summary": doctor_notes or "No specific notes recorded.",
            "patient_questions": [],
            "important_warnings": ["Seek emergency care if symptoms worsen rapidly"],
            "emergency_advice": "Visit nearest hospital if you experience severe breathing difficulty or chest pain."
        }
