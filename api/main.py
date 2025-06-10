from datetime import timedelta
from functools import wraps
from flask import Flask, jsonify, render_template, request, g
from flask_cors import CORS
import requests
import firebase_admin
from firebase_admin import credentials, auth
import os
from dotenv import load_dotenv

# ------------------------------------------
# Environment Setup
# ------------------------------------------
load_dotenv()
FIREBASE_CRED_PATH = os.getenv("FIREBASE_CRED_PATH")
ROOM_SERVICE_BASE_URL = os.getenv("ROOM_SERVICE_BASE_URL")

# ------------------------------------------
# Firebase Setup
# ------------------------------------------
cred = credentials.Certificate(FIREBASE_CRED_PATH)
firebase_admin.initialize_app(cred)

# ------------------------------------------
# Flask App Setup
# ------------------------------------------
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5100"])

# ------------------------------------------
# Auth Decorator
# ------------------------------------------
def verify_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        session_cookie = request.cookies.get('session')
        if not session_cookie:
            return render_template('unauthorized.html')
        try:
            decoded_token = auth.verify_session_cookie(session_cookie, check_revoked=True)
            g.user = decoded_token
            return f(*args, **kwargs)
        except Exception:
            return render_template('unauthorized.html')
    return decorated_function

# ------------------------------------------
# Routes
# ------------------------------------------
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/room')
@verify_token
def main():
    return render_template('room.html')

@app.route('/chat')
@verify_token
def chat():
    return render_template('chat.html')

@app.route("/sessionLogin", methods=["POST"])
def session_login():
    print("Cookies Set")
    data = request.get_json()
    id_token = data.get("idToken")
    expires_in = timedelta(days=5)

    try:
        session_cookie = auth.create_session_cookie(id_token, expires_in=expires_in)
        response = jsonify({"status": "success"})
        response.set_cookie(
            "session", session_cookie,
            max_age=expires_in.total_seconds(),
            httponly=True,
            secure=False,  # Change to True if using HTTPS
            samesite="Lax"
        )
        return response
    except Exception as e:
        return jsonify({"error": "Session creation failed", "details": str(e)}), 401

@app.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"status": "logged out"})
    response.set_cookie("session", "", max_age=0)
    return response

@app.route('/join_room', methods=["POST"])
def joinRoom():
    try:
        session_cookie = request.cookies.get("session")
        if not session_cookie:
            return jsonify({"error": "No session cookie found"}), 401

        decoded_token = auth.verify_session_cookie(session_cookie, check_revoked=True)
        uid = decoded_token["uid"]
        data = request.get_json()
        rid = data.get('rid')

        response = requests.post(f"{ROOM_SERVICE_BASE_URL}/join_room", json={
            "uid": uid,
            "rid": rid
        })

        if response.status_code != 200:
            return jsonify({
                "error": "Failed to join room",
                "details": response.json() if response.headers.get('Content-Type') == 'application/json' else response.text
            }), response.status_code

        return jsonify(response.json()), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@app.route('/create_room', methods=["POST"])
def createRoom():
    session_cookie = request.cookies.get("session")
    if not session_cookie:
        return jsonify({"error": "Unauthenticated"}), 401

    try:
        decoded = auth.verify_session_cookie(session_cookie, check_revoked=True)
        uid = decoded['uid']
    except Exception:
        return jsonify({"error": "Invalid session"}), 401

    data = request.get_json()
    roomname = data.get('roomname')

    try:
        response = requests.post(f"{ROOM_SERVICE_BASE_URL}/create_room", json={
            "uid": uid,
            "roomname": roomname
        })

        if response.status_code != 200:
            return jsonify({
                "error": "Failed to create room",
                "details": response.json() if response.headers.get('Content-Type') == 'application/json' else response.text
            }), response.status_code

        return jsonify(response.json()), 200

    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": "Internal request failed",
            "details": str(e)
        }), 500

# ------------------------------------------
# Main
# ------------------------------------------
if __name__ == "__main__":
    app.run(port=5100)
