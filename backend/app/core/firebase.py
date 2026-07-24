import logging
import firebase_admin
from firebase_admin import credentials, auth

try:
    from app.core.config import settings
except ImportError:
    from .config import settings

logger = logging.getLogger(__name__)

def init_firebase():
    """Initializes Firebase Admin SDK."""
    if not firebase_admin._apps:
        try:
            if settings.FIREBASE_CREDENTIALS_PATH:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin SDK initialized with certificate.")
            else:
                firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
                logger.info(f"Firebase Admin SDK initialized with project ID: {settings.FIREBASE_PROJECT_ID}")
        except Exception as e:
            logger.warning(f"Firebase Admin SDK initialization skipped: {e}")

def verify_firebase_token(id_token: str):
    """Verifies Firebase ID Token using Firebase Admin SDK."""
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        logger.warning(f"Firebase ID token verification failed: {e}")
        return None
