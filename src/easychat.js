import io from 'socket.io-client';
import formurlencoded from 'form-urlencoded';
import CurrentUser from './currentUser';

export default class Easychat {
  constructor({ apiKey }) {
    this.origin =
      process.env.NODE_ENV === 'production'
        ? 'https://3.35.107.126'
        : 'http://localhost:3000';
    this.socket = null;
    this.apiKey = apiKey;
  }

  async initializeApp() {
    this.socket = io(this.origin);

    // set and check cookie
    const response = await fetch(`${this.origin}/projects/${this.apiKey}`, {
      credentials: 'include',
    });

    if (!response.ok) throw new Error('api key incorrect');

    const user = await response.json();

    if (!user) return user;

    const currentUser = new CurrentUser({
      user,
      origin: this.origin,
      socket: this.socket,
    });

    return currentUser;
  }

  // deprecated
  onUserStateChanged(callback) {
    this.socket.on('user-state-changed', (user) => {
      if (!user) {
        callback(null);
        return;
      }

      const currentUser = new CurrentUser({
        user,
        origin: this.origin,
        socket: this.socket,
      });

      callback(currentUser);
    });
  }

  async createUser(email, password, nickname) {
    const encodedEmail = encodeURIComponent(email);
    const form = formurlencoded({
      email,
      password,
      nickname,
    });

    const response1 = await fetch(
      `${this.origin}/users?field=email&value=${encodedEmail}`,
      { credentials: 'include' }
    );
    const users = await response1.json();

    if (users.length) throw new Error('this email has already taken');

    const response2 = await fetch(`${this.origin}/users`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });

    const user = await response2.json();
    const currentUser = new CurrentUser({
      user,
      origin: this.origin,
      socket: this.socket,
    });

    return currentUser;
  }

  async signIn(email, password) {
    const form = formurlencoded({
      email,
      password,
    });

    const response = await fetch(`${this.origin}/users/auth/signin`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });

    if (!response.ok) throw new Error('wrong email or id');

    const user = await response.json();
    const currentUser = new CurrentUser({
      user,
      origin: this.origin,
      socket: this.socket,
    });

    return currentUser;
  }

  async signOut() {
    return fetch(`${this.origin}/users/auth/signout`, {
      credentials: 'include',
    }).then(() => {
      this.socket.off();
    });
  }

  // deprecated
  async searchUsers(value, { field } = {}) {
    const encodedValue = encodeURIComponent(value);
    const fields = field ? [field] : ['email', 'nickname'];
    const promises = [];
    let users = null;

    fields.forEach((eachField) => {
      const promise = fetch(
        `${this.origin}/users?field=${eachField}&value=${encodedValue}`,
        { credentials: 'include' }
      ).then((response) => response.json());

      promises.push(promise);
    });

    users = await Promise.all(promises);
    users = users.flat();

    return users.filter(
      (user, index) => users.findIndex((e) => e.email === user.email) >= index
    );
  }

  async getUsers(field, value) {
    const encodedValue = encodeURIComponent(value);
    return fetch(`${this.origin}/users?field=${field}&value=${encodedValue}`, {
      credentials: 'include',
    }).then((response) => response.json());
  }

  async getRoom(id) {
    const response = await fetch(`${this.origin}/rooms/${id}`, {
      credentials: 'include',
    });
    const room = await response.json();

    return room;
  }
}
