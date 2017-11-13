// const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db/index');
const querystring = require('querystring');

const app = express();

const publicFilesPath = __dirname + '/public/';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Since this is a backend api, this line is no longer required
// app.use(express.static(publicFilesPath));


const PORT = process.env.PORT || 5000;

app.set('view engine', 'ejs');

// ======================
// ===== GET ROUTES =====
// ======================

// doing a get route without the / handles a no path edge case, this allows for me to set a home page by the url with ease
app.get('', /* See if the user is logged in here */(req, res, next) => {
  console.log('req.url', req.url);
  if ((req.url.length < 1) || (req.url === '/')) {
    // there is no url, so redirect to the client's home page or something
    res
      .append('Access-Control-Allow-Origin', ['*'])
      .end(JSON.stringify({ 'directive': { 'redirect': 'Home' } }));
  } else {
    res
      .append('Access-Control-Allow-Origin', ['*'])
      .end(JSON.stringify({ 'error': 'You have NOT specified any action through the url' }));
  }
});

// app.get('/signup', (req, res, next) => {
//   res.end('You are at the signup page');
// });

// app.get('/login', (req, res, next) => {
//   res.end('You are at the login page');
// });

// get route for any unhandled path
// If the url is on a whitelist, then don't authenticate, else, authenticate user
app.get('*', /*Conditionally Authenticate User Here*/(req, res, next) => {
  // do a db query for a story entry with where the name is the route

  // get the storyName and undo the url encoding
  const storyName = querystring.unescape(req.url.slice(1));

  const specificPaths = ['', '/', 'Home', 'Login', 'Signup'];

  const index = specificPaths.indexOf(storyName);

  // if it is a specific url, then use a particular path
  if (index > -1) {
    if (index < 3) {
      // do a db query to sort stories descending by infoline (it starts with a time/date stamp) then limit it to like 5
      db.loadStories(5) // load the 5 most recent stories
        .then((stories) => {
          const data = { 'stories': stories };
          res.status(200)
            .append('Access-Control-Allow-Origin', ['*'])
            .end(JSON.stringify(data));
        });
    } else {
      res.status(200)
        .append('Access-Control-Allow-Origin', ['*'])
        .end(JSON.stringify({ 'directive': { 'loadImg': 'https://www.commitstrip.com/wp-content/uploads/2017/06/Strip-La-s%C3%A9curit%C3%A9-apr%C3%A8s-tout-english650-final.jpg' } }));
    }

  } else { // do a db query for a matching story
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
  }


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
        res
          .append('Access-Control-Allow-Origin', ['*'])
          .end('Story saved');
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
