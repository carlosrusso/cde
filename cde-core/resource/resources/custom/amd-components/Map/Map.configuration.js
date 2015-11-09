define([
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore'
], function ($, _) {

  return {
    getConfiguration: getConfiguration
  };

  /**
   * Validates the configuration options and gathers them by context
   * @returns {{addIns: {MarkerImage: *, ShapeResolver: *, LocationResolver: *}}}
   */
  function getConfiguration() {
    var addIns = {
      MarkerImage: {
        name: this.markerCggGraph ? 'cggMarker' : this.markerImageGetter,
        options: {
          cggScript: this.markerCggGraph,
          parameters: this.cggGraphParameters,
          height: this.markerHeight,
          width: this.markerWidth,
          iconUrl: this.marker
        }
      },
      ShapeResolver: {
        name: this.shapeResolver,
        options: {
          url: this.shapeSource,
          parseShapeKey: this.parseShapeKey
        }
      },
      LocationResolver: {
        name: this.locationResolver || 'openstreetmap',
        options: {}
      },
      MapEngine: {
        name: this.mapEngineType,
        options: {
          tileServices: this.tileServices,
          tileServicesOptions: this.tileServicesOptions,
          tilesets: (_.isString(this.tilesets)) ? [this.tilesets] : this.tilesets,
          API_KEY: this.API_KEY || window.API_KEY
        }
      }
    };

    var viewport = {
      center: {
        latitude: parseFloat(this.centerLatitude),
        longitude: parseFloat(this.centerLongitude)
      },
      zoomLevel: this.defaultZoomLevel
    };

    return $.extend(true, {}, {
      addIns: addIns,
      styleMap: this.styleMap,
      viewport: viewport
    });
  }

});