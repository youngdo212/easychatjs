# EasychatJS
Javascript SDK to build web chat

## Getting Started
1. Sign in to the [easychatJS website](https://easychatjs.com/auth/signin).
    * If you don't have a account yet, sign up [here](https://easychatjs.com/auth/signup).
2. Create a project on the easychatJS dashboard.
3. Copy project's api key.
4. Insert this code directly before closing &lt;body&gt; in your app.
```html
<script src="https://easychatjs.com/sdk/easychat.js"></script>
<script>
  const easychat = new Easychat({
    apiKey: 'PROJECT_API_KEY',
  });
</script>
```
5. That's all it takes to load easychatJS SDK. Build your messenger by using api references below!