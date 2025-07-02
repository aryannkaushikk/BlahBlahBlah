import os
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from supabase import create_client, Client
from flask_cors import CORS

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

app = Flask(__name__)
CORS(app)

#Keep Warm Route
@app.route('/healthz')
def ping():
    return jsonify({"Status": "Room Service Alive"}), 200

@app.route('/create_room', methods=['POST'])
def create_room():
    data = request.get_json()
    roomname = data.get('roomname')
    userid = data.get('uid')

    # Rest of your DB logic...
    try:
        response = (
            supabase.table("rooms")
            .insert({"name": roomname})
            .execute()
        )
        rid = response.data[0]['rid']
    except Exception as e:
        return jsonify({'error': 'Room creation failed'}), 400

    try:
        response = (
            supabase.table("userroom")
            .insert({"rid": rid, "uid": userid})
            .execute()
        )
    except Exception as e:
        return jsonify({'error': 'Could not add user to room'}), 400

    return jsonify({'message': 'Successfully created the room', 'rid': rid, 'roomname': roomname}), 200



@app.route('/join_room', methods = ['POST'])
def join_room():
    data = request.get_json()
    rid = data.get('rid')
    roomname = ''
    userid = data.get('uid')


    # Check if room exists, if not create it
    try:
        response = (
            supabase.table("rooms")
            .select("*")
            .eq("rid", rid)
            .execute()
        )
        roomname = response.data[0]['name']
        if not response.data or len(response.data)==0:
            return jsonify({'error': 'Room does not exist'}), 400
    except Exception as e:
        print(e)
        return jsonify({'message': 'error'}), 400

    # Link user and room if not already linked
    newJoin = 0
    try:
        response = (
            supabase.table("userroom")
            .select("*")
            .eq("uid", userid)
            .eq("rid", rid)
            .execute()
        )
        if not response.data:
            response = (
                supabase.table("userroom")
                .insert({"rid": rid, "uid": userid})
                .execute()
            )
            newJoin = 1
    except Exception as e:
        print(e)
        return jsonify({'message': 'error'}), 400
    
    return jsonify({'message': "User joined Succesfully", 'rid': rid, 'roomname': roomname, 'newJoin': newJoin}), 200


@app.route('/getUsers', methods=["GET"])
def get_users():
    rid = request.args.get("rid")

    if not rid:
        return jsonify({'error': "Missing 'rid' in query parameters"}), 400

    try:
        response = (
            supabase.table("userroom")
            .select("uid")
            .eq("rid", rid)
            .execute()
        )

        users = [user['uid'] for user in response.data] if response.data else []
        return jsonify({'users': users}), 200

    except Exception:
        return jsonify({'error': "Internal server error"}), 500


@app.route('/delUserroom', methods=["PUT"])
def del_user_room():
    try:
        data = request.get_json()
        rid = data.get('rid')
        uid = data.get('uid')

        if not rid or not uid:
            return jsonify({"error": "Missing 'rid' or 'uid' in request"}), 400

        result = (
            supabase.table("userroom")
            .delete()
            .eq("rid", rid)
            .eq("uid", uid)
            .execute()
        )

        # Ensure result is not None
        if result is None:
            return jsonify({"error": "Supabase returned no result"}), 500

        # Check if any row was actually deleted
        if isinstance(result, list) and len(result) == 0:
            return jsonify({"error": "No matching user-room found to delete"}), 404

        return jsonify({"message": "User removed from room successfully"}), 200

    except Exception as e:
        return jsonify({"error": "Server error", "message": str(e)}), 500


if __name__ == '__main__':
    app.run(port=5800)