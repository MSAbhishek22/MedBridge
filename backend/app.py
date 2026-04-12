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

client = None
if GROQ_API_KEY:
    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)

def groq_vision_ocr_and_extract(image_base64):
    """
    Uses Groq's LLaMA vision model to both OCR the prescription image
    AND extract structured medicine data in a single call.
    This replaces the separate Google Vision OCR + text extraction steps.
    """
    if not client:
        print("ERROR: Groq client not initialized. Check GROQ_API_KEY.")
        return None, ""

    prompt = """You are a medical prescription reader. Analyze this prescription image carefully.

1. First, read ALL text visible in the image (OCR).
2. Then extract every medicine mentioned.

Return ONLY valid JSON in this exact structure:
{
  "ocr_raw": "full text you can read from the image",
  "medicines": [
    {
      "name": "Medicine Name",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. Twice daily",
      "duration": "e.g. 7 days",
      "purpose": "Brief description of what this medicine is for",
      "warnings": "Key side effects or precautions",
      "interaction_flag": false,
      "interaction_note": ""
    }
  ]
}

If handwriting is messy, use your medical knowledge to infer the most likely medicine name.
If you cannot determine a field, use "Not specified" instead of leaving it empty.
You MUST return at least the medicines you can identify, even if details are partial."""

    try:
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            temperature=0.1,
            max_tokens=4096,
            response_format={"type": "json_object"}
        )
        
        raw_content = completion.choices[0].message.content
        print(f"Groq Vision Response: {raw_content[:500]}")
        
        parsed = json.loads(raw_content)
        ocr_text = parsed.get("ocr_raw", "")
        medicines = parsed.get("medicines", [])
        
        # Ensure all required fields exist
        for med in medicines:
            med.setdefault("name", "Unknown")
            med.setdefault("dosage", "Not specified")
            med.setdefault("frequency", "Not specified")
            med.setdefault("duration", "Not specified")
            med.setdefault("purpose", "Not specified")
            med.setdefault("warnings", "Consult doctor")
            med.setdefault("interaction_flag", False)
            med.setdefault("interaction_note", "")
        
        return {"medicines": medicines}, ocr_text
        
    except Exception as e:
        print(f"Groq Vision Error: {e}")
        import traceback
        traceback.print_exc()
        return None, ""


def groq_extract_from_text(ocr_text):
    """Fallback: extract medicines from plain text using Groq text model."""
    if not client or not ocr_text:
        return None
    
    prompt = f"""Extract medicines from this prescription text. Return ONLY valid JSON.
Fix any spelling errors using medical knowledge.

Structure: {{"medicines": [{{"name": "", "dosage": "", "frequency": "", "duration": "", "purpose": "", "warnings": "", "interaction_flag": false, "interaction_note": ""}}]}}

Prescription Text: {ocr_text}"""
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a medical assistant that outputs accurate JSON for prescription parsing."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"Groq Text Extraction Error: {e}")
        return None


def google_translate(text_list, target_lang):
    """Translates a list of strings using Google Translate API REST."""
    if not GOOGLE_API_KEY or not text_list:
        return text_list
    
    # Filter out empty strings
    text_list = [t if t else " " for t in text_list]
    
    url = f"https://translation.googleapis.com/language/translate/v2?key={GOOGLE_API_KEY}"
    payload = {
        "q": text_list,
        "target": target_lang
    }
    try:
        response = requests.post(url, json=payload, timeout=15)
        res_data = response.json()
        
        if 'error' in res_data:
            print(f"Translate API Error: {res_data['error']}")
            return text_list
            
        translations = [t['translatedText'] for t in res_data.get('data', {}).get('translations', [])]
        return translations if len(translations) == len(text_list) else text_list
    except Exception as e:
        print(f"Translation API Error: {e}")
        return text_list


def check_interactions_fda(medicines):
    """Check FDA for drug interactions."""
    for med in medicines:
        med_name = med.get('name', '').strip()
        if not med_name or med_name == "Unknown":
            continue
        try:
            url = f'https://api.fda.gov/drug/label.json?search=openfda.generic_name:"{med_name}"&limit=1'
            response = requests.get(url, timeout=3)
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                if results and 'drug_interactions' in results[0]:
                    med['interaction_flag'] = True
                    interaction_text = results[0]['drug_interactions'][0]
                    med['interaction_note'] = interaction_text[:200] + "..."
        except Exception:
            pass
    return medicines


@app.route('/api/scan', methods=['POST'])
def scan_prescription():
    """End-to-end prescription scanning pipeline using Groq Vision."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    image_file = request.files['image']
    image_bytes = image_file.read()
    
    if len(image_bytes) == 0:
        return jsonify({'error': 'Empty image file'}), 400
    
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    print(f"Received image: {image_file.filename}, size: {len(image_bytes)} bytes")
    
    # Use Groq Vision for combined OCR + extraction
    parsed_data, ocr_text = groq_vision_ocr_and_extract(image_base64)
    
    if not parsed_data or not parsed_data.get('medicines'):
        print("Vision model returned no medicines. Returning error.")
        return jsonify({
            "id": str(uuid.uuid4()),
            "status": "error",
            "medicines": [],
            "ocr_raw": ocr_text,
            "error": "Could not extract medicines from this image. Please try a clearer photo.",
            "general_advice": "Try uploading a clearer, well-lit photo of the prescription."
        }), 200
    
    # Check FDA interactions
    medicines = parsed_data.get('medicines', [])
    medicines = check_interactions_fda(medicines)
    
    print(f"Successfully extracted {len(medicines)} medicines")
    
    return jsonify({
        "id": str(uuid.uuid4()),
        "status": "success",
        "medicines": medicines,
        "ocr_raw": ocr_text,
        "general_advice": "Consult your doctor for specific queries."
    }), 200


@app.route('/api/translate', methods=['POST'])
def translate_guide():
    """Translate medicine details to target language."""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    target_lang = data.get('target_language', 'hi')
    medicines = data.get('medicines', [])
    
    if not medicines:
        return jsonify({"error": "No medicines to translate"}), 400

    # Collect all translatable strings
    to_translate = []
    for med in medicines:
        to_translate.extend([
            med.get('name', ''),
            med.get('dosage', ''),
            med.get('frequency', ''),
            med.get('duration', ''),
            med.get('purpose', ''),
            med.get('warnings', ''),
            med.get('interaction_note', '')
        ])
    
    translated_texts = google_translate(to_translate, target_lang)
    
    # Map translated texts back to medicines
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


@app.route('/api/health', methods=['GET'])
def health_check():
    """Quick health check endpoint."""
    return jsonify({
        "status": "ok",
        "groq_ready": client is not None,
        "google_translate_ready": bool(GOOGLE_API_KEY)
    })


if __name__ == '__main__':
    print("=" * 50)
    print("MedBridge Backend Starting...")
    print(f"  Groq API: {'[OK] Ready' if client else '[X] Missing GROQ_API_KEY'}")
    print(f"  Google Translate: {'[OK] Ready' if GOOGLE_API_KEY else '[X] Missing GOOGLE_API_KEY'}")
    print("=" * 50)
    app.run(debug=True, port=5000)
