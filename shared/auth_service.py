from functools import wraps
from flask import request, jsonify, g
import firebase_admin
from firebase_admin import credentials, auth

FIREBASE_CRED_PATH = "/etc/secrets/firebase-sdk.json"

cred = credentials.Certificate(FIREBASE_CRED_PATH)
firebase_admin.initialize_app(cred)

def verify_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid token"}), 401
        token = auth_header.split(" ")[1]
        try:
            decoded_token = auth.verify_id_token(token)
            g.uid = decoded_token["uid"]  # attach to request
        except Exception as e:
            return jsonify({"error": "Invalid or expired token"}), 401
        return f(*args, **kwargs)
    return decorated_function
