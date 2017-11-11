// const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db/index');
const querystring = require('querystring');

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
  res
    .append('Access-Control-Allow-Origin', ['*'])
    .render(publicFilesPath + 'index.html');
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

  // get the storyName and undo the url encoding
  const storyName = querystring.unescape(req.url.slice(1));

  // if the storyName query returns a result, render the result
  // else display the (below) 404 page code
  db.loadStories(undefined, storyName)
    .then((story) => {
      if ((story !== undefined) && (story !== null)) {
        db.loadStories(undefined, storyName)
          .then((data) => {
            console.log('The data', JSON.stringify(data, undefined, 2));

            // Since this is just an API for the client side stuff,
            //   the data does not need to be made into a renderable page
            // That will be handled by the client side of this project
            res.status(200)
              .append('Access-Control-Allow-Origin', ['*'])
              .end(JSON.stringify(data));
          })
          .catch((e) => {
            console.log('\nError in the attempt to load a story\n\n', e);
          });

      } else { // there is no story
        console.log('The url "', storyName, '" does not exist!');
        // res.status(404).redirect('/html/404Page.html');
        res.status(404)
          .append('Access-Control-Allow-Origin', ['*'])
          .end(JSON.stringify({ 'error': 'The url "' + storyName + '" does not exist!' }));
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
      if (result.slice(0, 6) !== 'ERROR!') {
        res.end('Story saved');
      } else {
        if (result === 'ERROR! You can\'t make a story without a title!') {
          // throw new Error('There is no title for this story\n\n');
          res
            .append('Access-Control-Allow-Origin', ['*'])
            .end('\n\nError in saving the story...\n  It had no title!\n\n');
        } else {
          // throw new Error('Uncaught Error in POST /story \'s db.save promise chain');
          res
            .append('Access-Control-Allow-Origin', ['*'])
            .end('\n\nError in saving the story...\n');
        }
      }
    })
    .catch((e) => {
      res
        .append('Access-Control-Allow-Origin', ['*'])
        .end('\n\nError in saving the story...\n');
    })
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
