# Reporte Estadístico: Límites Humanos Derivados con EVT y Procesos Gaussianos

**Fecha de generación:** 2026-08-18 13:49
**Categorías analizadas:** 17 eventos (Single y Average)

---

## Tabla Resumen de Límites Estadísticos

| Categoría | Récord Actual | Límite Estadístico (95% CI) | Año Estimado del Límite | Saturación (%) |
|---|---|---|---|---|
| 3x3x3 Cube (Single) | 2.76s | 2.37s [2.13-2.64] | ~2036 | 97.3% |
| 3x3x3 Cube (Average) | 3.51s | 3.19s [2.95-3.45] | ~2038 | 98.1% |
| 2x2x2 Cube (Single) | 0.39s | 0.34s [0.3-0.37] | ~2038 | 99.3% |
| 2x2x2 Cube (Average) | 0.86s | 0.79s [0.73-0.86] | ~2038 | 99.3% |
| 4x4x4 Cube (Single) | 15.18s | 13.05s [11.72-14.54] | ~2036 | 96.8% |
| 4x4x4 Cube (Average) | 18.56s | 17.08s [15.79-18.47] | ~2036 | 98.0% |
| 5x5x5 Cube (Single) | 29.49s | 25.36s [22.77-28.25] | ~2036 | 96.4% |
| 5x5x5 Cube (Average) | 33.73s | 31.03s [28.69-33.56] | ~2038 | 98.1% |
| 6x6x6 Cube (Single) | 57.69s | 47.89s [42.99-53.34] | ~2034 | 88.8% |
| 6x6x6 Cube (Average) | 64.94s | 59.74s [55.24-64.62] | ~2035 | 94.4% |
| 7x7x7 Cube (Single) | 90.59s | 77.91s [69.95-86.78] | ~2035 | 91.3% |
| 7x7x7 Cube (Average) | 96.86s | 89.11s [82.39-96.38] | ~2035 | 94.8% |
| 3x3x3 Blindfolded (Single) | 11.56s | 9.94s [8.93-11.07] | ~2038 | 99.3% |
| 3x3x3 Blindfolded (Average) | 14.05s | 12.93s [11.95-13.98] | ~2038 | 99.1% |
| 3x3x3 One-Handed (Single) | 5.66s | 4.87s [4.37-5.42] | ~2038 | 98.0% |
| 3x3x3 One-Handed (Average) | 6.99s | 6.43s [5.95-6.96] | ~2038 | 98.3% |
| 3x3x3 Fewest Moves (Single) | 16.0movs | 12.88movs [11.56-14.35] | ~2034 | 80.6% |
| 3x3x3 Fewest Moves (Average) | 19.0movs | 16.72movs [15.46-18.08] | ~2035 | 90.5% |
| Megaminx (Single) | 21.04s | 18.09s [16.25-20.15] | ~2036 | 97.4% |
| Megaminx (Average) | 24.38s | 21.91s [20.26-23.7] | ~2036 | 96.3% |
| Pyraminx (Single) | 0.73s | 0.63s [0.56-0.7] | ~2038 | 99.2% |
| Pyraminx (Average) | 1.14s | 1.05s [0.97-1.13] | ~2038 | 99.1% |
| Skewb (Single) | 0.73s | 0.62s [0.56-0.69] | ~2035 | 90.9% |
| Skewb (Average) | 1.37s | 1.18s [1.09-1.27] | ~2035 | 90.0% |
| Square-1 (Single) | 2.85s | 2.45s [2.2-2.73] | ~2038 | 99.0% |
| Square-1 (Average) | 4.63s | 4.18s [3.87-4.52] | ~2038 | 98.5% |
| Rubik's Clock (Single) | 1.53s | 1.32s [1.18-1.47] | ~2038 | 99.4% |
| Rubik's Clock (Average) | 2.14s | 1.84s [1.7-1.99] | ~2036 | 96.6% |
| 4x4x4 Blindfolded (Single) | 51.96s | 44.69s [40.12-49.77] | ~2038 | 99.4% |
| 4x4x4 Blindfolded (Average) | 59.39s | 54.64s [50.52-59.09] | ~2038 | 98.5% |
| 5x5x5 Blindfolded (Single) | 118.59s | 101.99s [91.57-113.6] | ~2038 | 99.5% |
| 5x5x5 Blindfolded (Average) | 147.63s | 135.82s [125.58-146.9] | ~2036 | 95.9% |
| 3x3x3 Multi-Blind (Single) | 61.0pts | 76.25pts [61.0-83.88] | ~2034 | 80.0% |

---

## Metodología y Fundamentación Teórica
- **Teoría de Valores Extremos (EVT):** Calibra la elasticidad de las soluciones únicas (Single), considerando soluciones afortunadas de bajo conteo de movimientos y alta velocidad punta (TPS).
- **Consistencia Robusta (Average):** Modela la convergencia en muestras de 5 soluciones donde el azar se compensa.
- **Soporte Positivo Log-Normal:** Garantiza que los intervalos de confianza respeten la naturaleza física estricta (T > 0).
