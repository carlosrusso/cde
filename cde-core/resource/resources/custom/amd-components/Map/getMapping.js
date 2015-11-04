define([
  'amd!cdf/lib/underscore'
], function (_) {

  return getMapping;

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
      'marker': 'marker', //iconUrl
      'markerwidth': 'markerWidth',
      'markerheight': 'markerHeight',
      'popupcontents': 'popupContents',
      'popupwidth': 'popupWidth',
      'popupheight': 'popupHeight'
    };
    _.each(json.metadata, function (colMeta, idx) {

      var colName = colMeta.colName.toLowerCase();
      var property = colToPropertyMapping[colName];
      if (property){
        map[property] = idx;
      }

      switch (colName) {
        case 'latitude':
          map.addressType = 'coordinates';
          map.latitude = idx;
          break;
        case 'longitude':
          map.addressType = 'coordinates';
          map.longitude = idx;
          break;
        case 'address':
          if (!map.addressType) {
            map.address = idx;
            map.addressType = 'address';
          }
          break;
        default:
          map[colMeta.colName.toLowerCase()] = idx;
          break;
      }

    });

    return map;
  }
});