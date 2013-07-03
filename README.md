# mongoosefiller

denormalization plugin for mongoose

This plugins helps you create denormalized schemas by copying references from other collection and keeping them up to date.

Just like model.populate except that data is stored in the collection instead of being populated for each query

## Installation

    $ npm install mongoosefiller

## Plugin options

```js
// plugin options
options = {
  path:   String // (optional default to '') path to property to keep in sync with ref model
  pos:    String // (optional) pos operator prefix used to update model in collection array
  ref :   String // reference Model name (the one we copy data from)
  dest:   String // destination Model name (the one we copy data to)
  select: String // (optional default to all) list of fields separated by space to embed
}
```

```js
// examples

var UserSchema = new Schema({
  firstname: {type: String},
  lastname : {type: String},
  email    : {type: String}
});

var PostSchema = new Schema({
  message: {type: String}
});

// add user.firstname, user.lastname, user.email path to schema
// fill user.* with data from User
// update documents every time a change occur in User
PostSchema.plugin(filler, {
  path: 'user',
  ref : 'User',
  dest: 'Post'
});

friendSchema = new Schema({
  date: {type: Date}
});

ListSchema = new Schema({
  name: {type: String},
  friends: [friendSchema]
});

// add firstname, lastname path to schema
// fill friends with data from User
// update friends in List (using positional operator List.friends.$._id)
// every time a change occur in User
friendSchema.plugin(filler, {
  ref   : 'User',
  dest  : 'List',
  pos   : 'friends.$.',
  select: 'firstname lastname'
});

```

## Event fill

a fill event is triggered on the denormalized schema when the the ref doc change and collection is updated

```js
user.set('name', 'new-name').save();
PostSchema.on('fill', function(user) {

});

```

## Example embedded object


```js

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
  message: {type: String}
});

var Post = mongoose.model('Post', PostSchema);

// fill path user with data from User, update Post model every time a change occur
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
  console.log(post.user.email) // myemail@gmail.com
  console.log(post.user.firstname) // pierre
});

// later update user
user.set('email', 'otheremail').save()

// post.user.email is also updated

```

## Example embedded array

```js

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

var friendSchema = new Schema({
  date: {type: Date}
});

// fill friend with data from User, update List  every time a change occur,
// use 'friends.$.' pos operator to perform updates
friendSchema.plugin(filler, {
  ref : 'User',
  dest: 'List',
  pos : 'friends.$.'
});

var ListSchema = new Schema({
  name: {type: String},
  friends: [friendSchema]
});

var List = mongoose.model('List', ListSchema);

List.create({
  name: 'list-1',
  friends: [
    {_id: user.id, date: Date.now()}
  ]
}, function(err, list) {

  // friends property are set on friend sub doc
  console.log(list.friends[0].email) // myemail@gmail.com
  console.log(list.friends[0].firstname) // pierre
});

```
## perf

I have done a basic test on a list of friends with 1000 embedded users
- read perfs for 1 one doc filled collection: 94ms
- read perfs for 1 one doc using populate   : 254ms

## License

  MIT
