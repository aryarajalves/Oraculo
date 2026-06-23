#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
imgbb_uploader.py — Upload de imagens para ImgBB (URL pública garantida)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Faz upload de slides JPEG para o ImgBB e retorna URLs públicas diretas.
Usado pelo instagram_publisher.py para hospedar imagens antes de publicar.
"""

import os, sys, base64, io, requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

IMGBB_API_KEY = os.getenv("IMGBB_API_KEY")
IMGBB_ENDPOINT = "https://api.imgbb.com/1/upload"


def _to_jpeg_bytes(path: Path) -> bytes:
    """Lê a imagem e retorna bytes JPEG (converte PNG se necessário)."""
    if path.suffix.lower() in (".jpg", ".jpeg"):
        return path.read_bytes()
    # PNG → JPEG via Pillow
    try:
        from PIL import Image
        buf = io.BytesIO()
        with Image.open(path) as img:
            img.convert("RGB").save(buf, format="JPEG", quality=95)
        return buf.getvalue()
    except ImportError:
        # Pillow não instalado — envia o PNG direto (ImgBB aceita PNG)
        return path.read_bytes()


def upload_image(path: Path | str) -> str:
    if not IMGBB_API_KEY:
        raise ValueError("IMGBB_API_KEY nao encontrado no .env")

    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Arquivo nao encontrado: {path}")

    img_bytes = _to_jpeg_bytes(path)
    img_b64   = base64.b64encode(img_bytes).decode()

    r = requests.post(
        IMGBB_ENDPOINT,
        data={"key": IMGBB_API_KEY, "image": img_b64},
        timeout=60,
    )
    data = r.json()

    if not data.get("success"):
        raise RuntimeError(f"ImgBB upload falhou: {data}")

    return data["data"]["url"]


def upload_slides(slides_dir: Path | str) -> list[str]:
    slides_dir = Path(slides_dir)
    slides = sorted({
        f for ext in ("jpg", "jpeg", "png")
        for f in slides_dir.glob(f"slide-*.{ext}")
    }, key=lambda f: f.name)

    if not slides:
        raise FileNotFoundError(f"Nenhum slide encontrado em: {slides_dir}")

    urls = []
    print(f"\n  Enviando {len(slides)} slides para ImgBB...")
    for slide in slides:
        print(f"     {slide.name}...", end=" ", flush=True)
        url = upload_image(slide)
        print(f"OK")
        urls.append(url)

    print(f"  Upload completo.\n")
    return urls
