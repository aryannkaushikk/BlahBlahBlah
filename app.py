from datetime import datetime
import os
from flask import Flask, redirect, render_template, request
from flask_socketio import SocketIO, emit, leave_room, send, join_room
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import redis

redis_client = redis.StrictRedis(host='localhost', port=6379, decode_responses=True) #Redis Initialisation

load_dotenv() #.env files loading

DATABASE_URL = os.getenv('DATABASE_URL') #DB URL

app = Flask(__name__) #App Initialisation
socketio = SocketIO(app) #Socket Initialisation

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL") #DB Configuration
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app) #Creating instance of DB

#DB SECTION

class Users(db.Model):
    
    __tablename__ = "users"

    uid = db.Column(db.String, primary_key = True)
    username = db.Column(db.String, nullable = False, unique = True)

    def __repr__(self):
        return f"<User {self.username}>"
    
class Rooms(db.Model):
    
    __tablename__ = "rooms"

    rid = db.Column(db.String, primary_key = True)
    roomname = db.Column(db.String, nullable = False, unique = True)

    def __repr__(self):
        return f"<User {self.roomname}>"
    
class UserRoom(db.Model):
    
    __tablename__ = "userroom"

    uid = db.Column(db.String, db.ForeignKey('users.uid'), primary_key = True)
    rid = db.Column(db.String, db.ForeignKey('rooms.rid'), primary_key = True)
    
class Messages(db.Model):
    
    __tablename__ = "messages"

    mid = db.Column(db.String, primary_key = True)
    uid = db.Column(db.String, db.ForeignKey('users.uid'), nullable = False)
    rid = db.Column(db.String, db.ForeignKey('rooms.rid'), nullable = False)
    message = db.Column(db.String, nullable = False)
    timestamp = db.Column(db.DateTime, default = datetime.utcnow, nullable = False)

    user = db.relationship('Users', backref='messages')
    room = db.relationship('Rooms', backref='messages')

    def __repr__(self):
        return f"<Message {self.message} from user {self.uid} in room {self.rid}>"
    
#DB SECTION


#Join Page
@app.route('/', methods = ['GET','POST'])
def start():
    if request.method=='POST':
        return redirect('/chat')
    return render_template("join.html")


#Chat Page
@app.route('/chat')
def chat():
    return render_template("chat.html")

#Message BroadCasting
@socketio.on('message')
def get_message(data):
    uid = Users.query.filter_by(username = data["username"]).first().uid
    rid = Rooms.query.filter_by(roomname = data["roomname"]).first().rid
    msg = data["text"]
    
    new_msg = Messages(mid = 'MID'+ str(Messages.query.count() + 1), uid = uid, rid = rid, timestamp = datetime.utcnow(), message = msg)
    try:
        db.session.add(new_msg)
        db.session.commit()
    except Exception as e:
        print("❌ DB Write Failed:", e)

    send(data, to=rid)


#User Joining
@socketio.on('join')
def join(data):
    roomname = data["roomname"]
    username = data["username"]

    room = Rooms.query.filter_by(roomname=roomname).first()

    if not room:
        new_room = Rooms(rid = 'RID' + str(Rooms.query.count() + 1), roomname = roomname)
        try: 
            db.session.add(new_room)
            db.session.commit()
            room = new_room
        except Exception as e:
            print("❌ DB Write Failed:", e)

    user = Users.query.filter_by(username = username).first()
    if not user:
        new_user = Users(uid = 'UID' + str(Users.query.count() + 1), username = username)
        try: 
            db.session.add(new_user)
            db.session.commit()
            user = new_user
        except Exception as e:
            print("❌ DB Write Failed:", e)

    new = False
    if not UserRoom.query.filter_by(rid = room.rid, uid = user.uid).first():
        user_room = UserRoom(uid = user.uid, rid = room.rid)
        try:
            db.session.add(user_room)
            db.session.commit()
            new = True
        except Exception as e:
            print("❌ DB Write Failed:", e)

    join_room(room.rid)

    messages = Messages.query.filter_by(rid = room.rid).order_by(Messages.timestamp).all()
    msg_data = [{
                    "username": Users.query.get(msg.uid).username,
                    "text": msg.message,
                    } for msg in messages]

    emit('load_msg',msg_data, to=request.sid)


    if(new):
        emit('join',username, to=room.rid)
        try:
            redis_client.sadd(f"online_users:{room.rid}", username)
        except Exception as e:
            print("❌ Redis Add Failed:", e)
    userList = []
    try:
        userList = list(redis_client.smembers(f"online_users:{room.rid}"))
    except Exception as e:
        print("❌ Redis List Failed:", e)
    emit('user_list', userList ,to=room.rid)


#User Leaving
@socketio.on('left')
def left(data):
    roomname = data["roomname"]
    username = data["username"]

    room = Rooms.query.filter_by(roomname = roomname).first()
    user = Users.query.filter_by(username = username).first()


    if room and user:
        user_room = UserRoom.query.filter_by(uid = user.uid, rid = room.rid).first()
        try:
            db.session.delete(user_room)
            db.session.commit()
        except Exception as e:
            print("❌ DB Write Failed:", e)

    leave_room(room.rid)
    emit('left',username, to=room.rid)
    try:
        redis_client.srem(f"online_users:{room.rid}",username)
    except Exception as e:
        print("❌ Redis Remove Failed:", e)
    userList = []
    try:
        userList = list(redis_client.smembers(f"online_users:{room.rid}"))
    except Exception as e:
        print("❌ Redis List Failed:", e)
    emit('user_list', userList ,to=room.rid)



#App Running
if __name__ == '__main__':
    socketio.run(app, port=8080, debug=True)