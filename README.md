# TinyApp

W2 Project for Lighthouse Labs

## Goal

This four-day project will have you building a web app using Node. The app will allow users to shorten long URLs much like TinyURL.com and bit.ly do.

You will build an HTTP Server that handles requests from the browser (client). Along the way you'll get introduced to some more advanced JavaScript and Node concepts, and you'll also learn more about Express, a web framework which is very popular in the Node community.

## Usage

For TinyApp to run, a `.env` file must be created with a cookie session key configured:

```env
COOKIE_SESSION_KEYS=<YOUR_SECRET_KEY>
```

TinyApp can be started with the command `npm start`, and listens on **port 8080** by default.
