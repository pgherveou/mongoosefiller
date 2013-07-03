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

## Examples

- Embedded array check examples/friends.js
- Embedded doc   check examples/post.js

## Custom Schema event

a `fill` event is triggered on the denormalized schema when the the ref doc change and collection is updated

```js
user.set('name', 'new-name').save();
PostSchema.on('fill', function(user) {

});

```

## perf

I have done a basic test on one doc
- read perfs for with 10 embedded friends: 5ms
- read perfs for with 10 populated friends: 16ms
- read perfs for with 100 embedded friends: 36ms
- read perfs for with 100 populated friends: 67ms
- read perfs for with 1000 embedded friends: 94ms
- read perfs for with 1000 populated friends: 254ms

## License

  MIT
