import io from 'socket.io-client';
import formurlencoded from 'form-urlencoded';
import CurrentUser from './currentUser';

window.Messenger = class {
  constructor({ apiKey }) {
    this.origin = 'http://localhost:3000';
    this.socket = null;
    this.apiKey = apiKey;
  }

  async initializeApp() {
    this.socket = io(this.origin);

    try {
      // set cookie
      const response = await fetch(`${this.origin}/projects/${this.apiKey}`, { credentials: 'include' });

      if (!response.ok) throw new Error('api key incorrect');
      return undefined;
    } catch (error) {
      return error;
    }
  }

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

    try {
      const response1 = await fetch(`${this.origin}/users?field=email&value=${encodedEmail}`, { credentials: 'include' });
      const users = await response1.json();

      if (users.length) throw new Error('this email has already taken');

      return await fetch(`${this.origin}/users`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form,
      });
    } catch (error) {
      return error;
    }
  }

  async signIn(email, password) {
    const form = formurlencoded({
      email,
      password,
    });

    try {
      const response = await fetch(`${this.origin}/users/auth/signin`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form,
      });

      if (!response.ok) throw new Error('wrong email or id');
      return undefined;
    } catch (error) {
      return error;
    }
  }

  // refactoring
  async searchUsers(value, { field } = {}) {
    const encodedValue = encodeURIComponent(value);
    const fields = field ? [field] : ['email', 'nickname'];
    const promises = [];
    let users = null;

    fields.forEach((eachField) => {
      const promise = fetch(`${this.origin}/users?field=${eachField}&value=${encodedValue}`, { credentials: 'include' })
        .then((response) => response.json());

      promises.push(promise);
    });

    users = await Promise.all(promises);
    users = users.flat();

    return users.filter((user, index) => (users.findIndex((e) => e.email === user.email) >= index));
  }
};
