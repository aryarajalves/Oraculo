#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
b2_uploader.py — Upload de imagens para Backblaze B2 (URL pública)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Faz upload de slides JPEG para o bucket público do Backblaze B2
e retorna URLs públicas — necessárias para publicação via Meta API.

Uso:
    from b2_uploader import upload_image, upload_slides

    url  = upload_image(Path("slide-01.jpg"))
    urls = upload_slides(Path("C:/Users/julia/Desktop/carrossel-x"))
"""

import os
import sys
import uuid
import boto3
from pathlib import Path
from dotenv import load_dotenv
from botocore.client import Config

# Fix Windows terminal encoding
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

load_dotenv()

B2_KEY_ID          = os.getenv("B2_KEY_ID")
B2_APPLICATION_KEY = os.getenv("B2_APPLICATION_KEY")
B2_BUCKET_NAME     = os.getenv("B2_BUCKET_NAME")
B2_ENDPOINT        = os.getenv("B2_ENDPOINT")  # ex: s3.us-east-005.backblazeb2.com


def _client():
    """Cria cliente boto3 apontando para o Backblaze B2."""
    return boto3.client(
        "s3",
        endpoint_url        = f"https://{B2_ENDPOINT}",
        aws_access_key_id   = B2_KEY_ID,
        aws_secret_access_key = B2_APPLICATION_KEY,
        config              = Config(signature_version="s3v4"),
    )


def upload_image(path: Path | str, key: str = None) -> str:
    """
    Faz upload de uma imagem para o Backblaze B2.

    Args:
        path: Caminho local do arquivo (JPEG).
        key:  Nome do arquivo no bucket. Se None, usa o nome original
              prefixado com um UUID curto para evitar colisões.

    Returns:
        URL pública da imagem (ex: https://Publicacoes.s3.us-east-005.backblazeb2.com/abc123-slide-01.jpg)
    """
    if not all([B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME, B2_ENDPOINT]):
        raise ValueError(
            "Credenciais Backblaze não encontradas no .env. "
            "Verifique: B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME, B2_ENDPOINT"
        )

    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {path}")

    if key is None:
        prefix = uuid.uuid4().hex[:8]
        key    = f"{prefix}-{path.name}"

    client = _client()
    with open(path, "rb") as f:
        client.put_object(
            Bucket      = B2_BUCKET_NAME,
            Key         = key,
            Body        = f,
            ContentType = "image/jpeg",
        )

    # Formato nativo Backblaze (download URL pública garantida)
    # us-east-005 → cluster f005
    cluster = B2_ENDPOINT.split(".")[1]  # ex: "us-east-005" → prefixo "f005"
    cluster_id = "f" + cluster.split("-")[-1]  # "005"
    import urllib.parse
    safe_key = urllib.parse.quote(key)
    url = f"https://{cluster_id}.backblazeb2.com/file/{B2_BUCKET_NAME}/{safe_key}"
    return url


def upload_slides(slides_dir: Path | str, prefix: str = None) -> list[str]:
    """
    Faz upload de todos os slides de um diretório em ordem.

    Args:
        slides_dir: Diretório contendo slide-01.jpg, slide-02.jpg, etc.
        prefix:     Prefixo único para agrupar os slides no bucket.
                    Se None, gera automaticamente.

    Returns:
        Lista de URLs públicas na ordem correta (slide-01 a slide-10).
    """
    slides_dir = Path(slides_dir)
    slides     = sorted(slides_dir.glob("slide-*.jpg"))

    if not slides:
        raise FileNotFoundError(f"Nenhum slide encontrado em: {slides_dir}")

    if prefix is None:
        prefix = uuid.uuid4().hex[:8]

    urls = []
    print(f"\n  📤 Enviando {len(slides)} slides para Backblaze B2...")
    for slide in slides:
        key = f"{prefix}/{slide.name}"
        print(f"     {slide.name}...", end=" ", flush=True)
        url = upload_image(slide, key=key)
        print(f"✅")
        urls.append(url)

    print(f"  ✅ Upload completo — prefixo: {prefix}\n")
    return urls


# ── TESTE RÁPIDO ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Uso: python b2_uploader.py <imagem_ou_pasta>")
        sys.exit(1)

    target = Path(sys.argv[1])

    if target.is_dir():
        urls = upload_slides(target)
        print("URLs geradas:")
        for i, u in enumerate(urls, 1):
            print(f"  S{i:02d}: {u}")
    else:
        url = upload_image(target)
        print(f"✅ URL pública: {url}")
