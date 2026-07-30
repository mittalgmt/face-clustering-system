# 👤 Face Clustering System

An intelligent, enterprise-grade face recognition and clustering application. The system automatically detects faces in images, extracts high-dimensional biometric embeddings, groups them into individual identities using the **DBSCAN** clustering algorithm, and calculates calibrated similarity confidence metrics.

---

## 🏗️ System Architecture

Below is the conceptual architecture of the pipeline showing the flow from image ingestion to clustered identities:

```text
       ┌────────────────────────┐
       │     Upload Image(s)    │
       └───────────┬────────────┘
                   │ (Zip / Raw)
                   ▼
       ┌────────────────────────┐
       │  Face Detection (yolov8)│  <-- InsightFace (buffalo_l)
       └───────────┬────────────┘
                   │ (Cropped Faces)
                   ▼
       ┌────────────────────────┐
       │  Embedding Extraction  │  <-- 512-D Vector Representation
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │   DBSCAN Clustering    │  <-- Unsupervised grouping (cosine distance)
       └───────┬──────────┬─────┘
               │          │
    (In-cluster)          │ (Noise/Outliers)
               ▼          ▼
 ┌────────────────┐    ┌─────────────────┐
 │ Centroid &     │    │   Noise Bin     │
 │ Confidence     │    │                 │
 └────────────────┘    └─────────────────┘
```

---

## 🛠️ Technology Stack

- **Backend**: Django 5.2, Django REST Framework, django-environ
- **Task Queue**: Celery 5.6, Redis 7 (broker & backend)
- **Database**: PostgreSQL 16
- **Deep Learning / AI**: 
  - **InsightFace** (`buffalo_l` model) for state-of-the-art face detection & embedding extraction
  - **scikit-learn** (`DBSCAN`) for unsupervised clustering
  - **NumPy & SciPy** for vector manipulation, centroid computation, and similarity calculations
- **Frontend**: React 18, React Router Dom, Axios, Vite 5

---

## 🚀 Quick Start (Docker Compose)

The easiest way to boot the entire multi-container environment (Database, Redis, Django backend, Celery worker, Celery beat, and React frontend) is via Docker.

### Prerequisites
- Docker Engine >= 20.10
- Docker Compose >= 2.00

### Steps
1. **Clone the repository**:
   ```bash
   git clone <repo-url> face-clustering-system
   cd face-clustering-system
   ```

2. **Initialize Environment Variables**:
   Copy `.env.example` in the backend directory:
   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Start the containers**:
   From the root folder:
   ```bash
   docker compose -f backend/docker-compose.yml up --build -d
   ```

4. **Access the application**:
   - Frontend: `http://localhost` (via Nginx reverse proxy) or dev server
   - Backend API Docs: `http://localhost:8000/api/schema/swagger-ui/`

---

## 💻 Manual Setup & Local Development

If you prefer to run services natively for active development:

### 1. Database & Cache
Ensure you have a PostgreSQL database and a Redis instance running:
```bash
# Redis default port: 6379 or 7000 (configurable in .env)
redis-server --port 7000
```

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations & start server:
   ```bash
   python manage.py migrate
   python manage.py runserver 8000
   ```
5. Run the Celery worker (in a separate terminal):
   ```bash
   celery -A config worker --loglevel=info
   ```

### 3. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Launch React development server:
   ```bash
   npm run dev
   ```
4. Access the frontend app at `http://localhost:5173`.

---

## 🔒 Configuration & Environment Variables

The backend relies on `.env` configuration file loaded via `django-environ`. Key settings include:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `SECRET_KEY` | Django application secret key | `django-insecure-...` |
| `DEBUG` | Enable verbose error reporting | `True` |
| `POSTGRES_DB` | Target PostgreSQL database name | `face_clustering` |
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `1234` |
| `REDIS_URL` | Cache/Message Broker URL | `redis://127.0.0.1:7000/0` |
| `INSIGHTFACE_MODEL_NAME` | InsightFace model variant | `buffalo_l` |
| `INSIGHTFACE_MODEL_ROOT` | Folder path for model weights | `models` |
| `ONNX_PROVIDER` | CPU or GPU provider for ONNX execution | `CPUExecutionProvider` |

---

## 🧪 Algorithms & Math Details

### DBSCAN Clustering
The system uses the Density-Based Spatial Clustering of Applications with Noise (**DBSCAN**) algorithm.
- **Metric**: Cosine Distance ($1 - \text{cosine\_similarity}$)
- **Epsilon ($\epsilon$)**: `0.40`. Faces closer than this threshold form dense neighborhoods.
- **Outliers**: Biometric points that don't satisfy the density criterion are labeled as noise (`-1`) and are kept separate from identified identities.

### Calibrated Embedding Confidence Formula
Confidence values represent how close a face embedding $\mathbf{u}$ is to the cluster centroid $\mathbf{c}$ (calculated as the normalized mean vector of the cluster).

We apply a calibrated **affine remapping** from similarity bounds $[0.3, 1.0]$ to $[0, 100]\%$:

$$
\text{Similarity} = \frac{\mathbf{u} \cdot \mathbf{c}}{\|\mathbf{u}\| \|\mathbf{c}\|}
$$

$$
\text{Confidence} = \begin{cases} 
0\% & \text{if } \text{Similarity} \le 0.3 \\
\min\left(100\%, \frac{\text{Similarity} - 0.3}{1.0 - 0.3} \times 100\right) & \text{if } \text{Similarity} > 0.3 
\end{cases}
$$

This prevents spurious high confidences for distinct people, guaranteeing that borderline matching embeddings yield low/zero confidence while strong matches score high.

---

## 📡 API Documentation

### 1. Ingest Images
- **Endpoint**: `POST /api/upload/`
- **Payload**: Form data with `images` list or a bulk `.zip` folder.
- **Response**:
  ```json
  {
    "job_id": "a90b4d45-d8cf-4b95-a22d-7d84b0ebbc21",
    "status": "PENDING"
  }
  ```

### 2. Check Job Status
- **Endpoint**: `GET /api/jobs/<job_id>/`
- **Response**:
  ```json
  {
    "job_id": "a90b4d45-d8cf-4b95-a22d-7d84b0ebbc21",
    "status": "COMPLETED",
    "total_images": 45,
    "processed_images": 45,
    "created_at": "2026-07-30T14:47:25Z"
  }
  ```

### 3. Fetch Clusters
- **Endpoint**: `GET /api/jobs/<job_id>/clusters/`
- **Response**: Returns grouping details including face centroids and confidence scores.

### 4. Fetch Noise Faces
- **Endpoint**: `GET /api/jobs/<job_id>/noise/`
- **Response**: Returns list of unclustered/outlier faces.

---
