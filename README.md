# Speedcubing Human Limits & Progression (WCA)

Investigación cuantitativa y modelado probabilístico no paramétrico (Procesos Gaussianos) para estimar los **límites humanos asintóticos, la trayectoria del récord mundial esperado y los índices de saturación** en las 17 categorías oficiales de la World Cube Association (WCA).

---

## 📊 Características del Proyecto

- **Inferencia 100% Basada en Datos:** Estimación asintótica derivada de la curvatura de desaceleración y frenado histórico de los récords mundiales WCA (2003–2026), sin cotas manuales fijas.
- **Procesos Gaussianos con Restricción de Monotonía:** Modela la trayectoria continua del récord esperado sin rebotes contraintuitivos y con incertidumbre física acotada.
- **Historial Completo de Recordistas:** Seguimiento año a año de los atletas que rompieron o retuvieron cada marca oficial.
- **Soporte Estricto de Unidades WCA:** Formato minutero `mm:ss.xx` para marcas superiores a 60 segundos (ej. 7x7x7, 5x5x5 Blindfolded) e intervalos Log-Normales siempre positivos.
- **Dashboard Web Interactivo:** Aplicación web moderna (HTML5, Vanilla CSS, Chart.js) para explorar interactivamente las 17 disciplinas.

---

## 📁 Estructura del Repositorio

```text
speedcubing-limits/
├── data/
│   ├── download_wca_data.py       # Descarga y extracción automatizada del export oficial WCA
│   ├── process_all_wca_events.py  # Filtrado y decodificación de las 17 categorías
│   └── processed/                 # Dataset limpio de récords (.csv) y matrices Stan (.json)
├── models/
│   ├── fit_all_categories.py      # Pipeline de inferencia estadística y exportación JSON
│   └── stan/
│       └── gp_speedcubing.stan    # Código de programación probabilística en Stan
├── notebooks/
│   └── 01_analisis_limites_speedcubing.ipynb  # Notebook interactivo y reproducible
└── outputs/
    ├── limits_summary.json        # Base de datos maestra consumible por la web
    ├── reports/                   # Reportes consolidados en Markdown
    └── web_dashboard/             # Dashboard interactivo local (HTML/CSS/JS)
```

---

## 🚀 Guía Detallada de Instalación y Uso

### Prerrequisitos
- **Python:** Versión `3.9` o superior.
- **Gestor de paquetes:** `pip`.
- **Git** (para clonar el repositorio).

---

### Paso 1: Clonar el Repositorio y Crear un Entorno Virtual

1. Clona el repositorio en tu máquina local:
   ```bash
   git clone <URL_DE_TU_REPOSITORIO>
   cd speedcubing-limits
   ```

2. Se recomienda crear y activar un entorno virtual aislado:
   * **En Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   * **En Linux / macOS:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

---

### Paso 2: Instalación de Dependencias

Instala todas las librerías científicas necesarias (`pandas`, `numpy`, `scipy`, `matplotlib`, `seaborn`, `jupyter`, `requests`):

```bash
pip install -r requirements.txt
```

---

### Paso 3: Opciones de Ejecución

El proyecto está diseñado de forma modular, permitiéndote interactuar con él de cuatro formas distintas:

#### Opción A: Exploración Interactiva en Jupyter Notebook
Para revisar la deducción matemática paso a paso, generar gráficos comparativos y analizar el Proceso Gaussiano de forma interactiva:
```bash
jupyter notebook notebooks/01_analisis_limites_speedcubing.ipynb
```

#### Opción B: Lanzar el Dashboard Web Interactivo
Para visualizar interactivamente las curvas de trayectoria, los titulares anuales y el índice de saturación de las 17 categorías en tu navegador:
```bash
cd outputs/web_dashboard
python -m http.server 8000
```
Luego abre tu navegador web en: **`http://localhost:8000`**

#### Opción C: Re-ejecutar el Pipeline de Inferencia Global
Si deseas recalcular todos los límites asintóticos, probabilidades de Poisson y actualizar el archivo maestro `outputs/limits_summary.json` y el reporte en Markdown:
```bash
python models/fit_all_categories.py
```
*Los resultados actualizados se exportarán automáticamente a `outputs/limits_summary.json` y `outputs/reports/resumen_limites_speedcubing.md`.*

#### Opción D: Descargar y Reprocesar el Dataset Oficial WCA desde Cero (Opcional)
*(Nota: El repositorio ya incluye el dataset procesado en `data/processed/`, por lo que este paso no es obligatorio).*

Si deseas descargar el volcado oficial más reciente directamente desde los servidores de la WCA (~370 MB comprimido / ~1.1 GB descomprimido) y reconstruir la base de datos de récords:
```bash
# 1. Descargar y descomprimir el export WCA en data/raw/
python data/download_wca_data.py

# 2. Filtrar, limpiar y generar las matrices históricas de las 17 categorías
python data/process_all_wca_events.py
```

---

## 📈 Metodología y Referencias

1. **Procesos Gaussianos (GP):** Kernel cuadrático-exponencial (RBF) con longitud de correlación temporal y penalización por censura (`normal_lccdf`) para modelar la resistencia en mesetas de récords.
2. **Teoría de Valores Extremos (EVT) y Curvatura de Desaceleración:** Inferencia no paramétrica basada en la segunda derivada del descenso histórico de marcas oficiales WCA.
3. **Distribución Log-Normal:** Soporte estrictamente positivo ($T > 0$) para intervalos de confianza en variables de tiempo físico.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Los datos de competiciones y marcas históricas pertenecen a la [World Cube Association (WCA)](https://www.worldcubeassociation.org/).
