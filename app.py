from datetime import datetime
import os
from flask import Flask, redirect, render_template, request
from flask_socketio import SocketIO, emit, leave_room, send, join_room
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
socketio = SocketIO(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Users(db.Model):
    
    __tablename__ = "Users"

    uid = db.Column(db.String, primary_key = True)
    username = db.Column(db.String, nullable = False, unique = True)

    def __repr__(self):
        return f"<User {self.username}>"
    
class Rooms(db.Model):
    
    __tablename__ = "Rooms"

    rid = db.Column(db.String, primary_key = True)
    roomname = db.Column(db.String, nullable = False, unique = True)

    def __repr__(self):
        return f"<User {self.roomname}>"
    
class UserRoom(db.Model):
    
    __tablename__ = "UserRoom"

    uid = db.Column(db.String, db.ForeignKey('Users.uid'), primary_key = True)
    rid = db.Column(db.String, db.ForeignKey('Rooms.rid'), primary_key = True)
    
class Messages(db.Model):
    
    __tablename__ = "Messages"

    mid = db.Column(db.String, primary_key = True)
    uid = db.Column(db.String, db.ForeignKey('Users.uid'), nullable = False)
    rid = db.Column(db.String, db.ForeignKey('Rooms.rid'), nullable = False)
    message = db.Column(db.String, nullable = False)
    timestamp = db.Column(db.DateTime, default = datetime.utcnow, nullable = False)

    user = db.relationship('Users', backref='messages')
    room = db.relationship('Rooms', backref='messages')

    def __repr__(self):
        return f"<Message {self.message} from user {self.uid} in room {self.rid}>"
    
@app.route("/init-db")
def init_db():
    db.create_all()
    return "DB initialized"

@app.route('/', methods = ['GET','POST'])
def start():
    if request.method=='POST':
        return redirect('/chat')
    return render_template("join.html")

@app.route('/chat')
def chat():
    return render_template("chat.html")


@socketio.on('message')
def get_message(data):
    uid = Users.query.filter_by(username = data["username"]).first().uid
    rid = Rooms.query.filter_by(roomname = data["roomname"]).first().rid
    msg = data["text"]
    
    new_msg = Messages(mid = 'MID'+ str(Messages.query.count() + 1), uid = uid, rid = rid, timestamp = datetime.utcnow(), message = msg)
    db.session.add(new_msg)
    db.session.commit()
    
    send(data, to=rid)


@socketio.on('join')
def join(data):
    roomname = data["roomname"]
    username = data["username"]

    room = Rooms.query.filter_by(roomname=roomname).first()

    if not room:
        new_room = Rooms(rid = 'RID' + str(Rooms.query.count() + 1), roomname = roomname)
        db.session.add(new_room)
        db.session.commit()
        room = new_room

    user = Users.query.filter_by(username = username).first()
    if not user:
        new_user = Users(uid = 'UID' + str(Users.query.count() + 1), username = username)
        db.session.add(new_user)
        db.session.commit()
        user = new_user

    new = False
    if not UserRoom.query.filter_by(rid = room.rid, uid = user.uid).first():
        user_room = UserRoom(uid = user.uid, rid = room.rid)
        db.session.add(user_room)
        db.session.commit()
        new = True

    join_room(room.rid)

    messages = Messages.query.filter_by(rid = room.rid).order_by(Messages.timestamp).all()
    msg_data = [{
                    "username": Users.query.get(msg.uid).username,
                    "text": msg.message,
                    } for msg in messages]

    emit('load_msg',msg_data, to=request.sid)


    if(new):
        emit('join',username, to=room.rid)
    user_in_room = UserRoom.query.filter_by(rid = room.rid).all()    
    userList = [Users.query.get(user.uid).username for user in user_in_room]
    emit('user_list', userList ,to=room.rid)

@socketio.on('left')
def left(data):
    roomname = data["roomname"]
    username = data["username"]

    room = Rooms.query.filter_by(roomname = roomname).first()
    user = Users.query.filter_by(username = username).first()


    if room and user:
        user_room = UserRoom.query.filter_by(uid = user.uid, rid = room.rid).first()
        db.session.delete(user_room)
        db.session.commit()
    
    leave_room(room.rid)
    emit('left',username, to=room.rid)

    user_in_room = UserRoom.query.filter_by(rid = room.rid).all()
    userList = [Users.query.get(user.uid).username for user in user_in_room]

    emit('user_list', userList ,to=room.rid)


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8080, debug=True)