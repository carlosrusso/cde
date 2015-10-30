define([
  'cdf/lib/jquery'
], function ($) {

  var styleMaps = {
    global: {
      pan: {
        unselected: {
          normal: {
            fillColor: "#aaa",
            strokeColor: "#000",
            fillOpacity: 0.5
          },
          hover: {
            fillColor: "#fff"
          }
        },
        selected: {
          normal: {},
          hover: {}
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
          normal: {},
          hover: {
            strokeWidth: 4
          }
        },
        selected: {
          normal: {},
          hover: {}
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