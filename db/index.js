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
  userId: { type: Number, unique: true, dropDups: true },
  comments: Array, // reference to the comments schema
  level: String // standard user or admin
});

const storySchema = mongoose.Schema({
  title: String,
  storyId: { type: Number, unique: true, dropDups: true },
  date: { type: Date, default: Date.now },
  infoLine: String, // Date/Time stamp and comments count
  images: Array,
  story: String,
  comments: Array // reference to the comments schema
});

const commentsSchema = mongoose.Schema({
  storyId: { type: Number, unique: true, dropDups: true },
  comments: Array // an array of objects with the comment message, username, time-date stamp, and a commentId
});

const User = mongoose.model('User', userSchema); // a single user
const Story = mongoose.model('Story', storySchema); // a single story
const Comments = mongoose.model('Comments', commentsSchema); // the comments for a single story

const newModel = (data, type) => {
  if (type === 'Story') {
    return new Story(data);
  } else if (type === 'User') {
    return new User(data);
  } else if (type === 'Comments') {
    return new Comments(data);
  } else {
    console.log('\n\nERROR: Not set up to handle a model of type', type, '\n\n');
    return 'Unknown Type ' + type;
  }
};

// a generic save function, for use with either model type
// returns a promise
const save = (data, modelType = 'Story') => {
  const arr = [];

  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      arr.push(newModel(data[i], modelType));
    }
  } else {
    arr.push(newModel(data, modelType));
  }

  const savePromises = arr.map((model) => {
    return model.save()
      .then(function (model) {
        console.log(`The ${modelType} model ${model.name} of type was saved`);
      })
      .catch((e) => {
        console.log('\nError:\n', e, '\n\n');
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
    // do a query with .limit(count)
    return Story.find().limit(count).exec()
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
    cb('\nUnhandled situation in loadStories\nNOTE: This should be impossible to reach!\n');
  }
  return handler;
};

module.exports = { save, loadStories };



