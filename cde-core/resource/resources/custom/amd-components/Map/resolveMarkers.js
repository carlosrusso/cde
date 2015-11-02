define([
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore'
], function ($, _) {

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
          Latitude: latitude,
          Longitude: longitude
        }
      },
      type: "Feature"
    };
    return feature;
  }


  function getMapping(json) {
    var map = {};

    if (!json.metadata || json.metadata.length == 0)
      return map;

    //Iterate through the metadata. We are looking for the following columns:
    // * address or one or more of 'Country', 'State', 'Region', 'County', 'City'
    // * latitude and longitude - if found, we no longer care for address
    // * description - Description to show on mouseover
    // * marker - Marker image to use - usually this will be an url
    // * markerWidth - Width of the marker
    // * markerHeight - Height of the marker
    // * popupContents - Contents to show on popup window
    // * popupWidth - Width of the popup window
    // * popupHeight - Height of the popup window

    var colToPropertyMapping = { // colName -> property
      'description': 'description',
      'marker': 'marker',
      'markerwidth': 'markerWidth',
      'markerheight': 'markerHeight',
      'popupcontents': 'popupContents',
      'popupwidth': 'popupWidth',
      'popupheight': 'popupHeight'
    };
    _.each(json.metadata, function (elt, i) {

      var colName = elt.colName.toLowerCase();
      var property = colToPropertyMapping[colName];
      if (property){
        map[property] = i;
      }

      switch (colName) {
        case 'latitude':
          map.addressType = 'coordinates';
          map.latitude = i;
          break;
        case 'longitude':
          map.addressType = 'coordinates';
          map.longitude = i;
          break;
        case 'address':
          if (!map.addressType) {
            map.address = i;
            map.addressType = 'address';
          }
          break;
        default:
          map[elt.colName.toLowerCase()] = i;
          break;
        // if ($.inArray(values.metadata[0].colName, ['Country', 'State', 'Region', 'County', 'City'])) {
      }

    });

    return map;
  }

});