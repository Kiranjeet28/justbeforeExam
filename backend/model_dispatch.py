# model_dispatch.py
"""
Transformation layer for artifact generation using Hugging Face Inference APIs.
- MiniMaxAI/MiniMax-M2.5: Mind Map JSON (parses <think>...</think> block)
- Qwen/Qwen2.5-7B-Instruct: Cheat Sheet Markdown (LaTeX math)
"""
import requests
import os

HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/"
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

HEADERS = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

MINIMAX_MODEL = "MiniMaxAI/MiniMax-M2.5"
QWEN_MODEL = "Qwen/Qwen2.5-7B-Instruct"

def call_hf_model(model, prompt):
    url = HUGGINGFACE_API_URL + model
    response = requests.post(url, headers=HEADERS, json={"inputs": prompt})
    response.raise_for_status()
    return response.json()["generated_text"] if "generated_text" in response.json() else response.json()

def parse_minimax_response(response_text):
    # Extract content inside <think>...</think>
    import re
    match = re.search(r"<think>(.*?)</think>", response_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return response_text

def generateArtifacts(noteText):
    # Mind Map JSON
    minimax_prompt = (
        "Act as a software architect and decompose the following notes into a nested JSON tree for a mind map.\n" + noteText
    )
    minimax_raw = call_hf_model(MINIMAX_MODEL, minimax_prompt)
    mind_map_json = parse_minimax_response(minimax_raw)

    # Cheat Sheet Markdown
    qwen_prompt = (
        "Extract key formulas and definitions into a cheat sheet, ensuring all math uses LaTeX delimiters ($...$).\n" + noteText
    )
    cheat_sheet_md = call_hf_model(QWEN_MODEL, qwen_prompt)

    return {"mind_map_json": mind_map_json, "cheat_sheet_md": cheat_sheet_md}
