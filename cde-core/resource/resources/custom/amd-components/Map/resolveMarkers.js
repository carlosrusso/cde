define([
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore',
  './getMapping'
], function ($, _, getMapping) {

  return resolveMarkers;

  function resolveMarkers(locationResolver, json) {
    var addIn = this.getAddIn('LocationResolver', locationResolver || 'openstreetmap');

    var deferred = $.Deferred();
    if (!addIn) {
      deferred.resolve({});
      return deferred.promise();
    }

    var mapping = getMapping(json);

    var tgt = this;
    var opts = this.getAddInOptions('LocationResolver', addIn.getName());
    var markerDefinitions;
    if (mapping.addressType === 'coordinates') {
      markerDefinitions = _.chain(json.resultset)
        .map(function (row) {
          var key = row[0]; //TODO: remove hardcoding of index
          var location = [row[mapping.longitude], row[mapping.latitude]];
          return [key, createFeatureFromLocation(location)];
        })
        .object()
        .value();

    } else {
      markerDefinitions = _.chain(json.resultset)
        .map(function (row, rowIdx) {
          var promisedLocation = $.Deferred();
          var key = row[0];
          var address = mapping.address != undefined ? row[mapping.address] : undefined;
          var st = {
            data: row,
            position: rowIdx,
            address: address,
            addressType: mapping.addressType,

            key: key,
            mapping: mapping,
            tableData: json,
            continuationFunction: function (location) {
              promisedLocation.resolve(createFeatureFromLocation(location));
            }
          };
          var props = ['country', 'city', 'county', 'region', 'state'];
          _.each(_.pick(mapping, props), function (propIdx, prop) {
            if (propIdx != undefined) {
              st[prop] = row[propIdx];
            }
          });
          try {
            addIn.call(tgt, st, opts);
          } catch (e) {
            promisedLocation.resolve(null);
          }
          return [key, promisedLocation.promise()];
        })
        .object()
        .value();
    }

    deferred.resolve(markerDefinitions);
    return deferred.promise();
  }

  function createFeatureFromLocation(location) {
    var longitude = location[0];
    var latitude = location[1];
    var feature = {
      geometry: {
        coordinates: [longitude, latitude],
        type: "Point",
        properties: {
          latitude: latitude,
          longitude: longitude
        }
      },
      type: "Feature"
    };
    return feature;
  }




});