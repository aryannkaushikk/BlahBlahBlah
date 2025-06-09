from datetime import datetime
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from supabase import Client, create_client

# Load .env variables
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# Initialize Flask app
app = Flask(__name__)

# Route to save message
@app.route('/save_message', methods=['POST'])
def save_message():
    data = request.get_json()
    uid = data.get('uid')
    rid = data.get('rid')
    msg = data.get('message')
    sender = data.get('sender')
    mid = ''
    time = ''

    if not rid or not msg or not uid:
        return jsonify({'error': 'Missing room ID or message text or User ID'}), 400

    try:
        response = (
            supabase.table("messages")
            .insert({"uid": uid, "rid": rid, "message": msg, "sender": sender})
            .execute()
        )
        mid = response.data[0]['mid']
        time = response.data[0]['timestamp']
        read_by_all = response.data[0]['read_by_all']
        
        supabase.table("readreceipt").insert({"uid": uid, "mid": mid, "rid": rid}).execute()
    except Exception as e:
        print("❌ DB error:", e)
        return jsonify({'error': 'Failed to save message'}), 500
    print("Message Saved")
    return jsonify({'mid': mid, 'time': time, 'read_by_all': read_by_all})


# Route to load message
@app.route('/load_message', methods=['GET'])
def load_message():
    rid = request.args.get('rid')

    if not rid:
        return jsonify({'error': 'Missing room ID'}), 400

    try:
        response = (
            supabase.table("messages")
            .select("*")
            .order("timestamp", desc=False)
            .execute()
        )

        return jsonify({'res': response.data})
    except Exception as e:
        print("❌ DB error:", e)
        return jsonify({'error': 'Failed to save message'}), 500
    
@app.route('/msgRead', methods=["POST"])
def msgRead():
    data = request.get_json()
    uid = data.get('uid')
    rid = data.get('rid')
    mid = data.get('mid')

    # Already read?
    response = (
        supabase.table("readreceipt")
        .select("uid")
        .eq("mid", mid)
        .eq("uid", uid)
        .execute()
    )

    if response.data and len(response.data) > 0:
        return jsonify({'message': 'Already read', 'read_by_users': response.data}), 200

    # Insert new read receipt
    supabase.table("readreceipt").insert({'uid': uid, 'rid': rid, 'mid': mid}).execute()

    # Fetch total users in room
    total_user_in_room = (
        supabase.table("userroom")
        .select("uid")
        .eq("rid", rid)
        .execute()
    ).data or []

    # Fetch all users who have read this message
    total_read = (
        supabase.table("readreceipt")
        .select("uid")
        .eq("mid", mid)
        .execute()
    ).data or []

    user_read = [user['uid'] for user in response.data]

    if len(total_read) == len(total_user_in_room):
        try:
            supabase.table("messages").update({"read_by_all": True}).eq("mid", mid).execute()
            return jsonify({'message': 'readByAll', 'read_by_users': user_read, 'readByAll': True}), 200
        except Exception as e:
            print(e)
            return jsonify({'error': 'Failed to update read_by_all'}), 500

    return jsonify({'message': 'read', 'read_by_users': user_read, 'readByAll': False}), 200

@app.route('/msgReadBy', methods=["GET"])
def msgReadBy():
    mid = request.args.get('mid')
    response = (
        supabase.table("readreceipt")
        .select("uid")
        .eq("mid", mid)
        .execute()
    )

    users = [user['uid'] for user in response.data]
    return jsonify({'users': users})



# Run the app
if __name__ == '__main__':
    app.run(port=5600)
