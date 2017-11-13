const mongoose = require('mongoose');
const Promise = require('bluebird');

// set mongoose's promise library
mongoose.Promise = Promise;

// The default url only works on local machines
let connectionURL = 'mongodb://localhost/mvp';

if ((process.env.DBPLACE !== undefined) && (process.env.DBPLACE !== null)) {
  // mongodb url format
  // mongodb://your_user_namer:your_password@ds119748.mlab.com:19748/local_library

  const logInCredentials = process.env.DBUSERNAME + ':' + process.env.DBPASSWORD + '@';
  connectionURL = 'mongodb://' + logInCredentials + process.env.DBPLACE;
}

// added , { useMongoClient: true } to get rid of a deprication warning for mongoose.open
mongoose.connect(connectionURL, { useMongoClient: true });

// ===================
// ===== Schemas =====
// ===================

const userSchema = mongoose.Schema({
  username: String,
  userId: { type: String, unique: true, dropDups: true },
  comments: Array, // reference to the comments schema
  level: String, // standard user or admin
  jstArr: Array // the JWTs for a user
});

const storySchema = mongoose.Schema({
  title: { type: String, unique: true, dropDups: true },
  storyId: { type: String, unique: true, dropDups: true },
  date: { type: String, default: Date.now() },
  infoLine: String, // Date/Time stamp and comments count
  images: Array,
  story: String,
  comments: Array // reference to the comments schema
});

const commentsSchema = mongoose.Schema({
  storyId: { type: String, unique: true, dropDups: true },
  comments: Array // an array of objects with the comment message, username, time-date stamp, and a commentId
});

// ==================
// ===== Models =====
// ==================

const User = mongoose.model('User', userSchema); // a single user
const Story = mongoose.model('Story', storySchema); // a single story
const Comments = mongoose.model('Comments', commentsSchema); // the comments for a single story

// ============================
// ===== Helper Functions =====
// ============================

// Error handling helper function
// if I need to stop a promise chain, without throwing an error,
//   (which seems to randomly break the program. Not sure why...)
// then return an object with a then property with a value of a call to this function
const errorMessageFunction = function (message) {
  // returns a function to act in the place of a .then call in the promise chain
  return function (cb) {
    cb(message);
    return { // returns a function to act in place of the .catch call in the promise chain
      'catch': function (cb) {
        cb('You had an error!');
      }
      // NOTE: if further catch blocks are encountered, I will have to add a helper function
      //   to pseudo-recursively generate functions with .then methods (and a .catch method too)
      // But for now, it is fine as is
    };
  };
};

// a mutative helper function that creates/updates the infoLine property of the input story
const createStoryInfoLine = (story) => {
  if ((story !== undefined) && (story !== null)) {
    story.infoLine = `${story.date}  |  Comments: ${story.comments.length}`;
  }
};

// a helper function to add the remaining fields to complete a story
const makeAStory = (story) => {
  if ((story !== undefined) && (story !== null)) {
    // give default values and validate the existing properties
    story.images = story.images || [];

    story.story = story.story || '';

    if ((story.images.length < 1) && (story.story.length < 1)) {
      // there is nothing but a title here!
      // throw the appropriate error here
    }

    // Insert these on the server
    // "storyId": { type: Number, unique: true, dropDups: true },
    // "date": { type: Date, default: Date.now },
    story.storyId = mongoose.Types.ObjectId();
    story.date = Date();

    // this will be blank initially, but will be populated when the model instance is updated
    // "comments": Array // reference to the comments schema
    story.comments = [];

    // construct this based off of the new fields
    // "infoLine": String, // Date/Time stamp and comments count
    createStoryInfoLine(story);
  } else {
    console.log('ERROR in makeAStory');
  }

  return story;
}

// this is a helper function to create a new model instance of the correct type
const newModel = (data, type) => {
  if (type === 'Story') {
    return new Story(makeAStory(data));
  } else if (type === 'User') {
    return new User(data);
  } else if (type === 'Comments') {
    return new Comments(data);
  } else {
    console.log('\n\nERROR: Not set up to handle a model of type', type, '\n\n');
    return 'Unknown Type ' + type;
  }
};

// a helper function to display an unique output message for the particular type of model
const differentModelsSaveMessages = (model) => {
  const type = model.constructor.modelName;
  if (type === 'Story') {
    console.log(`The ${type} model '${model.title}' was saved`);
  } else {
    console.log(`The ${type} model was saved`);
  }
};

// ==============================
// ===== Exported Functions =====
// ==============================

// this function updates an existing story
// add comments with this function
//   update the story's infoLine field also
const updateStory = () => {
  // TODO: write this function
};

// a generic save function, for use with either model type
// returns a promise
const save = (data, modelType = 'Story') => {
  const arr = [];

  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      if ((data[i].constructor.modelName === 'Story') && (data[i].title.length < 1)) {
        console.log('You can\'t make a story without a title!');
        continue;
      }

      arr.push(newModel(data[i], modelType));
    }

    if ((arr.length < 1) && (data.length > 0)) {
      return {
        'then': errorMessageFunction('ERROR! You can\'t make a story without a title!')
      };
    }

  } else {
    if ((modelType === 'Story') && (data.title.length < 1)) {
      console.log('You can\'t make a story without a title!');
      return {
        'then': errorMessageFunction('ERROR! You can\'t make a story without a title!')
      };
    } else {
      arr.push(newModel(data, modelType));
    }
  }

  const savePromises = arr.map((model) => {
    return model.save()
      .then(function (model) {
        differentModelsSaveMessages(model);
      })
      .catch((e) => {
        if (e.MongoError.slice(0, 26) === 'E11000 duplicate key error') {
          console.log('Did not save this story because another story with the same title already exists');
        } else {
          console.log('\nError:\n', e, '\n\n');
        }
      });
  });

  // Promise.all makes sure that all of the save promises are fulfilled before
  //   executing the next promise in the chain
  return Promise.all(savePromises);
}; // end of save(model, modelType);

// a function to load stories
const loadStories = (count, name) => {
  // at the start, only implement the no argument version of this function
  if (count !== undefined) {
    // do a query for the most recent stories with .limit(count)
    return Story.find().sort({ 'infoLine': -1 }).limit(count).exec()
      .catch((e) => {
        console.log('\nError in loadstories if case\n', e);
      })
  } else if (name !== undefined) {
    // do a query to get a story with this name
    return Story.findOne({ title: name }).exec()
      .catch((e) => {
        console.log('\nError in loadstories else if case\n', e);
      });
  } else {
    // do a query for all stories
    return Story.find().exec()
      .catch((e) => {
        console.log('\nError in loadStories else case\n', e);
      });
  }

  const handler = {};
  handler.then = function (cb) {
    console.log('\n\nYou found a MAJOR Error in loadStories\n\n');
    cb('\nUnhandled situation in loadStories\nNOTE: This should be impossible to reach!\n');
  }
  return handler;
};

const loadAllStories = () => {
  // do a query for the most recent stories with .limit(count)
  return Story.find().sort({ 'infoLine': -1 }).exec()
    .catch((e) => {
      console.log('\nError in loadstories if case\n', e);
    });
};

module.exports = { save, loadStories, updateStory, loadAllStories };



