var mongoose = require('mongoose')
  , filler = require('..')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId;

// connect
mongoose.set('debug', false);

conn = mongoose.connect('mongodb://localhost/mongoosefiller-perf', function (err) {
  if (err) throw err;
});


// user
var UserSchema = new Schema({
  firstname: {type: String},
  lastname : {type: String},
  email    : {type: String}
});

var User = mongoose.model('User', UserSchema);

// friend

var friendSchema = new Schema({
  date: {type: Date}
});

friendSchema.plugin(filler, {
  ref : 'User',
  dest: 'List',
  pos : 'friends.$.'
});

// list

var ListSchema = new Schema({
  name: {type: String},
  friends: [friendSchema]
});

var List = mongoose.model('List', ListSchema);

// populate stuffs

// var i = 0
//   , users = []
//   , user = null;

// while (i++ <= 1000) {
//   user = new User({
//     firstname: 'firstname-' + i,
//     lastname: 'lastname-' + i,
//     email: 'name' + i + '@gmail.com'
//   });
//   user.save();
//   users.push(user);
// }

// var friends = users.map(function (u) {
//  return {
//    date: new Date(),
//    _id: u.id
//  };
// });

// setTimeout(function () {
//   list = new List({
//    name: 'list-1',
//    friends: friends
//   }).save();
// }, 2000);


console.time('filled-time');
List.findById('51d45f27cbdddf8aa60003ea', function (err, list) {
  console.timeEnd('filled-time');
});

console.time('populate-time');
List.findById('51d45f27cbdddf8aa60003ea')
  .populate({path: 'friends._id', model: 'User'})
  .exec(function (err, list) {
    console.timeEnd('populate-time');
});

