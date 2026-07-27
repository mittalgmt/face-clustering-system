#!/bin/sh

set -e

echo "========================================================"
echo " Starting Face Clustering Backend"
echo "========================================================"

# --------------------------------------------------------
# Wait for PostgreSQL
# --------------------------------------------------------

echo "Waiting for PostgreSQL..."

until pg_isready \
    -h "$POSTGRES_HOST" \
    -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER"
do
    echo "PostgreSQL unavailable - sleeping..."
    sleep 2
done

echo "PostgreSQL is ready."

# --------------------------------------------------------
# Wait for Redis
# --------------------------------------------------------

echo "Waiting for Redis..."

until redis-cli -h redis ping
do
    echo "Redis unavailable - sleeping..."
    sleep 2
done

echo "Redis is ready."

# --------------------------------------------------------
# Create Required Directories
# --------------------------------------------------------

mkdir -p media/uploads
mkdir -p logs
mkdir -p staticfiles
mkdir -p models

# --------------------------------------------------------
# Apply Database Migrations
# --------------------------------------------------------

echo "Running migrations..."

python manage.py migrate --noinput

# --------------------------------------------------------
# Collect Static Files
# --------------------------------------------------------

echo "Collecting static files..."

python manage.py collectstatic --noinput

# --------------------------------------------------------
# Download InsightFace Model (First Run Only)
# --------------------------------------------------------

echo "Checking InsightFace model..."

python - <<'PYTHON'
from pathlib import Path
import os

model_root = Path("models")
model_root.mkdir(parents=True, exist_ok=True)

try:
    from insightface.app import FaceAnalysis

    print("Initializing InsightFace model...")

    app = FaceAnalysis(
        name=os.getenv("INSIGHTFACE_MODEL_NAME", "buffalo_l"),
        root=str(model_root)
    )

    app.prepare(
        ctx_id=0,
        det_size=(640, 640)
    )

    print("InsightFace model ready.")

except Exception as e:
    print("Warning:")
    print(e)
    print("Application will still start.")
PYTHON

# --------------------------------------------------------
# Optional: Create Superuser
# --------------------------------------------------------

if [ "$CREATE_SUPERUSER" = "True" ]; then

python manage.py shell << END

from django.contrib.auth import get_user_model
import os

User = get_user_model()

username = os.getenv("DJANGO_SUPERUSER_USERNAME")
email = os.getenv("DJANGO_SUPERUSER_EMAIL")
password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

if username and not User.objects.filter(username=username).exists():

    User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )

    print("Superuser created.")

END

fi

# --------------------------------------------------------
# Start Application
# --------------------------------------------------------

echo "========================================================"
echo "Starting Gunicorn..."
echo "========================================================"

exec "$@"