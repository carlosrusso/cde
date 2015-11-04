define([
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore',
  './ShapeConversion'
], function ($, _, ShapeConversion) {

  return resolveShapes;

  function resolveShapes (json, mapping, shapeResolver, url) {
    var addIn = this.getAddIn('ShapeResolver', shapeResolver);
    if (!addIn && url) {
      if (url.endsWith('json') || url.endsWith('js')) {
        addIn = this.getAddIn('ShapeResolver', 'simpleJSON');
      } else {
        addIn = this.getAddIn('ShapeResolver', 'kml');
      }
    }
    var deferred = $.Deferred();
    if (!addIn) {
      deferred.resolve({});
      return deferred.promise();
    }

    var idList = _.pluck(json.resultset, mapping.id);
    var tgt = this,
      st = {
        keys: idList, //TODO Consider keys -> ids
        tableData: json,
        _simplifyPoints: ShapeConversion.simplifyPoints,
        _parseShapeKey: this.parseShapeKey,
        _shapeSource: url
      };
    var promise = addIn.call(tgt, st, this.getAddInOptions('ShapeResolver', addIn.getName()));
    $.when(promise).then(function (result) {
      var shapeDefinitions = _.chain(result)
        .map(function (geoJSONFeature, key) {
          return [key, geoJSONFeature];
        })
        .object()
        .value();
      deferred.resolve(shapeDefinitions);
    });
    return deferred.promise();
  }

});