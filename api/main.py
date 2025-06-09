from flask import Flask, jsonify, render_template, request, g
import requests
from shared.auth_service import verify_token
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/room')
def main():
    return render_template('room.html')

@app.route('/chat')
def chat():
    return render_template('chat.html')

@app.route('/join_room', methods=["POST"])
@verify_token
def joinRoom():
    data = request.get_json()
    rid = data.get('rid')
    uid = g.uid

    try:
        response = requests.post("https://bbb-room-service.onrender.com/join_room", json={
            "uid": uid,
            "rid": rid
        })

        if response.status_code != 200:
            return jsonify({
                "error": "Failed to join room",
                "details": response.json() if response.headers.get('Content-Type') == 'application/json' else response.text
            }), response.status_code

        return jsonify(response.json()), 200

    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Internal service call failed", "details": str(e)}), 500


@app.route('/create_room', methods=["POST"])
@verify_token
def createRoom():
    data = request.get_json()
    roomname = data.get('roomname')
    uid = g.uid

    try:
        response = requests.post("https://bbb-room-service.onrender.com/create_room", json={
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



if __name__ == "__main__":
    app.run(port=5100)