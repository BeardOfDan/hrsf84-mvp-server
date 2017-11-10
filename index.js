// const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db/index');

const app = express();

const publicFilesPath = __dirname + '/public/';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(publicFilesPath));


const PORT = process.env.PORT || 5000;

app.set('view engine', 'ejs');


// ======================
// ===== GET ROUTES =====
// ======================

app.get('/', /* See if the user is logged in here */(req, res, next) => {
  res.render(publicFilesPath + 'index.html');
});

app.get('/signup', (req, res, next) => {
  res.end('You are at the signup page');
});

app.get('/login', (req, res, next) => {
  res.end('You are at the login page');
});

// get route for any unhandled path
// If the url is on a whitelist, then don't authenticate, else, authenticate user
app.get('*', /*Conditionally Authenticate User Here*/(req, res, next) => {

  // do a db query for a story entry with where the name is the route
  const storyName = req.url.slice(1);

  // if the storyName query returns a result, render the result
  // else display the (below) 404 page code
  db.loadStories(undefined, storyName)
    .then((story) => {
      if ((story !== undefined) && (story !== null)) {
        // render the story

      } else { // there is no story
        res.status(404).redirect('/html/404Page.html');
      }
    });

  // res.status(404).end(`404 page\nThe route ${req.url} is not accounted for\nInsert Gandalf reference here:\n  They're not all acounted for, the lost seeing stones`);
});

// app.use((req, res, next) => {});

// =======================
// ===== POST ROUTES =====
// =======================

app.post('/story', /*Authenticate User Here*/(req, res, next) => {
  // expecting a json on req.body called story
  const story = req.body.story;

  db.save(story, 'Story')
    .then((result) => {
      res.end('Story saved');
    })
    .catch((e) => {
      res.end('Error in saving the story...');
    })
});




app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});

