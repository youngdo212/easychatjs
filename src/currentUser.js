import formurlencoded from 'form-urlencoded';
import Room from './room';

export default class CurrentUser {
  constructor({ user, origin, socket }) {
    Object.assign(this, user);
    this.origin = origin;
    this.socket = socket;
    this.openedRoom = {};
  }

  onFriendRequested(callback) {
    this.socket.on('friend-requested', (friendrequest) => {
      callback(friendrequest);
    });
  }

  onFriendAdded(callback) {
    this.socket.on('friend-added', (friend, ack) => {
      callback(friend);
      ack && ack();
    });
  }

  onFriendPresenceChanged(callback) {
    this.socket.on('friend-presence-changed', (user) => {
      callback(user);
    });
  }

  onFriendRemoved(callback) {
    this.socket.on('friend-removed', (friend) => {
      callback(friend);
    });
  }

  onRoomAdded(callback) {
    this.socket.on('room-added', (room, ack) => {
      const roomForClient = new Room({
        room,
        origin: this.origin,
      });

      callback(roomForClient);
      ack && ack();
    });
  }

  onMessage(callback) {
    this.socket.on('message', (message, ack) => {
      const openedRoom = this.openedRoom[message.room._id];

      if (!openedRoom) {
        callback(message);
        return;
      }

      openedRoom.onMessage(message);
      ack && ack();
    });
  }

  onRoomRemoved(callback) {
    this.socket.on('room-removed', (room) => {
      callback(room);
    });
  }

  onRoomUpdated(callback) {
    this.socket.on('room-updated', (room) => {
      const roomForClient = new Room({
        room,
        origin: this.origin,
      });
      const openedRoom = this.openedRoom[room._id];

      if (openedRoom) openedRoom.onUpdate(roomForClient);
      callback(roomForClient);
    });
  }

  requestFriend(userId) {
    return fetch(`${this.origin}/users/${userId}/friendrequests`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  responseFriendrequest(id, answer) {
    return fetch(`${this.origin}/friendrequests/${id}/${answer}`, {
      credentials: 'include',
    });
  }

  removeFriend(friendId) {
    return fetch(`${this.origin}/users/${this._id}/friends/${friendId}/remove`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  createRoom(roomOptions) {
    const data = JSON.stringify(roomOptions);

    return fetch(`${this.origin}/rooms`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    });
  }

  sendMessage({ room, text }) {
    const body = formurlencoded({
      text,
    });

    return fetch(`${this.origin}/rooms/${room._id}/messages`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  }

  openRoom(room, hooks) {
    const roomWithHooks = { ...room, ...hooks };

    this.openedRoom[room._id] = roomWithHooks;
    return fetch(`${this.origin}/rooms/${room._id}/messages`, {
      credentials: 'include',
    });
  }

  closeRoom(room) {
    room && delete this.openedRoom[room._id];
  }

  leaveRoom(room) {
    return fetch(`${this.origin}/users/${this._id}/rooms/${room._id}/leave`, {
      method: 'POST',
      credentials: 'include',
    });
  }
}
