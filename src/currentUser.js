import Friendrequest from './friendrequest';
import formurlencoded from 'form-urlencoded';

export default class CurrentUser {
  constructor({user, origin, socket}) {
    Object.assign(this, user);
    this.origin = origin;
    this.socket = socket;
  }

  onFriendRequested(callback) {
    this.socket.on('friend-requested', (friendrequest, ack) => {
      const friendrequestForClient = new Friendrequest({
        friendrequest,
        origin: this.origin,
      });

      callback(friendrequestForClient);
      ack && ack();
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
    })
  }

  onFriendRemoved(callback) {
    this.socket.on('friend-removed', (friendId) => {
      callback(friendId);
    })
  }

  connect() {
    return fetch(`${this.origin}/presences/in`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  disconnect() {
    return fetch(`${this.origin}/presences/out`, {
      credentials: 'include',
    })
  }

  requestFriend(userId) {
    return fetch(`${this.origin}/users/${userId}/friendrequests`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  removeFriend(friendId) {
    const form = formurlencoded({
      behavior: 'remove',
    })

    return fetch(`${this.origin}/users/${this._id}/friends/${friendId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });
  }
}