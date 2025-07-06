import os
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
import jwt
from functools import wraps

# ------------------------------------------
# Environment Setup
# ------------------------------------------
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ------------------------------------------
# Flask App Setup
# ------------------------------------------
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["*"])

# ------------------------------------------
# JWT Auth Middleware
# ------------------------------------------
def verify_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            print("❌ Missing or invalid Authorization header")
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        token = auth_header.split(" ")[1]
        try:
            decoded = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
            g.user = decoded
            return f(*args, **kwargs)
        except Exception as e:
            print("❌ Invalid token:", str(e))
            return jsonify({"error": "Invalid token", "details": str(e)}), 401
    return decorated

# ------------------------------------------
# Keep-Alive
# ------------------------------------------
@app.route('/healthz')
def health():
    print("✅ Health check hit")
    return jsonify({"status": "Room Service Alive"}), 200

# ------------------------------------------
# Create Room
# ------------------------------------------
@app.route('/create_room', methods=['POST'])
@verify_token
def create_room():
    data = request.get_json()
    roomname = data.get('roomname')
    uid = g.user["sub"]

    if not roomname:
        print("❌ Missing room name in create_room")
        return jsonify({'error': 'Missing room name'}), 400

    try:
        res = supabase.table("rooms").insert({"name": roomname}).execute()
        rid = res.data[0]['rid']
        supabase.table("userroom").insert({"rid": rid, "uid": uid}).execute()
        print(f"✅ Room '{roomname}' created with rid: {rid} by user: {uid}")
        return jsonify({'message': 'Room created successfully', 'rid': rid, 'roomname': roomname}), 200
    except Exception as e:
        print("❌ Room creation failed:", str(e))
        return jsonify({'error': 'Room creation failed', 'details': str(e)}), 500

# ------------------------------------------
# Join Room
# ------------------------------------------
@app.route('/join_room', methods=['POST'])
@verify_token
def join_room():
    data = request.get_json()
    rid = data.get('rid')
    uid = g.user["sub"]

    if not rid:
        print("❌ Missing rid in join_room")
        return jsonify({'error': 'Missing room ID'}), 400

    try:
        room = supabase.table("rooms").select("name").eq("rid", rid).execute()
        if not room.data:
            print(f"❌ Room with rid {rid} does not exist")
            return jsonify({'error': 'Room does not exist'}), 404
        roomname = room.data[0]['name']

        existing = supabase.table("userroom").select("uid").eq("uid", uid).eq("rid", rid).execute()
        newJoin = 0
        if not existing.data:
            supabase.table("userroom").insert({"rid": rid, "uid": uid}).execute()
            newJoin = 1
            print(f"✅ User {uid} joined room {rid}")
        else:
            print(f"ℹ️ User {uid} was already in room {rid}")

        return jsonify({'message': "User joined successfully", 'rid': rid, 'roomname': roomname, 'newJoin': newJoin}), 200
    except Exception as e:
        print("❌ Join failed:", str(e))
        return jsonify({'error': 'Join failed', 'details': str(e)}), 500

# ------------------------------------------
# Get Rooms for User
# ------------------------------------------
@app.route('/getRooms', methods=['GET'])
@verify_token
def get_rooms():
    uid = g.user["sub"]
    try:
        joins = supabase.table("userroom").select("rid").eq("uid", uid).execute()
        rids = [r['rid'] for r in joins.data]
        print(f"📥 Fetching rooms for uid: {uid}")

        if not rids:
            print("ℹ️ No rooms found for user")
            return jsonify({'rooms': []}), 200

        rooms = supabase.table("rooms").select("rid, name").in_("rid", rids).execute()
        print(f"📤 Rooms returned: {rooms.data}")
        return jsonify({'rooms': rooms.data}), 200
    except Exception as e:
        print("❌ Failed to fetch rooms:", str(e))
        return jsonify({'error': 'Failed to fetch rooms', 'details': str(e)}), 500

# ------------------------------------------
# Get Users in Room
# ------------------------------------------
@app.route('/getUsers', methods=['GET'])
@verify_token
def get_users():
    rid = request.args.get("rid")
    if not rid:
        print("❌ Missing 'rid' in getUsers")
        return jsonify({'error': "Missing 'rid' in query"}), 400

    try:
        users = supabase.table("userroom").select("uid").eq("rid", rid).execute()
        print("📥 getUsers called for rid:", rid)
        print("📦 Supabase response:", users.data)

        user_ids = [u['uid'] for u in users.data]
        print("📤 Returning user IDs:", user_ids)

        return jsonify({'users': user_ids}), 200
    except Exception as e:
        print("❌ Supabase fetch error:", str(e))
        return jsonify({'error': 'Failed to fetch users', 'details': str(e)}), 500

# ------------------------------------------
# Leave Room
# ------------------------------------------
@app.route('/delUserroom', methods=["PUT"])
@verify_token
def leave_room():
    data = request.get_json()
    rid = data.get('rid')
    uid = g.user["sub"]

    if not rid:
        print("❌ Missing 'rid' in delUserroom")
        return jsonify({"error": "Missing 'rid'"}), 400

    try:
        supabase.table("userroom").delete().eq("uid", uid).eq("rid", rid).execute()
        print(f"🗑️ User {uid} removed from room {rid}")
        return jsonify({"message": "User removed from room"}), 200
    except Exception as e:
        print("❌ Failed to leave room:", str(e))
        return jsonify({"error": "Failed to leave room", "details": str(e)}), 500

# ------------------------------------------
# Run App
# ------------------------------------------
if __name__ == '__main__':
    print("🚀 Room service running on port 5800")
    app.run(port=5800)
