/**
 * module dependencies
 */

var mongoose = require('mongoose');

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
  var refmodel = ('string' === typeof options.ref)
                  ? mongoose.model(options.ref)
                  : options.ref,
      modelName = refmodel.modelName,
      refschema = refmodel.schema,
      root, idPath, pos, sync, fields, rootEl, el = {};

  // root path
  root = options.path
    ? options.path + '.'
    : '';

  // id path
  idPath =  options.id
    ? options.id
    : root + '_id';

  // add virtual id path
  if (options.path) {
    schema.virtual(options.path + '.id').get(function () {
      var _id = this.get(idPath);
      if (_id) return _id.toString();
    });
  }


  if (options.pos) pos = options.pos;

  // select fields to copy
  fields = selectFields(Object.keys(refschema.paths), options.select);
  if (!options.id && fields.indexOf('_id') === -1) fields.push('_id');

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
    if (name === '_id') el[name].ref = modelName;
  });

  schema.add(rootEl);

  // fetch source and fill on save
  schema.pre('save', function (next) {
    var id = this.get(idPath),
        _this = this;

    if (!this.isModified(idPath)) return next();

    if (!id) {
      fields.forEach(function (field) {
        _this.set(root + field, null);
      });
      return next();
    }

    refmodel
      .findById(id)
      .select(fields.join(' '))
      .exec(function (err, model) {
        if (err) return next(err);
        if (!model) return next(new Error(modelName + ' (id:' + id + ') not found'));
        fields.forEach(function (field) {
          _this.set(root + field, model.get(field));
        });
        next();
      });
  });

  // get fields to get in sync
  sync = selectFields(fields, options.sync);

  // update all denormalized references when source is updated
  refschema.pre('save', function (next) {
    var _this = this,
        conditions = {},
        updates = {};

    // nothing to do for fresh doc
    if (this.isNew) return next();

    // get updated fields
    var changed = sync.filter(function (field) {
      return _this.isDirectModified(field);
    });

    // nothing we care has changed
    if (!changed.length) return next();

    // build update query
    if (pos) {
      conditions[pos.replace('.$', '') + '_id'] = this.id;
    } else {
      conditions[idPath] = this.id;
    }

    changed.forEach(function (field) {
      if (pos) {
        updates[pos + field] = _this.get(field);
      } else {
        updates[root + field] = _this.get(field);
      }
    });

    // trigger updates
    mongoose
      .model(options.dest)
      .update(conditions, updates, {multi: true})
      .exec(function (err) {
      schema.emit('fill', err, _this);
    });

    // call next, to save changes
    next();

  });

};