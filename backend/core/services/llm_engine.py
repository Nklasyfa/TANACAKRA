import os
import json
import urllib.request
import urllib.error
import logging

logger = logging.getLogger(__name__)

NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
DEFAULT_MODEL = "meta/llama-3.2-11b-vision-instruct"

def get_nvidia_api_key():
    return os.environ.get("NVIDIA_API_KEY", "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")

def call_nvidia_api(messages: list, max_tokens: int = 650, temperature: float = 0.7) -> str:
    """Call NVIDIA NIM API using Python built-in urllib (no external dependency)."""
    api_key = get_nvidia_api_key()
    if not api_key:
        raise ValueError("NVIDIA_API_KEY tidak dikonfigurasi.")

    payload = {
        "model": DEFAULT_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    req = urllib.request.Request(
        NVIDIA_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Tanacakra-Agronomy-Hub"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"].strip()
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8") if e.fp else str(e)
        logger.error(f"NVIDIA API HTTPError {e.code}: {err_content}")
        raise RuntimeError(f"NVIDIA API Error ({e.code}): {err_content}")
    except Exception as e:
        logger.error(f"NVIDIA API request failed: {e}")
        raise e

def generate_ai_warta(prompt: str) -> dict:
    system_prompt = """
Anda adalah asisten pakar agronomi TANACAKRA. Tugas Anda adalah membuat draf artikel berita pertanian (warta) singkat namun informatif berdasarkan prompt user.
SANGAT PENTING: Anda WAJIB menyesuaikan judul, ringkasan, dan metrik dengan komoditas/topik spesifik yang diminta oleh user di dalam prompt.
Fokus pada komoditas utama (Cabai, Padi, Jagung, Bawang Merah, Salak, Tomat) dan kondisi lereng Merapi Cangkringan (tanah vulkanik, cuaca presisi, hama).

Output Anda harus HARUS valid JSON dengan format persis seperti ini:
{
  "category": "hama" | "cuaca" | "pasar" | "lahan" | "prediksi",
  "title": "Judul Artikel Menarik (maks 80 karakter)",
  "summary": "Ringkasan / isi artikel yang informatif 3-4 kalimat.",
  "metrics": {
    "Metrik 1": "Nilai",
    "Metrik 2": "Nilai"
  },
  "severity": "info" | "warning" | "danger",
  "source": "Rekomendasi AI Agronomi Tanacakra (NVIDIA)",
  "cta_url": "/kabar-tani"
}
Jangan berikan penjelasan apapun selain JSON murni.
"""
    try:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        content = call_nvidia_api(messages, max_tokens=1000, temperature=0.7)

        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        return json.loads(content.strip())
    except Exception as e:
        logger.error(f"Error generate_ai_warta: {e}")
        return None

def generate_ai_chat_response(messages: list) -> str:
    """Generate interactive chat response from NVIDIA LLM for Tanacakra CakraBot."""
    system_prompt = (
        "Anda adalah CakraBot (Cakra AI), asisten kecerdasan buatan resmi agronomi presisi TANACAKRA "
        "untuk para petani dan penyuluh di lereng Gunung Merapi (Kapanewon Cangkringan, Kabupaten Sleman, D.I. Yogyakarta).\n"
        "Karakter Anda:\n"
        "- Ramah, sopan, menghargai petani, bersahabat, dan solutif.\n"
        "- Berikan jawaban praktis, aplikatif di lahan, dan akurat secara agronomi.\n"
        "- Berakar pada ekosistem lokal Merapi: tanah regosol vulkanik berpasir (drainase cepat, butuh pupuk organik/bokashi), "
        "ketinggian 400-900 mdpl, cuaca sejuk-lembab, komoditas unggulan (Cabai Merah, Padi, Jagung, Tomat, Bawang Merah, Salak Pondoh).\n"
        "- Jika pengguna hanya menyapa (seperti 'hai', 'halo', 'assalamualaikum', 'pagi'), balas sapaannya dengan hangat dan tanyakan kendala atau apa yang bisa dibantu hari ini.\n"
        "- Gunakan Bahasa Indonesia yang mengalir alami dan terstruktur."
    )

    formatted_messages = [{"role": "system", "content": system_prompt}]
    for m in messages:
        formatted_messages.append({
            "role": m.get("role", "user"),
            "content": m.get("content", m.get("text", ""))
        })

    return call_nvidia_api(formatted_messages, max_tokens=650, temperature=0.7)
