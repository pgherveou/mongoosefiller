/**
 * module dependencies
 */

var mongoose = require('mongoose');

/**
 * references
 */

var ObjectId = mongoose.Schema.Types.ObjectId;


/**
 * select fields from an array of string mongoose style
 *
 * @param  {Array}  ref    reference array
 * @param  {String} select field to filter from orignial array
 * @return {Array}         filtered list of fields
 *
 * @api private
 */

var selectFields = function (ref, select) {
  var fields;
  if (!select) return ref;

  // select is of type -fied1 -field2
  if (select[0] === '-') {
    var removes = select.split(' ');
    fields = ref.slice(0);
    removes.forEach(function (remove) {
      fields.splice(fields.indexOf(remove.slice(1)), 1);
    });
    return fields;
  } else {
    // select is of type fied1 field2
    return select.split(' ');
  }
};



/**
 * @param  {Schema} schema
 * @param  {Object} options
 *
 * @api public
 */


module.exports = function (schema, options) {

  var refmodel = mongoose.model(options.ref)
    , refschema = refmodel.schema
    , field = {}
    , root, path, pos, sync, fields, rootEl, el = {};

  // normalize options

  if (options.path) {
    root = options.path + '.';
    path = root + '_id';

    // add virtual id path
    schema.virtual(options.path + '.id').get(function () {
      var _id = this.get(options.path + '._id');
      if (_id) return _id.toString();
    });

  } else {
    path = '_id';
    root = '';
  }

  if (options.pos) pos = options.pos;

  // select fields to copy
  fields = selectFields(Object.keys(refschema.paths), options.select);
  if (!~fields.indexOf('_id')) fields.push('_id');

  // append fields to schema

  if (options.path) {
    rootEl = {};
    rootEl[options.path] = el;
  } else {
    rootEl = el;
  }

  fields.forEach(function(name) {
    var type = refschema.paths[name].options.type;
    el[name] = {type: type};
    if (name === '_id') el[name].ref = options.ref;
  });

  schema.add(rootEl);

  // fetch source and fill on save

  schema.pre('save', function (next) {
    var id = this.get(path)
     , self = this;

    if (!this.isNew) return next();
    if (!id) return next();

    refmodel
      .findById(id)
      .select(fields.join(' '))
      .exec(function (err, model) {
        if (!model) return;
        fields.forEach(function (field) {
          self.set(root + field, model.get(field));
        });
        next();
      });
  });

  // get fields to get in sync
  sync = selectFields(fields, options.sync);

  // update all denormalized references when source is updated

  refschema.pre('save', function (next) {
    var self = this;

    // nothing to do for fresh doc
    if (this.isNew) return next();

    // get updated fields
    var changed = sync.filter(function (field) {
      return self.isDirectModified(field);
    });

    // nothing we care has changed
    if (!changed.length) return next();

    // build update query
    var conditions = {}
      , updates = {};

    if (pos)
      conditions[pos.replace('.$', '') + '_id'] = this.id;
    else
      conditions[path] = this.id;

    changed.forEach(function (field) {
      if (pos)
        updates[pos + field] = self.get(field);
      else
        updates[root + field] = self.get(field);
    });

    // call next, to save changes
    next();

    // trigger updates
    mongoose.model(options.dest).update(conditions, updates, {multi: true}).exec(function () {
      schema.emit('fill', self);
    });

  });

};