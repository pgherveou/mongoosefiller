# mongoosefiller

  denormalization plugin for mongoose

## Installation

    $ npm install mongoosefiller

## Options

```js
options = {
  path: String   // path to property to keep in sync with ref model
  positional: String // positional operator prefix used to update model
  ref : String // reference Model name (the one we copy data from)
  dest: String // destination Model name (the one we copy data to)
  fields: Array // list of fields to copy
}
```

## Example embedded object


```js

/**
 * sample schemas
 */

var mongoose = require('mongoose')
  , filler = require('mongoosefiller')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId;

var UserSchema = new Schema({
  firstname : {type: String},
  lastname  : {type: String},
  email     : {type: String}
});

var User = mongoose.model('User', UserSchema);

var PostSchema = new Schema({
  message: {type: String},
  user: {}
});

var Post = mongoose.model('Post', PostSchema);

// fill path **user** with data from **User**
//update **Post** model every time a change occur
PostSchema.plugin(filler, {
  path: 'user',
  ref : 'User',
  dest: 'Post'
});

// save a user
var user = new User({
  firstname: 'pierre',
  lastname : 'herveou',
  email    : 'myemail@gmail.com'
});

// later save a post

Post.create({
  user: {_id: user.id},
  message: "some message"
}, function(err, post) {

  // user property are set on post doc
  console.log(post.email) // myemail@gmail.com
  console.log(post.firstname) // pierre

  // any update on user will trigger an update on the post doc
});

```

## Example embedded array

```js

var friendSchema = new Schema({
  date: {type: Date}
});

// fill friend with data from **User**
// update **List**  every time a change occur
// use 'friends.$.' positional operator to perform updates
friendSchema.plugin(filler, {
  ref       : 'User',
  dest      : 'List',
  positional: 'friends.$.'
});

var ListSchema = new Schema({
  name: {type: String},
  friends: [friendSchema]
});

List.create({
  name: 'list-1',
  friends: [
    {_id: user.id, date: Date.now()}
  ]
}, function(err, list) {

  // friends property are set on friend sub doc
  console.log(list.friends[0].email) // myemail@gmail.com
  console.log(list.friends[0].firstname) // pierre

  // any update on user will trigger an update on the friend doc
});






```


## License

  MIT
