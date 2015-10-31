define([
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore',
  './ShapeConversion'
], function ($, _, ShapeConversion) {

  return resolveShapes;

  function resolveShapes (shapeResolver, url, keys, json) {
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

    var tgt = this,
      st = {
        keys: keys,
        tableData: json,
        _simplifyPoints: ShapeConversion.simplifyPoints,
        _parseShapeKey: this.parseShapeKey,
        _shapeSource: url
      };
    var promise = addIn.call(tgt, st, this.getAddInOptions('ShapeResolver', addIn.getName()));
    promise.then(function (result) {
      var shapeDefinitions = _.chain(result)
        .map(function (geoJSONFeature, key) {
          return [key, geoJSONFeature]; //decode geojson to native format
        })
        .object()
        .value();
      deferred.resolve(shapeDefinitions);
    });
    return deferred.promise();
  }

});