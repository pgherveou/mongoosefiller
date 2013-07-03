var mongoose = require('mongoose')
  , filler = require('..')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId;

var mongoose = require('mongoose')
  , filler = require('..')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId;

// connect
mongoose.set('debug', false);

conn = mongoose.connect('mongodb://localhost/mongoosefiller-friends', function (err) {
  if (err) throw err;
});

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


// save a user
var user = new User({
  firstname: 'pierre',
  lastname : 'herveou',
  email    : 'myemail@gmail.com'
});

user.save(function () {
  List.create({
    name: 'list-1',
    friends: [
      {_id: user.id, date: Date.now()}
    ]
  }, function(err, list) {
    console.log(list.friends[0]);
  });
});

