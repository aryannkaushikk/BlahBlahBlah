from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room, send
import os
from dotenv import load_dotenv
import redis
import requests

# Load environment variables
load_dotenv()

# Base URLs from .env (use default for local Docker if not set)
MESSAGE_SERVICE_BASE = os.getenv('MESSAGE_SERVICE_BASE_URL')
ROOM_SERVICE_BASE = os.getenv('ROOM_SERVICE_BASE_URL')
REDIS_URL = os.getenv('REDIS_URL')

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Setup Flask and SocketIO
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

#Keep Warm Route
@app.route('/healthz')
def ping():

    try:
        redis_client.set("Health", "1", ex=60)
        return jsonify({"Status": "Chat Service and Redis Alive"}), 200
    except redis.RedisError as e:
        return jsonify({"Error": "Redis Issue"}), 500

@socketio.on('connect')
def on_connect(auth):
    rid = auth.get("rid") if auth else None
    uid = auth.get("uid") if auth else None
    username = auth.get("username") if auth else None
    newJoin = auth.get("newJoin") if auth else "0"

    if not rid or not uid:
        print("❌ Room ID (rid) OR User ID (uid) missing")
        return False

    join_room(rid)
    if str(newJoin) == "1":
        emit("join", {'username': username}, include_self=False, to=rid)
    else:
        emit("online", {'username': username}, include_self=False, to=rid)

    redis_client.sadd(f"online_users:{rid}", uid)
    redis_client.hset(f"user:{uid}", mapping={"username": username})
    online_users = list(redis_client.smembers(f"online_users:{rid}"))

    try:
        total_users = requests.get(f'{ROOM_SERVICE_BASE}/getUsers', params={'rid': rid}).json().get("users")
    except Exception as e:
        print("❌ Error fetching users from room service:", e)
        total_users = []

    onn, off, status = [], [], []
    for userID in total_users:
        user_data = {
            'uid': userID,
            'username': redis_client.hget(f"user:{userID}", "username")
        }
        if userID in online_users:
            user_data['online'] = "yes"
            onn.append(user_data)
        else:
            user_data['online'] = "no"
            off.append(user_data)
    status.append(onn)
    status.append(off)
    emit("user_list", {'status': status}, to=rid)

    try:
        resp = requests.get(f"{MESSAGE_SERVICE_BASE}/load_message", params={"rid": rid})
        resp.raise_for_status()
        messages = resp.json()
    except Exception as e:
        print("❌ Error fetching messages:", e)
        messages = {"res": []}

    msg_data = []
    for msg in messages['res']:
        try:
            read_resp = requests.get(f'{MESSAGE_SERVICE_BASE}/msgReadBy', params={'mid': msg['mid']})
            read_resp.raise_for_status()
            read_usernames = read_resp.json().get('users', [])
        except Exception as e:
            print(f"❌ Error getting read receipt for MID {msg['mid']}:", e)
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

    emit('load_msg', msg_data, to=request.sid)
    print(f"✅ Client {uid} joined room {rid}")

@socketio.on('changeRoom')
def handle_change_room(data):
    uid = data.get('uid')
    rid = data.get('rid')
    username = data.get('username')

    if not uid or not rid:
        return

    leave_room(rid)
    redis_client.srem(f"online_users:{rid}", uid)
    emit("offline", {'username': username}, to=rid, include_self=False)

    try:
        online_users = list(redis_client.smembers(f"online_users:{rid}"))
        total_users = requests.get(f'{ROOM_SERVICE_BASE}/getUsers', params={'rid': rid}).json().get("users", [])

        onn, off, status = [], [], []
        for userID in total_users:
            user_data = {
                'uid': userID,
                'username': redis_client.hget(f"user:{userID}", "username")
            }
            if userID in online_users:
                user_data['online'] = "yes"
                onn.append(user_data)
            else:
                user_data['online'] = "no"
                off.append(user_data)
        status.append(onn)
        status.append(off)
        emit("user_list", {'status': status}, to=rid)

    except Exception as e:
        print(f"❌ Error updating user list: {e}")

@socketio.on('leaveRoom')
def handle_leave_room(data):
    uid = data.get('uid')
    rid = data.get('rid')
    username = data.get('username')

    if not uid or not rid:
        print("❌ 'uid' or 'rid' missing in leaveRoom event")
        return

    leave_room(rid)
    redis_client.srem(f"online_users:{rid}", uid)
    redis_client.delete(f"user:{uid}")
    emit("left", {'username': username}, to=rid, include_self=False)

    try:
        response = requests.put(f'{ROOM_SERVICE_BASE}/delUserroom', json={'uid': uid, 'rid': rid})
        if response.status_code != 200:
            print(f"⚠️ Failed to remove user from room in DB: {response.text}")
    except Exception as e:
        print(f"❌ Error during room service call: {e}")

    try:
        online_users = list(redis_client.smembers(f"online_users:{rid}"))
        total_users = requests.get(f'{ROOM_SERVICE_BASE}/getUsers', params={'rid': rid}).json().get("users", [])

        onn, off, status = [], [], []
        for userID in total_users:
            user_data = {
                'uid': userID,
                'username': redis_client.hget(f"user:{userID}", "username")
            }
            if userID in online_users:
                user_data['online'] = "yes"
                onn.append(user_data)
            else:
                user_data['online'] = "no"
                off.append(user_data)
        status.append(onn)
        status.append(off)
        emit("user_list", {'status': status}, to=rid)

    except Exception as e:
        print(f"❌ Error updating user list: {e}")

@socketio.on('message')
def handle_message(data):
    uid = data.get("uid")
    rid = data.get("rid")
    msg = data.get("text")
    sender = data.get("sender")

    if not uid or not rid:
        print("❌ Missing uid or rid in message")
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
            data['mid'] = res['mid']
            data['time'] = res['time']
            data['readByAll'] = res['read_by_all']

            read_by_res = requests.get(f'{MESSAGE_SERVICE_BASE}/msgReadBy', params={"mid": data['mid']})

            if read_by_res.status_code == 200:
                data['read_by_users'] = read_by_res.json().get("users")
            else:
                data['read_by_users'] = []

            send(data, to=rid)
        else:
            print("❌ Message service failed:", response.text)

    except Exception as e:
        print("❌ Error contacting message service:", str(e))

@socketio.on('msgRead')
def msgRead(data):
    uid = data.get('uid')
    mid = data.get('mid')
    rid = data.get('rid')

    response = requests.post(f'{MESSAGE_SERVICE_BASE}/msgRead', json={
        'uid': uid,
        'rid': rid,
        'mid': mid
    }).json()

    if response['message'] != 'Already read':
        readByAll = response['readByAll']
        if readByAll:
            emit('readByAll', {"mid": mid}, to=rid)

@socketio.on('typing')
def typing(data):
    uid = data.get('uid')
    rid = data.get('rid')

    redis_client.sadd(f"user_typing:{rid}", uid)
    users = list(redis_client.smembers(f"user_typing:{rid}"))
    user_typing = [
        {'username': redis_client.hget(f"user:{userID}", "username"), 'uid': userID}
        for userID in users
    ]
    emit("typing_list", {'userList': user_typing}, to=rid)

@socketio.on('stop_typing')
def stop_typing(data):
    uid = data.get('uid')
    rid = data.get('rid')

    redis_client.srem(f"user_typing:{rid}", uid)
    users = list(redis_client.smembers(f"user_typing:{rid}"))
    user_typing = [
        {'username': redis_client.hget(f"user:{userID}", "username"), 'uid': userID}
        for userID in users
    ]
    emit("typing_list", {'userList': user_typing}, to=rid)

if __name__ == '__main__':
    socketio.run(app, port=8080, host='0.0.0.0')
