# mongoosefiller

  denormalization plugin for mongoose

## Installation

    $ npm install mongoosefiller


## Get started

```js

/**
 * sample schemas
 */

var mongoose = require('mongoose')
  , filler = require('mongoosefiller')
  , Schema = mongoose.Schema;

var UserSchema = new Schema({
  firstname : {type: String},
  lastname  : {type: String},
  email     : {type: String}
});

var User = mongoose.model('User', UserSchema);

var PostSchema = new Schema(
  message: {type: String},
  date   : {type: Date}
});

PostSchema.plugin(filler, {
  model: 'User',
  path: 'user'
})

var Post = mongoose.model('Post', PostSchema);

/**
 * demo
 */

// create a user
User.create({
  firstname : 'pierre',
  lastname  : 'herveou',
  email     : 'myemail@gmail.com'
}, function(err, user) {
  // user post a message
  Post.create({
    user: user.id,
    message: "some message",
    date: Date.now()
  }, function(err, post) {
    // firstname and email are filled
    assert(post.user._id === user._id);
    assert(post.user.firstname === 'pierre');
    assert(post.user.email === 'myemail@gmail.com');

    // user update email
    user.email = 'myotheremail@gmail.com'
    user.save()

    Post.findById(post.id, function(err, post) {
      // email is updated in post
      assert(post.user.email === 'myotheremail@gmail.com');
    });

  });

});





```

## Queue API

### require("queue")

get the default queue instance

### .createQueue(id)

create a new queue with specific id
localstorage keys will be prefixed with queue<id>

### .define(name)

define a new Task with given name

### .on([error complete], function(job) {})

Queue is an event emitter, whenever a job fail or complete
an error or complete event is triggered

## Task Api

### .online()

check that navigator is online before attempting to process job

### .interval(time)

define the interval between two retries (default is '2sec')

### .retry(n)

define max number of retries

### .timeout(time)

define task timeout

### .lifetime(time)

a job expires if it exceeds cration-time + time

### .action(function(job, done))

action to execute receive a job and a callback

## License

  MIT
