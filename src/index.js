import io from 'socket.io-client';

window.Messenger = class {
  constructor({apiKey}) {
    this.origin = 'http://localhost:3000'
    this.apiKey = apiKey;
    this.socket = io(this.origin);
  }

  onUserStateChanged(callback) {

  }

  createUser(email, password) {
    return new Promise((resolve, reject) => {

    });
  }

  signIn(email, password) {

  }
}