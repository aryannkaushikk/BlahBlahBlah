from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room, send
import os
from dotenv import load_dotenv
import redis
import requests


# Setup Flask and SocketIO
load_dotenv()
redis_url = os.getenv('REDIS_URL')
redis_client = redis.from_url(redis_url, decode_responses = True)

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

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
    if(str(newJoin)=="1"): 
        emit("join", {'username': username}, include_self=False, to=rid)
    else:
        emit("online",{'username': username},include_self=False,to=rid)
    redis_client.sadd(f"online_users:{rid}", uid)
    redis_client.hset(f"user:{uid}", mapping={"username": username})
    online_users = list(redis_client.smembers(f"online_users:{rid}"))
    total_users = requests.get('http://127.0.0.1:5800/getUsers', params={
        'rid': rid
    }).json().get("users")

    onn = []
    off = []
    status = []
    for userID in total_users:
        dict = {
            'uid': userID,
            'username': redis_client.hget(f"user:{userID}", "username")
        }

        if userID in online_users:
            dict['online'] = "yes"
            onn.append(dict)
        else:
            dict['online'] = "no"
            off.append(dict)
    status.append(onn)
    status.append(off)
    emit("user_list", {'status': status}, to=rid)

    try:
        resp = requests.get("http://127.0.0.1:5600/load_message", params={"rid": rid})
        resp.raise_for_status()
        messages = resp.json()
    except Exception as e:
        print("❌ Error fetching messages:", e)
        messages = {"res": []}

    msg_data = []
    for msg in messages['res']:
        try:
            read_resp = requests.get('http://127.0.0.1:5600/msgReadBy', params={'mid': msg['mid']})
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
        return  # Ignore if required data is missing

    # User leaves the room
    leave_room(rid)

    # Remove user from Redis online set
    redis_client.srem(f"online_users:{rid}", uid)

    # Notify others in the room that this user went offline
    emit("offline", {'username': username}, to=rid, include_self=False)

    # Update user list for remaining clients in the room
    try:
        online_users = list(redis_client.smembers(f"online_users:{rid}"))
        total_users = requests.get(
            'http://127.0.0.1:5800/getUsers',
            params={'rid': rid}
        ).json().get("users", [])

        onn = []
        off = []
        status = []
        for userID in total_users:
            dict = {
                'uid': userID,
                'username': redis_client.hget(f"user:{userID}", "username")
            }

            if userID in online_users:
                dict['online'] = "yes"
                onn.append(dict)
            else:
                dict['online'] = "no"
                off.append(dict)
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

    # Remove user from Redis set
    redis_client.srem(f"online_users:{rid}", uid)
    redis_client.delete(f"user:{uid}")

    # Inform room that this user left
    emit("left", {'username': username}, to=rid, include_self=False)

    # Call room service to remove user-room association
    try:
        response = requests.put(
            'http://127.0.0.1:5800/delUserroom',
            json={'uid': uid, 'rid': rid}
        )
        if response.status_code != 200:
            print(f"⚠️ Failed to remove user from room in DB: {response.text}")
    except Exception as e:
        print(f"❌ Error during room service call: {e}")

    # Update user list for remaining clients in the room
    try:
        online_users = list(redis_client.smembers(f"online_users:{rid}"))
        total_users = requests.get(
            'http://127.0.0.1:5800/getUsers',
            params={'rid': rid}
        ).json().get("users", [])

        onn = []
        off = []
        status = []
        for userID in total_users:
            dict = {
                'uid': userID,
                'username': redis_client.hget(f"user:{userID}", "username")
            }

            if userID in online_users:
                dict['online'] = "yes"
                onn.append(dict)
            else:
                dict['online'] = "no"
                off.append(dict)
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
        response = requests.post("http://127.0.0.1:5600/save_message", json={
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

            read_by_res = requests.get('http://127.0.0.1:5600/msgReadBy', params={
                "mid": data['mid']
            })

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

    response = requests.post('http://127.0.0.1:5600/msgRead', json={
        'uid': uid,
        'rid': rid,
        'mid': mid
    }).json()

    if(response['message']!='Already read'):
        readByAll = response['readByAll']

        if(readByAll):
            emit('readByAll', {"mid": mid}, to=rid)


@socketio.on('typing')
def typing(data):
    uid = data.get('uid')
    rid = data.get('rid')

    redis_client.sadd(f"user_typing:{rid}", uid)
    users = list(redis_client.smembers(f"user_typing:{rid}"))
    user_typing = [
        {
            'username': redis_client.hget(f"user:{userID}", "username"),
             'uid': userID 
        }
        for userID in users
        ]
    emit("typing_list", {'userList': user_typing}, to=rid)

@socketio.on('stop_typing')
def typing(data):
    uid = data.get('uid')
    rid = data.get('rid')

    redis_client.srem(f"user_typing:{rid}", uid)
    users = list(redis_client.smembers(f"user_typing:{rid}"))
    user_typing = [
        {
            'username': redis_client.hget(f"user:{userID}", "username"),
             'uid': userID 
        }
        for userID in users
        ]
    emit("typing_list", {'userList': user_typing}, to=rid)


if __name__ == '__main__':
    socketio.run(app, debug=True, port=8080, host='0.0.0.0')