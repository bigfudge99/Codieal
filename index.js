const express = require("express");
const env = require("./config/environment");
const cookieParser = require("cookie-parser");
const app = express();
const port = 8000;
const expressLayouts = require("express-ejs-layouts");
const db = require("./config/mongoose");
// used for session cookie
const session = require("express-session");
const passport = require("passport");
const passportLocal = require("./config/passport-local-strategy");
const jwt = require("./config/passport-jwt-stategy");
const passportGoogle = require("./config/passport-google-oauth2-strategy");

const MongoStore = require("connect-mongo")(session);
const sassMiddleware = require("node-sass-middleware");
const flash = require("connect-flash");
const customMware = require("./config/middleware");

//  sertup chat server to be used with sockets.io
const chatServer = require("http").Server(app);
const chatSockets = require("./config/chat_sockets").chatSockets(chatServer);
chatServer.listen(5000);
console.log("chat server is listening on port 5000");

const path = require("path");

app.use(
  sassMiddleware({
    src: path.join(__dirname, env.asset_path, "scss"),
    dest: path.join(__dirname, env.asset_path, "css"),
    debug: false,
    outputStyle: "extended",
    prefix: "/css",
  })
);

app.use(express.urlencoded());

app.use(cookieParser());

app.use(express.static("./assets"));
// make the uploads path available to the browser
app.use("/uploads", express.static(__dirname + "/uploads"));

app.use(expressLayouts);
// extract style ans scripts from sub pages into the layout
app.set("layout extractStyles", true);
app.set("layout extractScripts", true);

// set up the view engine
app.set("view engine", "ejs");
app.set("views", "./views");

// mongo store is used to store the session cookie in the db
app.use(
  session({
    name: env.session_cookie_key,
    // TODO change the secret before deployment in production mode
    secret: "something",
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 1000 * 60 * 100,
    },
    store: new MongoStore( // session will get permanantly stored
      {
        // dont need to login again if the server is restarted
        mongooseConnection: db,
        autoRemove: "disabled",
      },
      function (err) {
        console.log(err || "connect-mongoDb setup is ok");
      }
    ),
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(passport.setAuthenticatedUser); //called as a middleware

// to be use below session beacause flash uses session cookie
app.use(flash());
app.use(customMware.setFlash);

// use express router
app.use("/", require("./routes/index"));

app.listen(port, function (err) {
  if (err) {
    console.log(`Error in running the server: ${err}`);
  }

  console.log(`Server is running on port: ${port}`);
});
