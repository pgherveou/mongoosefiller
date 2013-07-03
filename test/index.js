var mongoose = require('mongoose')
  , filler = require('..')
  , expect = require('chai').expect
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId;

/**
 * connect db
 */

mongoose.set('debug', true);
mongoose.connect('mongodb://localhost/mongoosefiller', function (err) {
  if (err) throw err;
});

/**
 * User schema
 */

var UserSchema = new Schema({
  firstname : {type: String},
  lastname  : {type: String},
  email     : {type: String}
});

var User = mongoose.model('User', UserSchema);

/**
 * Post schema
 */

var PostSchema = new Schema({
  message: {type: String},
  user: {
    _id: {type: ObjectId, ref: 'User'}
  }
});

var Post = mongoose.model('Post', PostSchema);

/**
 * Apply plugin
 */

PostSchema.plugin(filler, {
  path: 'user',
  src : 'User',
  dest: 'Post'
});

var user, post;

describe('mongoosefiller', function() {

  before(function (done) {
    user = new User({
      firstname : 'pierre',
      lastname  : 'herveou',
      email     : 'myemail@gmail.com'
    });
    user.save(done);
  });

  // after(function (done) {
  //   User.remove(function() {
  //     Post.remove(function () {
  //       mongoose.disconnect();
  //     });
  //   });
  // });

  it('should populate post.user', function (done) {
    post = new Post({
      user: {_id: user.id},
      message: "some message"
    });
    post.save(function() {
      expect(post.user).to.be.an('object');
      expect(post.user.email).to.eq(user.email);
      expect(post.user.firstname).to.eq(user.firstname);
      done();
    });
  });

  it('should update post when user is updated', function () {
    user.email = 'myotheremail@gmail.com';
    user.save(function () {

      Post.findbyId(post.id, function (err, post) {
        expect(post.user.email).to.eq(user.email);
        done();
      });

    });

  });


});


