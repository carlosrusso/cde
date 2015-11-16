define([
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore',
  'cdf/Logger'
], function ($, _, Logger) {

  var styleMaps = {
    global: {
      normal: {
        stroke: 'white'
      },
      hover: {
        stroke: 'black',
        cursor: 'pointer'
      },
      unselected: {
        'fill-opacity': 0.5
      },
      selected: {
        'fill-opacity': 0.9
      },
      selection: {
        unselected: {
          fill: 'gray'
        }
      }
    },
    markers: {
      r: 10,
      symbol: 'circle',
      //label: 'Normal',
      labelAlign: 'cm',
      labelYOffset: -20,
      fill: 'red',
      'stroke-width': 2

    },
    shapes: {
      normal: {
        'stroke-width': 1,
        'z-index': 0
      },
      hover: {
        fill: 'orange',
        'stroke-width': 2,
        'z-index': 1
      },
      selected: {
        normal: {
          fill: 'red'
        },
        hover: {
          fill: 'darkred'
        }
      }
    }
  };

  return {
    getStyleMap: getStyleMap,
    STYLES: {
      modes: ['pan', 'zoombox', 'selection'],
      states: ['unselected', 'selected'],
      actions: ['normal', 'hover']
    }
  };

  function getStyleMap(styleName) {
    var localStyleMap = _.result(this, 'styleMap') || {};
    var styleMap = $.extend(true, {}, styleMaps.global, styleMaps[styleName], localStyleMap.global, localStyleMap[styleName]);
    // TODO: Remove shapeSettings definition/property in the next major version.
    switch (styleName) {
      case 'shapes':
        Logger.warn('Usage of the "shapeSettings" property (including shapeSettings.fillOpacity, shapeSettings.strokeWidth and shapeSettings.strokeColor) is deprecated.');
        Logger.warn('Support for these properties will be removed in the next major version.');
      //return $.extend(true, styleMap, this.shapeSettings);
    }
    return styleMap;
  }


});