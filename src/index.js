import io from 'socket.io-client';
import formurlencoded from 'form-urlencoded';
import CurrentUser from './currentUser';

window.Messenger = class {
  constructor({apiKey}) {
    this.origin = 'http://localhost:3000'
    this.socket = null;
    this.apiKey = apiKey;
  }
  
  async initializeApp() {
    this.socket = io(this.origin);

    try {
      // set cookie
      const response = await fetch(`${this.origin}/projects/${this.apiKey}`, {credentials: 'include'});

      if(!response.ok) throw new Error('api key incorrect');

    } catch(error) {
      return Promise.reject(error);
    }
  }

  onUserStateChanged(callback) {
    this.socket.on('user-state-changed', (user) => {
      if(!user) return callback(null);
      
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
      const response1 = await fetch(`${this.origin}/users?field=email&value=${encodedEmail}`, {credentials: 'include'});
      const users = await response1.json();

      if(users.length) throw new Error('this email has already taken');

      const response2 = await fetch(`${this.origin}/users`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form,
      });
    } catch (error) {
      return Promise.reject(error);
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

      if(!response.ok) throw new Error('wrong email or id');

    } catch (error) {
      return Promise.reject(error);
    }
  }

  // refactoring
  async searchUsers(value, {field} = {}) {
    const encodedValue = encodeURIComponent(value);
    const fields = field ? [field] : ['email', 'nickname'];
    const users = [];

    for(let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const response = await fetch(`${this.origin}/users?field=${field}&value=${encodedValue}`, {credentials: 'include'});
      const json = await response.json();

      this.pushWithoutDuplication(users, json);
    }
    
    return users;
  }

  // refactoring
  pushWithoutDuplication(sources, targets) {
    const corrects = [];

    targets.forEach((target) => {
      if(sources.some((source) => source.email === target.email)) return;

      corrects.push(target);
    });

    sources.push(...corrects);
  }

  getUser(id) {

  }
}