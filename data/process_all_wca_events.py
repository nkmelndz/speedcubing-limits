#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pipeline integral de procesamiento de datos WCA para las 17 categorías oficiales.
Decodifica eventos estándar de tiempo, FMC (movimientos) y Multi-Blind (cubos resueltos/puntos).
Genera los datasets Stan (.json) y el historial limpio (.csv).
"""

import csv
import json
import os
from pathlib import Path
from collections import defaultdict
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent
RAW_DIR = BASE_DIR / "raw"
PROCESSED_DIR = BASE_DIR / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# Las 17 categorías oficiales completas de la WCA
ALL_17_EVENTS = [
    {"id": "333", "name": "3x3x3 Cube", "unit": "s", "has_avg": True},
    {"id": "222", "name": "2x2x2 Cube", "unit": "s", "has_avg": True},
    {"id": "444", "name": "4x4x4 Cube", "unit": "s", "has_avg": True},
    {"id": "555", "name": "5x5x5 Cube", "unit": "s", "has_avg": True},
    {"id": "666", "name": "6x6x6 Cube", "unit": "s", "has_avg": True},
    {"id": "777", "name": "7x7x7 Cube", "unit": "s", "has_avg": True},
    {"id": "333bf", "name": "3x3x3 Blindfolded", "unit": "s", "has_avg": True},
    {"id": "333oh", "name": "3x3x3 One-Handed", "unit": "s", "has_avg": True},
    {"id": "333fm", "name": "3x3x3 Fewest Moves", "unit": "movs", "has_avg": True},
    {"id": "minx", "name": "Megaminx", "unit": "s", "has_avg": True},
    {"id": "pyram", "name": "Pyraminx", "unit": "s", "has_avg": True},
    {"id": "skewb", "name": "Skewb", "unit": "s", "has_avg": True},
    {"id": "sq1", "name": "Square-1", "unit": "s", "has_avg": True},
    {"id": "clock", "name": "Rubik's Clock", "unit": "s", "has_avg": True},
    {"id": "444bf", "name": "4x4x4 Blindfolded", "unit": "s", "has_avg": True},
    {"id": "555bf", "name": "5x5x5 Blindfolded", "unit": "s", "has_avg": True},
    {"id": "333mbf", "name": "3x3x3 Multi-Blind", "unit": "pts", "has_avg": False},
]


def decode_mbf(raw_val):
    """
    Decodifica el formato de Multi-Blind de la WCA: 0DDTTTTTMM
    Retorna los puntos netos resueltos (mayor es mejor).
    """
    if raw_val <= 0:
        return 0
    s = str(raw_val).zfill(9)
    diff = 99 - int(s[0:2])  # Puntos netos (resueltos - fallados)
    return diff


def load_competitions_dates():
    print("1. Cargando fechas de torneos...")
    comp_file = RAW_DIR / "WCA_export_competitions.tsv"
    comp_dates = {}
    
    with open(comp_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            cid = row["id"]
            try:
                y = int(row["year"])
                m = int(row["month"])
                d = int(row["day"])
                comp_dates[cid] = (datetime(y, m, d), y)
            except Exception:
                try:
                    y = int(row["year"])
                    comp_dates[cid] = (datetime(y, 1, 1), y)
                except Exception:
                    comp_dates[cid] = (datetime(1982, 1, 1), 1982)
                    
    print(f"   Total de torneos indexados: {len(comp_dates)}")
    return comp_dates


def process_world_records(comp_dates):
    print("\n2. Filtrando récords mundiales (WR) de las 17 categorías...")
    results_file = RAW_DIR / "WCA_export_results.tsv"
    
    records_single = []
    records_average = []
    
    with open(results_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            event_id = row["event_id"]
            person_id = row["person_id"]
            person_name = row["person_name"]
            cid = row["competition_id"]
            rsr = row["regional_single_record"]
            rar = row["regional_average_record"]
            
            dt, year = comp_dates.get(cid, (datetime(1982, 1, 1), 1982))
            
            # Single WR
            if rsr == "WR":
                best_val = int(row["best"])
                if best_val > 0:
                    if event_id == "333mbf":
                        pts = decode_mbf(best_val)
                        sec_or_val = pts
                    elif event_id == "333fm":
                        sec_or_val = float(best_val)  # Movimientos
                    else:
                        sec_or_val = best_val / 100.0  # Segundos
                        
                    records_single.append({
                        "event_id": event_id,
                        "type": "single",
                        "person_id": person_id,
                        "person_name": person_name,
                        "competition_id": cid,
                        "date": dt.strftime("%Y-%m-%d"),
                        "year": year,
                        "time_sec": sec_or_val,
                        "raw_value": best_val
                    })
                    
            # Average WR
            if rar == "WR":
                avg_val = int(row["average"])
                if avg_val > 0:
                    if event_id == "333fm":
                        sec_or_val = avg_val / 100.0  # Media de movimientos
                    else:
                        sec_or_val = avg_val / 100.0
                        
                    records_average.append({
                        "event_id": event_id,
                        "type": "average",
                        "person_id": person_id,
                        "person_name": person_name,
                        "competition_id": cid,
                        "date": dt.strftime("%Y-%m-%d"),
                        "year": year,
                        "time_sec": sec_or_val,
                        "raw_value": avg_val
                    })
                    
    # Filtrar mejoras estrictas
    def filter_true_progression(record_list):
        by_event = defaultdict(list)
        for r in record_list:
            by_event[r["event_id"]].append(r)
            
        cleaned = []
        for event, recs in by_event.items():
            recs.sort(key=lambda x: (x["date"], x["time_sec"]))
            if event == "333mbf":
                # En Multi-Blind mayor puntuación es mejor
                current_best = -1
                for r in recs:
                    if r["time_sec"] > current_best:
                        current_best = r["time_sec"]
                        cleaned.append(r)
            else:
                # En todos los demás menor tiempo/movimientos es mejor
                current_best = float("inf")
                for r in recs:
                    if r["time_sec"] < current_best:
                        current_best = r["time_sec"]
                        cleaned.append(r)
        return cleaned

    clean_single = filter_true_progression(records_single)
    clean_average = filter_true_progression(records_average)
    
    all_records = clean_single + clean_average
    all_records.sort(key=lambda x: (x["event_id"], x["type"], x["date"]))
    
    out_csv = PROCESSED_DIR / "wca_world_records_progression.csv"
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["event_id", "type", "date", "year", "time_sec", "person_name", "person_id", "competition_id", "raw_value"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_records)
        
    print(f"   [OK] Progresión guardada: {out_csv} ({len(all_records)} récords limpios)")
    return clean_single, clean_average


def build_stan_dataset_for_event(records, event_id="333", rec_type="single"):
    event_recs = [r for r in records if r["event_id"] == event_id and r["type"] == rec_type]
    if not event_recs:
        return None
        
    event_recs.sort(key=lambda x: (x["date"], x["time_sec"]))
    # La era oficial moderna de la WCA comenzó en el World Championship 2003 (WC2003).
    # Filtramos para que todas las series comiencen desde 2003 (o el primer año oficial de la categoría).
    wca_event_recs = [r for r in event_recs if r["year"] >= 2003]
    if not wca_event_recs:
        wca_event_recs = event_recs
        
    first_year = min(r["year"] for r in wca_event_recs)
    current_year = datetime.now().year
    years = list(range(first_year, current_year + 1))
    event_recs = wca_event_recs
    
    yearly_records = []
    current_wr_val = event_recs[0]["time_sec"]
    recs_by_year = defaultdict(list)
    for r in event_recs:
        recs_by_year[r["year"]].append(r)
        
    for y in years:
        if y in recs_by_year:
            if event_id == "333mbf":
                best_r = max(recs_by_year[y], key=lambda x: x["time_sec"])
            else:
                best_r = min(recs_by_year[y], key=lambda x: x["time_sec"])
            current_wr_val = best_r["time_sec"]
            
        yearly_records.append(current_wr_val)
        
    stan_data = {
        "years": years,
        "records": yearly_records
    }
    
    out_json = PROCESSED_DIR / f"stan_data_{event_id}_{rec_type}.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(stan_data, f, indent=2)
        
    print(f"   [OK] Dataset: {out_json.name} ({len(years)} años)")
    return stan_data


def main():
    print("=== Pipeline WCA: Extracción de las 17 Categorías ===")
    comp_dates = load_competitions_dates()
    clean_single, clean_average = process_world_records(comp_dates)
    
    print("\n3. Generando datasets Stan para las 17 categorías oficiales...")
    for ev in ALL_17_EVENTS:
        ev_id = ev["id"]
        build_stan_dataset_for_event(clean_single, event_id=ev_id, rec_type="single")
        if ev["has_avg"]:
            build_stan_dataset_for_event(clean_average, event_id=ev_id, rec_type="average")
            
    print("\n¡Pipeline de las 17 categorías completado con éxito!")


if __name__ == "__main__":
    main()
