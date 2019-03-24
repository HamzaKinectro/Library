var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
//graphql
var graphqlHttp = require("express-graphql");
var { buildSchema } = require("graphql");

const Event = require("./models/event");
const User = require("./models/users");
const bcrypt = require("bcrypt");
const events = [];
Books = require("./models/book");

//const checkAuth = require("./middleware/check-auth");
const userRoutes = require("./routes/user");
const genreRoutes = require("./routes/genre");
const bookRoutes = require("./routes/book");

var db = mongoose.connection;
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
//for user Api
app.use("/user", userRoutes);
app.use("/api", genreRoutes);
app.use("/api", bookRoutes);
// fot test purpose
app.get("/", (req, res) => {
  res.send("Test this world");
});

// graphql
app.use(
  "/graphql",
  graphqlHttp({
    schema: buildSchema(`

     type Event{
       _id:ID!
       title:String!
       description:String!
       price:Float!
       date:String!
     } 
     type User {
      _id: ID!
       email:String!
       password:String
     }
     input EventInput{
      title:String!
      description:String!
      price:Float!
      date:String!
     }
     input UserInput{
       email:String!
       password:String!
     }
     type RootQuery {
        events: [Event!]!
     }

     type RootMutation{
        createEvent(eventInput: EventInput):Event
        createUser(userInput: UserInput):User
     }

     schema {
       query: RootQuery
       mutation: RootMutation
     }
    `),
    rootValue: {
      events: () => {
        return Event.find()
          .then(events => {
            return events.map(event => {
              return { ...event._doc, _id: event._doc._id.toString() };
            });
          })
          .catch(err => {
            console.log(err);
          });
      },
      createEvent: args => {
        // var eventName =  args.name;
        // return eventName;
        // const event = {
        //   _id: Math.random.toString(),
        //   title:args.eventInput.title,
        //   description: args.eventInput.description,
        //   price:+args.eventInput.price,
        //   date:new Date().toISOString()
        // }
        console.log("I am here in create event");
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price
        });
        return event
          .save()
          .then(result => {
            console.log(result);
            return { ...result._doc };
          })
          .catch(err => {
            console.log(err);
            throw err;
          });
        // console.log(event);
        // events.push(event);
        // return event;
      },
      createUser: args => {
        console.log(args.userInput.email);
        return User.findOne({ email: args.userInput.email })
          .then(user => {
            if (user) {
              throw new Error("User exists already.");
            }
            return bcrypt.hash(args.userInput.password, 12);
          })
          .then(hashedPassword => {
            const user = new User({
              email: args.userInput.email,
              password: hashedPassword
            });
            console.log(user);
            return user.save();
          })
          .then(result => {
            return { ...result._doc, password: null, _id: result.id };
          })
          .catch(err => {
            throw err;
          });
      }
    },
    graphiql: true
  })
);

mongoose
  .connect(
    `mongodb://Library:${process.env.MONGO_PASSWORD}@ds147125.mlab.com:47125/${
      process.env.MONGO_USER
    }`
  )
  .then(() => {
    app.listen(8080, () => {
      console.log("App is listening at 8080");
    });
  })
  .catch(err => {
    console.log(err);
  });
