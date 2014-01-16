/* global describe:true, before:true, it:true */

var mongoose = require('mongoose'),
    filler = require('..'),
    expect = require('chai').expect,
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

/**
 * connect db
 */

mongoose.connect('mongodb://localhost/mongoosefiller', function (err) {
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
  ref : User,
  dest: 'Post',
  select: 'firstname lastname email avatar',
  sync: '-avatar'
});

var Post = mongoose.model('Post', PostSchema);

/**
 * Player schema
 */

var PlayerSchema = new Schema({
  position: {type: String},
  user: {type: ObjectId}
});

PlayerSchema.plugin(filler, {
  id: 'user',
  path: 'userInfo',
  ref : 'User',
  dest: 'Player',
  select: 'firstname lastname avatar'
});

var Player = mongoose.model('Player', PlayerSchema);

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

var list, user, user2, player, post;

describe('mongoosefiller', function() {

  before(function (done) {
    User.remove({}, done);
  });

  before(function (done) {
    Post.remove({}, done);
  });

  before(function (done) {
    List.remove({}, done);
  });

  before(function (done) {
    user = new User({
      firstname: 'John',
      lastname : 'Mcenroe',
      email    : 'john@gmail.com',
      avatar   : 'avatar1.png'
    });
    user.save(done);
  });

  before(function (done) {
    user2 = new User({
      firstname: 'Yannick',
      lastname : 'Noah',
      email    : 'yannick@gmail.com',
      avatar   : 'avatar2.png'
    });
    user2.save(done);
  });


  // beforeEach(function () {
  //   mongoose.set('debug', true);
  //   console.log('############');
  // });

  it('should populate post.user', function (done) {
    post = new Post({
      user: {_id: user.id},
      message: 'some message'
    });
    post.save(function() {
      expect(post.user).to.be.an('object');
      expect(post.user.id).to.eq(user.id);
      expect(post.user.email).to.eq(user.email);
      expect(post.user.firstname).to.eq(user.firstname);
      done();
    });
  });

  it('should fail to save post when user does not exist', function (done) {
    var post = new Post({
      user: {_id: '000000000000000000000000'},
      message: 'boo message'
    });
    post.save(function(err) {
      expect(err).to.be.ok;
      done();
    });
  });

  it('should update post when user is updated', function (done) {
    user.email = 'myotheremail@gmail.com';
    user.save();
    PostSchema.once('fill', function () {
      Post.findById(post.id, function (err, post) {
        expect(post.user).to.be.an('object');
        expect(post.user.email).to.eq(user.email);
        done();
      });
    });
  });

  it('should populate player.userInfo', function (done) {
    player = new Player({
      user: user.id,
      position: 'forward'
    });

    player.save(function() {
      expect(player.userInfo.firstname).to.eq(user.firstname);
      expect(player.userInfo.lastname).to.eq(user.lastname);
      expect(player.userInfo.avatar).to.eq(user.avatar);
      done();
    });
  });

  it('should update player when user is updated', function (done) {
    user.firstname = 'Johny';
    user.save();
    PlayerSchema.once('fill', function () {
      Player.findById(player.id, function (err, player) {
        expect(player.userInfo.firstname).to.eq(user.firstname);
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
      expect(err).to.not.be.ko;
      expect(list.friends[0]).to.be.ok;
      expect(list.friends[0].id).to.eq(user.id);
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
        expect(err).to.not.be.ko;
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
        expect(err).to.not.be.ko;
        expect(post.user.email).to.eq(user.email);
        expect(post.user.avatar).to.eq('avatar1.png');
        done();
      });
    });
  });

  it('should update post.user to user2', function (done) {
    post.user._id = user2.id;
    post.save(function() {
      expect(post.user.id).to.eq(user2.id);
      expect(post.user.email).to.eq(user2.email);
      expect(post.user.firstname).to.eq(user2.firstname);
      done();
    });
  });

  it('should unset post.user', function (done) {
    post.user._id = null;
    post.save(function() {
      expect(post.user.id).to.not.be.ko;
      expect(post.user.email).to.not.be.ko;
      expect(post.user.firstname).to.not.be.ko;
      done();
    });
  });

});


