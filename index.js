/**
 * module dependencies
 */

var mongoose = require('mongoose');

/**
 * references
 */

var ObjectId = mongoose.Schema.Types.ObjectId;


/**
 * fill
 *
 * @param  {Schema} schema  [description]
 * @param  {Object} options [description]
 *
 * @api public
 */

module.exports = function (schema, options) {
  var root, path;

  // model and schema
  destmodel = mongoose.model(options.dest);
  srcmodel = mongoose.model(options.src);
  srcschema = srcmodel.schema;

  // get filling path
  if (options.path) {
    root = options.path + '.';
    path = root + '_id';
  } else {
    path = '_id';
    root = '';
  }

  // get filling fields
  if (options.fields) {
    fields = options.fields;
  } else {
    fields = Object.keys(srcschema.paths);
  }

  // append fields to schema
  fields.forEach(function(name) {
    var field = {}
      , type = srcschema.paths[name].options.type;

    field[root + name] = type;
    schema.add(field);
  });

  // fetch source and fill on save
  schema.pre('save', function (next) {
    var id = this.get(path)
     , self = this;

    if (!this.isNew) return next();
    if (!id) return next();

    srcmodel
      .findById(id)
      .select(fields.join(' '))
      .exec(function (err, model) {
        fields.forEach(function (field) {
          self.set(root + field, model[field]);
        });
        next();
      });
  });

  // update all denormalized references when source is updated
  srcschema.pre('save', function (next) {
    var self = this;

    // nothing to do for fresh doc
    if (this.isNew) return next();

    // get updated fields
    var changed = fields.filter(function (field) {
      return self.isDirectModified(field);
    });

    // nothing we care has changed
    if (!changed.length) return next();

    // build update query
    var conditions = {}
      , updates = {};

    conditions[path] = this.id;
    changed.forEach(function (field) {
      updates[root + '.' + field] = self.get(field);
    });

    // update
    destmodel.update(conditions, updates, {multi: true}).exec();

    // call next async
    next();
  });

};