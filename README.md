# EasychatJS
Javascript SDK to build web chat

## Table of Contents
* [Getting Started](#getting-started)
* [API Reference](#api-reference)
  * [Easychat](#easychat)

## Getting Started
1. Sign in to the [easychatJS website](https://easychatjs.com/auth/signin).
    * If you don't have a account yet, sign up [here](https://easychatjs.com/auth/signup).
2. Create a project on the easychatJS dashboard.
3. Copy project's api key.
4. Insert this code directly before closing &lt;body&gt; tag in your app.
```html
<script src="https://easychatjs.com/sdk/easychat.js"></script>
<script>
  const easychat = new Easychat({
    apiKey: 'PROJECT_API_KEY',
  });

  easychat.initializeApp().catch((error) => {
    console.log(error);
  })
</script>
```
5. That's all it takes to load easychatJS SDK. Build your messenger by using api references below!

## API Reference
### Easychat
To get started with easychat, you should instantiate `Easychat` instance. When instantiating, project api key is required.
```javascript
const easychat = new Easychat({
  apiKey: 'PROJECT_API_KEY',
});
```
#### methods
**constructor**
```javascript
new Easychat(options)
```
Creates new easychat instance.

*arguments*
* options
    * options.apiKey: String - project api key

**easychat.initializeApp()**
```javascript
easychat.initializeApp()
  .then((currentUser) => {
    if(!currentUser) ...
  })
  .catch((error) => {
    ...
  })
```
Finds project by using api key and initialize easychat with found project asynchronously. It returns pending promise. When api key is correct, the promise is fulfilled with value(currentUser or null). If browser has cookie including logined user information, currentUser is supplied. This is useful for page reload. When api key is not correct, the promise is rejected with error object including message.

*returns*
* Promise
  * resolve([currentUser])
  * reject(error)

**easychat.createUser(email, password, nickname)**
```javascript
easychat.createUser(email, password, nickname)
  .then((currentUser) => {
    ...
  })
  .catch((error) => {
    ...
  })
```
Creates user to use with easychat service. It returns pending promise. When user is created successfully, the promise is fulfilled with currentUser. Otherwise, it is rejected with error.

*arguments*
* email: String - unique string value
* password: String
* nickname: String

*returns*
* Promise
  * resolve(currentUser)
  * reject(error)

**easychat.signIn(email, password)**
```javascript
easychat.signIn(email, password)
  .then((currentUser) => {
    ...
  })
  .catch((error) => {
    ...
  })
```
Signs in existing user. It returns pending promise. When signing in correctly, the promise is fulfilled with currentUser. Otherwise, it is rejected with error including some reason.

*arguments*
* email: String
* password: String

*returns*
* Promise
  * resolve(currentUser)
  * reject(error)

**easychat.signOut()**
```javascript
easychat.signOut()
  .catch((error) => {
    ...
  })
```

Signs out current user.

*returns*
* Promise
  * reject(error)

**easychat.getUsers(field, value)**
```javascript
easychat.getUsers(field, value)
  .then((users) => {
    ...
  })
  .catch((error) => {
    ...
  })
```
Finds users with field-value pair. Make sure that you can't use other values to field argument except 'email' or 'nickname'

*arguments*
* field: String - 'email' | 'nickname'
* value: String|RegExp

*returns*
* Promise
  * resolve(users): array of User
  * reject(error)

**easychat.getRoom(id)**
```javascript
easychat.getRoom(id)
  .then((room) => {
    ...
  })
  .catch((error) => {

  })
```
Finds room with room id. If it fails to find room with id, a promise is fulfilled with undefined.

*arguments*
* id: String - room id

*returns*
* Promise
  * resolve(room)
  * reject(error)