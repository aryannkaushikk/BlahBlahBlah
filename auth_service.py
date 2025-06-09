from functools import wraps
from flask import redirect, request, jsonify, g
import firebase_admin
from firebase_admin import credentials, auth

# Initialize Firebase with the dict
cred = credentials.Certificate("firebase-sdk.json")
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
