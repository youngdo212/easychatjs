import formurlencoded from 'form-urlencoded';
import Room from './room';

export default class CurrentUser {
  constructor({ user, origin, socket }) {
    Object.assign(this, user);
    this.origin = origin;
    this.socket = socket;
    this.openedRooms = {};
  }

  onFriendRequested(callback) {
    this.socket.on('friend-requested', (friendrequest) => {
      callback(friendrequest);
    });
  }

  onFriendAdded(callback) {
    this.socket.on('friend-added', (friend) => {
      callback(friend);
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
      const openedRoom = this.openedRooms[message.room._id];

      if (!openedRoom) {
        callback(message);
        return;
      }

      openedRoom.hooks.onMessage(message);
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
      // const openedRoom = this.openedRooms[room._id];

      // if (openedRoom) openedRoom.hooks.onUpdate(roomForClient);
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

  /**
   * @param {Object} [sortOption]
   * @param {string} [sortOption.email] 'asc' | 'desc'
   * @param {string} [sortOption.nickname] 'asc' | 'desc'
   * @param {string} [sortOption.isPresent] 'asc' | 'desc'
   */
  async getFriends(sortOption) {
    const response = await fetch(`${this.origin}/users/${this._id}/friends`, { credentials: 'include' });
    const friends = await response.json();

    if (!sortOption) return friends;

    const [sortEntry] = Object.entries(sortOption);
    const [property, order] = sortEntry;

    return friends.sort((a, b) => (order === 'asc' ? a[property] - b[property] : b[property] - a[property]));
  }

  /**
   * get current user's rooms
   */
  async getRooms() {
    const response = await fetch(`${this.origin}/users/${this._id}/rooms`, { credentials: 'include' });
    const rooms = await response.json();

    rooms.sort((roomA, roomB) => new Date(roomB.updatedAt) - new Date(roomA.updatedAt));

    return rooms;
  }

  removeFriend(friendId) {
    return fetch(`${this.origin}/users/${this._id}/friends/${friendId}/remove`, {
      method: 'POST',
      credentials: 'include',
    }).then((response) => response.json());
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
    }).then((response) => response.json());
  }

  sendMessage({ roomId, text }) {
    const body = formurlencoded({
      text,
    });

    return fetch(`${this.origin}/rooms/${roomId}/messages`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  }

  openRoom({ roomId, hooks }) {
    this.openedRooms[roomId] = {
      id: roomId,
      hooks,
    };

    return fetch(`${this.origin}/users/${this._id}/rooms/${roomId}/open`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  closeRoom(roomId) {
    roomId && delete this.openedRooms[roomId];
  }

  leaveRoom(roomId) {
    return fetch(`${this.origin}/users/${this._id}/rooms/${roomId}/leave`, {
      method: 'POST',
      credentials: 'include',
    });
  }
}
