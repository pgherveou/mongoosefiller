var mongoose = require('mongoose')
  , filler = require('..')
  , expect = require('chai').expect
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId;

// mongoose.set('debug', true);

/**
 * connect db
 */

// mongoose.set('debug', true);
conn = mongoose.connect('mongodb://localhost/mongoosefiller', function (err) {
  if (err) throw err;
});

/**
 * User schema
 */

var UserSchema = new Schema({
  firstname : {type: String},
  lastname  : {type: String},
  email     : {type: String},
  avatar    : {type: String}
});

var User = mongoose.model('User', UserSchema);

/**
 * Post schema
 */

var PostSchema = new Schema({
  message: {type: String}
});

PostSchema.plugin(filler, {
  path: 'user',
  ref : 'User',
  dest: 'Post',
  sync: '-avatar'
});

var Post = mongoose.model('Post', PostSchema);


/**
 * friend schema
 */

var friendSchema = new Schema({
  date: {type: Date}
});

friendSchema.plugin(filler, {
  ref : 'User',
  dest: 'List',
  pos : 'friends.$.',
  select: 'firstname email'
});

/**
 * list schema
 */

var ListSchema = new Schema({
  name: {type: String},
  friends: [friendSchema]
});

var List = mongoose.model('List', ListSchema);

var list, user, post;

describe('mongoosefiller', function() {

  before(function (done) {
    user = new User({
      firstname: 'pierre',
      lastname : 'herveou',
      email    : 'myemail@gmail.com',
      avatar   : 'avatar1.png'
    });
    user.save(done);
  });

  after(function (done) {
    conn.connection.db.dropDatabase(done);
  });

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

  it('should update post when user is updated', function (done) {
    user.email = 'myotheremail@gmail.com';
    user.save();
    PostSchema.once('fill', function () {
      Post.findById(post.id, function (err, post) {
        expect(err).to.be.ko;
        expect(post.user).to.be.an('object');
        expect(post.user.email).to.eq(user.email);
        done();
      });
    });
  });

  it('should populate list.friends', function (done) {
    list = new List({
      name: 'list-1',
      friends: [
        {_id: user.id, date: Date.now()}
      ]
    });

    list.save(function (err) {
      expect(err).to.be.ko;
      expect(list.friends[0]).to.be.ok;
      expect(list.friends[0].email).to.eq(user.email);
      expect(list.friends[0].firstname).to.eq(user.firstname);
      done();
    });
  });

  it('should update post when user is updated', function (done) {
    user.email = 'mythirdemail@gmail.com';
    user.save();

    friendSchema.once('fill', function () {
      List.findById(list.id, function (err, list) {
        expect(err).to.be.ko;
        expect(list.friends[0].email).to.eq(user.email);
        done();
      });
    });
  });

  it('should not update field that we dont want to sync', function (done) {
    user.email = 'myfourthemail@gmail.com';
    user.avatar = 'avatar2.png';
    user.save();

    PostSchema.once('fill', function () {
      Post.findById(post.id, function (err, post) {
        expect(err).to.be.ko;
        expect(post.user.email).to.eq(user.email);
        expect(post.user.avatar).to.eq('avatar1.png');
        done();
      });
    });
  });


});


