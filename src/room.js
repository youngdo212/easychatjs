export default class Room {
  constructor({ room, origin }) {
    Object.assign(this, room);
    this.origin = origin;
  }

  addUser(userId) {
    const data = JSON.stringify({ userId });

    return fetch(`${this.origin}/rooms/${this._id}/users`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    });
  }
}
