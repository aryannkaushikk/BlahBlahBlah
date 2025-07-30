import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from supabase import create_client, Client
from flask_cors import CORS

# ------------------------------------------
# Environment Setup
# ------------------------------------------
load_dotenv()
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# ------------------------------------------
# Flask App Initialization
# ------------------------------------------
app = Flask(__name__)
CORS(app, origins=["https://blah-blah-blah-two.vercel.app", "http://localhost:5173", "https://bbb-chat-service.onrender.com", "http://localhost:8080"])

# ------------------------------------------
# Health Check
# ------------------------------------------
@app.route('/healthz')
def health_check():
    print("✅ Message Service Health check hit")
    return jsonify({"Status": "Message Service Alive"}), 200

# ------------------------------------------
# Save Message
# ------------------------------------------
@app.route('/save_message', methods=['POST'])
def save_message():
    data = request.get_json()
    uid = data.get('uid')
    rid = data.get('rid')
    msg = data.get('message')
    sender = data.get('sender')

    print(f"📥 Save message called by {uid} in room {rid}")

    if not uid or not rid or not msg:
        print("❌ Missing required fields in save_message")
        return jsonify({'error': 'Missing uid, rid, or message'}), 400

    try:
        res = supabase.table("messages").insert({"uid": uid, "rid": rid, "message": msg, "sender": sender}).execute()
        saved = res.data[0]

        supabase.table("readreceipt").insert({"uid": uid, "mid": saved['mid'], "rid": rid}).execute()

        print(f"✅ Message saved with mid: {saved['mid']}")
        return jsonify({'mid': saved['mid'], 'time': saved['timestamp'], 'read_by_all': saved['read_by_all']}), 200
    except Exception as e:
        print("❌ Error saving message:", e)
        return jsonify({'error': 'Failed to save message'}), 500

# ------------------------------------------
# Load Messages
# ------------------------------------------
@app.route('/load_message', methods=['GET'])
def load_message():
    rid = request.args.get('rid')
    print(f"📥 load_message called for room: {rid}")

    if not rid:
        print("❌ Missing room ID in load_message")
        return jsonify({'error': 'Missing room ID'}), 400

    try:
        res = supabase.table("messages").select("*").eq("rid", rid).order("timestamp").execute()
        print(f"📤 Loaded {len(res.data)} messages")
        return jsonify({'res': res.data}), 200
    except Exception as e:
        print("❌ Error loading messages:", e)
        return jsonify({'error': 'Failed to load messages'}), 500

# ------------------------------------------
# Mark Message as Read
# ------------------------------------------
@app.route('/msgRead', methods=['POST'])
def msg_read():
    data = request.get_json()
    uid = data.get('uid')
    rid = data.get('rid')
    mid = data.get('mid')

    print(f"📥 msgRead called: uid={uid}, mid={mid}, rid={rid}")

    try:
        check = supabase.table("readreceipt").select("uid").eq("mid", mid).eq("uid", uid).execute()
        if check.data:
            print("ℹ️ Message already marked as read")
            return jsonify({'message': 'Already read', 'read_by_users': check.data}), 200

        supabase.table("readreceipt").insert({"uid": uid, "rid": rid, "mid": mid}).execute()

        total_users = supabase.table("userroom").select("uid").eq("rid", rid).execute().data or []
        all_reads = supabase.table("readreceipt").select("uid").eq("mid", mid).execute().data or []

        readers = [r['uid'] for r in all_reads]

        if len(readers) == len(total_users):
            supabase.table("messages").update({"read_by_all": True}).eq("mid", mid).execute()
            print(f"✅ All users have read message {mid}")
            return jsonify({'message': 'readByAll', 'read_by_users': readers, 'readByAll': True}), 200

        print(f"✅ Message {mid} marked as read by {uid}")
        return jsonify({'message': 'read', 'read_by_users': readers, 'readByAll': False}), 200

    except Exception as e:
        print("❌ Error in msgRead:", e)
        return jsonify({'error': 'Failed to update read receipt'}), 500

# ------------------------------------------
# Get Users Who Read a Message
# ------------------------------------------
@app.route('/msgReadBy', methods=['GET'])
def msg_read_by():
    mid = request.args.get('mid')
    print(f"📥 msgReadBy called for mid: {mid}")

    try:
        res = supabase.table("readreceipt").select("uid").eq("mid", mid).execute()
        readers = [r['uid'] for r in res.data]
        print(f"📤 Readers for message {mid}: {readers}")
        return jsonify({'users': readers}), 200
    except Exception as e:
        print("❌ Error in msgReadBy:", e)
        return jsonify({'error': 'Failed to fetch read receipts'}), 500

# ------------------------------------------
# Run Flask App
# ------------------------------------------
if __name__ == '__main__':
    print("🚀 Message service running on port 5600")
    app.run(port=5600)
