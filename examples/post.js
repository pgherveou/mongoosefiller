var mongoose = require('mongoose')
  , filler = require('..')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId;

// connect
mongoose.set('debug', true);

conn = mongoose.connect('mongodb://localhost/mongoosefiller-post', function (err) {
  if (err) throw err;
});

var UserSchema = new Schema({
  firstname: {type: String},
  lastname : {type: String},
  email    : {type: String},
  pictures : {
    50: {type: String},
    100: {type: String}
  }
});

var User = mongoose.model('User', UserSchema);

var PostSchema = new Schema({
  message: {type: String}
});

PostSchema.plugin(filler, {
  path: 'user',
  ref : 'User',
  dest: 'Post'
});

var Post = mongoose.model('Post', PostSchema);

// save a user
var user = new User({
  firstname: 'pierre',
  lastname : 'herveou',
  email    : 'myemail@gmail.com',
  pictures : {
    50: 'pic-50.jpg',
    100: 'pic-100.jpg'
  }
});

user.save(function () {
  Post.create({
    user: {_id: user.id},
    message: "some message"
  }, function(err, post) {
    console.log("saved: ", post);
    console.log(post.user.id);
  });
});



