define([
  'cdf/lib/jquery'
], function ($) {

  var styleMaps = {
    global: {
      pan: {
        unselected: {
          normal: {},
          hover: {
          }
        },
        selected: {
          normal: {
          },
          hover: {
          }
        }
      }
    },
    markers: {
      pan: {
        unselected: {
          normal: {
            pointRadius: 10
          },
          hover: {}
        },
        selected: {
          normal: {},
          hover: {}
        }
      }
    },
    shapes: {
      pan: {
        unselected: {
          normal: {
            fillOpacity: 0.5,
            strokeWidth: 2,
            strokeColor: 'white',
            zIndex: 0
          },
          hover: {
            strokeWidth: 4
          }
        },
        selected: {
          normal: {
            fillColor: 'red'
          },
          hover: {
            strokeWidth: 4
          }
        }
      }
    }
  };

  var emptyStyleMap = {
    pan: {
      unselected: {
        normal: {},
        hover: {}
      },
      selected: {
        normal: {},
        hover: {}
      }
    },
    zoombox: {
      unselected: {
        normal: {},
        hover: {}
      },
      selected: {
        normal: {},
        hover: {}
      }
    },
    selection: {
      unselected: {
        normal: {},
        hover: {}
      },
      selected: {
        normal: {},
        hover: {}
      }
    }
  };

  return {
    getStyleMap: getStyleMap
  };

  function getStyleMap(styleMap) {
    return $.extend(true, {}, emptyStyleMap, styleMaps[styleMap]);
  }

});