# TinyApp

Week 2 Project for Lighthouse Labs

---

TinyApp is a (nearly) full-stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

![Screenshot of urls page](https://github.com/zixialu/tinyapp/blob/master/docs/urls-page.png?raw=true)
![Screenshot of urls/:id page](https://github.com/zixialu/tinyapp/blob/master/docs/urls-show-page.png?raw=true)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- dateformat
- dotenv
- method-override

## Getting Started

1. Install all dependencies using `npm install`

2. Create a `.env` file in the root directory with a cookie session key configured. This string will be used to encrypt users' cookies. The key should be in the following form:

   ```env
   COOKIE_SESSION_KEY=<YOUR_SECRET_KEY>
   ```

3. Start TinyApp with the command `node express-server.js`. TinyApp listens on **port 8080** by default.

## Project Goal

> This four-day project will have you building a web app using Node. The app will allow users to shorten long URLs much like TinyURL.com and bit.ly do.
>
> You will build an HTTP Server that handles requests from the browser (client). Along the way you'll get introduced to some more advanced JavaScript and Node concepts, and you'll also learn more about Express, a web framework which is very popular in the Node community.
