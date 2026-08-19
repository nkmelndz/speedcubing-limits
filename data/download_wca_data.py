#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de descarga y extracción automatizada de los datos públicos de la WCA.
Descarga 'WCA_export.tsv.zip' y extrae únicamente las tablas requeridas.
"""

import os
import zipfile
import urllib.request
import sys
from pathlib import Path

# URL oficial directa de exportación de la WCA
WCA_EXPORT_URL = "https://exports.worldcubeassociation.org/results/WCA_export_v2_229_20260817T000041Z.tsv.zip"

# Tablas estrictamente necesarias para el procesamiento (WCA export v2)
REQUIRED_FILES = [
    "WCA_export_competitions.tsv",
    "WCA_export_results.tsv",
]


def download_progress_hook(block_num, block_size, total_size):
    """Muestra una barra de progreso simple en consola."""
    downloaded = block_num * block_size
    if total_size > 0:
        percent = min(100.0, downloaded * 100.0 / total_size)
        mb_down = downloaded / (1024 * 1024)
        mb_total = total_size / (1024 * 1024)
        sys.stdout.write(f"\r[Descargando] {percent:5.1f}% ({mb_down:6.1f} MB / {mb_total:6.1f} MB)")
        sys.stdout.flush()


def main():
    # Directorio base
    base_dir = Path(__file__).resolve().parent
    raw_dir = base_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    zip_path = raw_dir / "WCA_export.tsv.zip"

    print(f"=== Pipeline WCA: Descarga de Datos ===")
    print(f"Destino: {raw_dir}")

    # 1. Descarga del archivo ZIP (si no existe)
    if zip_path.exists() and zip_path.stat().st_size > 1000000:
        print(f"\n1. Archivo ZIP ya encontrado en disco ({zip_path.stat().st_size / (1024*1024):.1f} MB). Omitiendo descarga...")
    else:
        print(f"\n1. Conectando con {WCA_EXPORT_URL} ...")
        try:
            opener = urllib.request.build_opener()
            opener.addheaders = [('User-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')]
            urllib.request.install_opener(opener)
            
            urllib.request.urlretrieve(WCA_EXPORT_URL, zip_path, reporthook=download_progress_hook)
            print("\nDescarga completada con exito.")
        except Exception as e:
            print(f"\n[Error] No se pudo descargar el archivo: {e}")
            return

    # 2. Extracción selectiva de tablas
    print(f"\n2. Extrayendo tablas esenciales en {raw_dir} ...")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            all_files = zip_ref.namelist()
            for filename in REQUIRED_FILES:
                matching = [f for f in all_files if f.endswith(filename)]
                if matching:
                    zip_ref.extract(matching[0], raw_dir)
                    print(f"  [OK] Extraido: {filename}")
                else:
                    print(f"  [!] Advertencia: {filename} no encontrado en el ZIP.")
        
        print("\nProceso finalizado correctamente!")
        print(f"Archivos listos en: {raw_dir}")
    except Exception as e:
        print(f"\n[Error] Fallo la extraccion del archivo ZIP: {e}")


if __name__ == "__main__":
    main()
