import os
import json
from openai import OpenAI
from django.conf import settings

def get_llm_client():
    # Use environment variable from .env
    api_key = os.environ.get("NVIDIA_API_KEY")
    
    return OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key
    )

def generate_ai_warta(prompt: str) -> dict:
    client = get_llm_client()
    
    system_prompt = """
Anda adalah asisten pakar agronomi TANACAKRA. Tugas Anda adalah membuat draf artikel berita pertanian (warta) singkat namun informatif berdasarkan prompt user.
Fokus pada komoditas utama (Cabai, Padi, Jagung, Bawang Merah, Salak, Tomat) dan kondisi lereng Merapi Cangkringan (tanah vulkanik, cuaca presisi, hama).

Output Anda harus HARUS valid JSON dengan format persis seperti ini (jangan tambahkan markdown ```json):
{
  "category": "hama" | "cuaca" | "pasar" | "lahan" | "prediksi",
  "title": "Judul Artikel Menarik (maks 80 karakter)",
  "summary": "Ringkasan / isi artikel yang informatif, menjelaskan kronologi, dampak, dan rekomendasi bagi petani. Panjang sekitar 3-4 kalimat layaknya artikel.",
  "metrics": {
    "Metrik 1": "Nilai",
    "Metrik 2": "Nilai"
  },
  "severity": "info" | "warning" | "danger",
  "source": "Rekomendasi AI Agronomi Tanacakra (NVIDIA)",
  "cta_url": "/kabar-tani"
}
Pastikan `metrics` berisi maksimal 4 pasang key-value penting terkait peringatan tersebut.
Jangan memberikan penjelasan apapun selain JSON murni.
"""
    
    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        
        content = response.choices[0].message.content
        
        # parse json robustly
        try:
            # handle if the model outputs markdown json block
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
                
            data = json.loads(content.strip())
            return data
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from LLM: {e}\nContent was: {content}")
            return None
            
    except Exception as e:
        print(f"Error calling LLM API: {e}")
        return None
