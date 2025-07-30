from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room, send
import os
from dotenv import load_dotenv
import redis
import requests
import jwt
from flask_cors import CORS

# ------------------------------------------
# Environment Setup
# ------------------------------------------
load_dotenv()

MESSAGE_SERVICE_BASE = os.getenv('MESSAGE_SERVICE_BASE_URL')
ROOM_SERVICE_BASE = os.getenv('ROOM_SERVICE_BASE_URL')
REDIS_URL = os.getenv('REDIS_URL')
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# ------------------------------------------
# Redis Setup
# ------------------------------------------
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# ------------------------------------------
# Flask App + Socket.IO Setup
# ------------------------------------------
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins=["https://blah-blah-blah-two.vercel.app", "http://localhost:5173"])
CORS(app, origins=["https://blah-blah-blah-two.vercel.app", "http://localhost:5173"])

# ------------------------------------------
# Health Check
# ------------------------------------------
@app.route('/healthz')
def ping():
    try:
        redis_client.set("Health", "1", ex=60)
        print("✅ Chat Service Health check hit")
        return jsonify({"Status": "Chat Service and Redis Alive"}), 200
    except redis.RedisError:
        return jsonify({"Error": "Redis Issue"}), 500

# ------------------------------------------
# Socket: Connect
# ------------------------------------------
@socketio.on('connect')
def on_connect(auth):
    token = auth.get("token")
    rid = auth.get("rid")

    if not token or not rid:
        print("❌ Connect rejected: Missing token or room ID")
        return False

    try:
        decoded = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        uid = decoded.get("sub")
        username = decoded.get("user_metadata", {}).get("name", "unknown")
    except Exception as e:
        print(f"❌ Invalid token: {e}")
        return False

    join_room(rid)
    redis_client.sadd(f"online_users:{rid}", uid)
    redis_client.hset(f"user:{uid}", mapping={"username": username})
    redis_client.hset(f"sid:{request.sid}", mapping={"uid": uid, "rid": rid})
    redis_client.expire(f"sid:{request.sid}", 3600)

    print(f"✅ {uid} connected to room {rid}")

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{ROOM_SERVICE_BASE}/getUsers", params={'rid': rid}, headers=headers)
        users_data = response.json() if response.status_code == 200 else {}
        total_users = users_data.get("users", [])
    except Exception as e:
        print(f"❌ Error fetching users from room service: {e}")
        total_users = []

    usernames = {
        user_id: redis_client.hget(f"user:{user_id}", "username") or "unknown"
        for user_id in total_users
    }
    online_uids = redis_client.smembers(f"online_users:{rid}")
    members = [
        {"uid": user_id, "username": usernames.get(user_id, "unknown"), "online": user_id in online_uids}
        for user_id in total_users
    ]
    print(f"📤 Sending user list to room {rid}: {members}")
    emit("user_list", {"status": [members, []]}, to=rid)

    try:
        resp = requests.get(f"{MESSAGE_SERVICE_BASE}/load_message", params={"rid": rid})
        messages = resp.json() if resp.status_code == 200 else {"res": []}
    except Exception as e:
        print(f"❌ Error fetching messages: {e}")
        messages = {"res": []}

    msg_data = []
    for msg in messages['res']:
        try:
            read_resp = requests.get(f'{MESSAGE_SERVICE_BASE}/msgReadBy', params={'mid': msg['mid']})
            read_usernames = read_resp.json().get('users', []) if read_resp.status_code == 200 else []
        except Exception:
            read_usernames = []

        msg_data.append({
            "sender": msg['sender'],
            "uid": msg['uid'],
            "text": msg['message'],
            "time": msg['timestamp'],
            "mid": msg['mid'],
            "read_by_users": read_usernames,
            "readByAll": msg.get('read_by_all', False)
        })

    print(f"📤 Loading messages to {uid} in room {rid}: {len(msg_data)} messages")
    emit('load_msg', msg_data, to=request.sid)

# ------------------------------------------
# Socket: Disconnect
# ------------------------------------------
@socketio.on('disconnect')
def on_disconnect():
    sid = request.sid
    try:
        info = redis_client.hgetall(f"sid:{sid}")
        uid = info.get("uid")
        rid = info.get("rid")

        if uid and rid:
            redis_client.srem(f"online_users:{rid}", uid)
            print(f"🔌 {uid} disconnected from room {rid}")

        redis_client.delete(f"sid:{sid}")
    except Exception as e:
        print(f"❌ Error during disconnect: {e}")

# ------------------------------------------
# Socket: Message Send
# ------------------------------------------
@socketio.on('message')
def handle_message(data):
    uid, rid, msg, sender = data.get("uid"), data.get("rid"), data.get("text"), data.get("sender")
    if not uid or not rid:
        return

    try:
        response = requests.post(f"{MESSAGE_SERVICE_BASE}/save_message", json={
            "uid": uid,
            "rid": rid,
            "message": msg,
            "sender": sender
        })
        if response.status_code == 200:
            res = response.json()
            data.update({
                'mid': res['mid'],
                'time': res['time'],
                'readByAll': res['read_by_all']
            })
            read_by_res = requests.get(f'{MESSAGE_SERVICE_BASE}/msgReadBy', params={"mid": data['mid']})
            data['read_by_users'] = read_by_res.json().get("users") if read_by_res.status_code == 200 else []
            send(data, to=rid)
            print(f"📨 {uid} sent message to {rid}: {msg}")
        else:
            print("❌ Failed to save message:", response.text)
    except Exception as e:
        print(f"❌ Exception sending message: {e}")

# ------------------------------------------
# Socket: Message Read
# ------------------------------------------
@socketio.on('msgRead')
def msgRead(data):
    uid, mid, rid = data.get('uid'), data.get('mid'), data.get('rid')
    try:
        response = requests.post(f'{MESSAGE_SERVICE_BASE}/msgRead', json={
            'uid': uid,
            'rid': rid,
            'mid': mid
        }).json()
        if response['message'] != 'Already read' and response.get('readByAll'):
            emit('readByAll', {"mid": mid}, to=rid)
            print(f"✅ Message {mid} read by all in {rid}")
    except Exception as e:
        print(f"❌ Error marking message read: {e}")

# ------------------------------------------
# Socket: Typing Start
# ------------------------------------------
@socketio.on('typing')
def typing(data):
    uid, username, rid = data.get('uid'), data.get('username'), data.get('rid')
    if not uid or not username or not rid:
        return

    redis_client.hset(f"typing_user:{uid}", mapping={"uid": uid, "username": username})
    redis_client.sadd(f"user_typing:{rid}", uid)

    users = list(redis_client.smembers(f"user_typing:{rid}"))
    typing_list = [
        redis_client.hgetall(f"typing_user:{uid}") for uid in users
    ]
    emit("typing_list", {"userList": typing_list}, to=rid)
    print(f"✍️ {username} is typing in {rid}")

# ------------------------------------------
# Socket: Typing Stop
# ------------------------------------------
@socketio.on('stop_typing')
def stop_typing(data):
    uid, rid = data.get('uid'), data.get('rid')
    if not uid or not rid:
        return

    redis_client.srem(f"user_typing:{rid}", uid)
    redis_client.delete(f"typing_user:{uid}")

    users = list(redis_client.smembers(f"user_typing:{rid}"))
    typing_list = [
        redis_client.hgetall(f"typing_user:{uid}") for uid in users
    ]
    emit("typing_list", {"userList": typing_list}, to=rid)
    print(f"🛑 {uid} stopped typing in {rid}")

# ------------------------------------------
# Run Server
# ------------------------------------------
if __name__ == '__main__':
    socketio.run(app, port=8080, host='0.0.0.0')
