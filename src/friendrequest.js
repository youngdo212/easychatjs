export default class Friendrequest {
  constructor({friendrequest, origin}) {
    Object.assign(this, friendrequest);
    this.origin = origin;
  }

  accept() {
    return fetch(`${this.origin}/friendrequests/${this._id}/accept`, {
      credentials: 'include',
    });
  }

  decline() {
    return fetch(`${this.origin}/friendrequests/${this._id}/decline`, {
      credentials: 'include',
    });
  }
}