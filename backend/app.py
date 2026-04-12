import time
import uuid
import os
import json
import base64
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if GROQ_API_KEY:
    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)

def google_vision_ocr(image_base64):
    """Performs OCR using Google Vision API via REST."""
    if not GOOGLE_API_KEY:
        return "GOOGLE API KEY MISSING. PLEASE CONFIGURE IN .ENV"
    
    url = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_API_KEY}"
    payload = {
        "requests": [
            {
                "image": {"content": image_base64},
                "features": [{"type": "DOCUMENT_TEXT_DETECTION"}]
            }
        ]
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        res_data = response.json()
        text_annotations = res_data.get('responses', [{}])[0].get('fullTextAnnotation', {}).get('text', "")
        return text_annotations
    except Exception as e:
        print(f"Vision API Error: {e}")
        return ""

def groq_extract(ocr_text):
    """Parses OCR text into structured medical JSON using Groq LLaMA 3.1."""
    if not GROQ_API_KEY or not ocr_text:
        return None
    
    prompt = f"""
    Extract medicines from the following prescription text and return ONLY a valid JSON.
    Context: Handwriting might be messy or fragmented. Correct spellings if they look like common medicines.
    
    Structure: {{"medicines": [{{"name": "", "dosage": "", "frequency": "", "duration": "", "purpose": "", "warnings": "", "interaction_flag": false, "interaction_note": ""}}]}}
    Prescription Text: {ocr_text}
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a medical assistant that outputs high-accuracy JSON for prescription parsing."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"Groq Extraction Error: {e}")
        return None

def google_translate(text_list, target_lang):
    """Translates a list of strings using Google Translate API REST."""
    if not GOOGLE_API_KEY:
        return text_list # Return original if no key
    
    url = f"https://translation.googleapis.com/language/translate/v2?key={GOOGLE_API_KEY}"
    payload = {
        "q": text_list,
        "target": target_lang
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        res_data = response.json()
        translations = [t['translatedText'] for t in res_data.get('data', {}).get('translations', [])]
        return translations
    except Exception as e:
        print(f"Translation API Error: {e}")
        return text_list

def check_interactions_fda(medicines):
    """Hybrid OpenFDA interaction checker."""
    for med in medicines:
        med_name = med.get('name', '')
        try:
            url = f"https://api.fda.gov/drug/label.json?search=openfda.generic_name:\"{med_name}\"&limit=1"
            response = requests.get(url, timeout=3)
            if response.status_code == 200:
                data = response.json()
                if 'results' in data and 'drug_interactions' in data['results'][0]:
                    med['interaction_flag'] = True
                    med['interaction_note'] = data['results'][0]['drug_interactions'][0][:150] + "..."
        except:
            pass
    return medicines

@app.route('/api/scan', methods=['POST'])
def scan_prescription():
    """Real end-to-end OCR and LLM pipeline."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    image_file = request.files['image']
    image_content = base64.b64encode(image_file.read()).decode('utf-8')
    
    # 1. OCR
    ocr_text = google_vision_ocr(image_content)
    print(f"OCR Result: {ocr_text}")
    
    # 2. Extract
    parsed_data = groq_extract(ocr_text) or {"medicines": []}
    
    # Safety logic for interactions
    medicines = parsed_data.get('medicines', [])
    if medicines:
        parsed_data['medicines'] = check_interactions_fda(medicines)
    
    return jsonify({
        "id": str(uuid.uuid4()),
        "status": "success",
        "medicines": parsed_data.get('medicines', []),
        "ocr_raw": ocr_text,
        "general_advice": "Consult your doctor for specific queries."
    }), 200

@app.route('/api/translate', methods=['POST'])
def translate_guide():
    data = request.json
    target_lang = data.get('target_language', 'hi')
    medicines = data.get('medicines', [])
    
    if not medicines:
        return jsonify({"error": "No medicines to translate"}), 400

    # Extract strings to translate
    to_translate = []
    for med in medicines:
        to_translate.extend([
            med['name'], med['dosage'], med['frequency'], 
            med['duration'], med['purpose'], med['warnings'], 
            med.get('interaction_note', "")
        ])
    
    translated_texts = google_translate(to_translate, target_lang)
    
    # Map back
    idx = 0
    new_medicines = []
    for med in medicines:
        new_med = med.copy()
        new_med['name'] = translated_texts[idx]
        new_med['dosage'] = translated_texts[idx+1]
        new_med['frequency'] = translated_texts[idx+2]
        new_med['duration'] = translated_texts[idx+3]
        new_med['purpose'] = translated_texts[idx+4]
        new_med['warnings'] = translated_texts[idx+5]
        new_med['interaction_note'] = translated_texts[idx+6]
        new_medicines.append(new_med)
        idx += 7
        
    return jsonify({"translated_medicines": new_medicines})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
