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
            pointRadius: 10,
            graphicName: 'circle',
            label: 'label',
            labelAlign: 'cm',
            labelYOffset: -10,
            fillColor: '#ff0000',
            strokeColor: '#ffffff',
            strokeWidth: 3,
            fillOpacity: 0.9
          },
          hover: {
            fillColor: 'orange'
          }
        },
        selected: {
          normal: {
            fillColor: 'red'
          },
          hover: {
            fillColor: 'pink'
          }
        }
      }
    },
    shapes: {
      pan: {
        unselected: {
          normal: {
            strokeWidth: 1
          },
          hover: {
            strokeWidth: 2,
            fillColor: 'orange',
            strokeColor: '#ffffff'
          }
        },
        selected: {
          normal: {
            fillColor: 'red'
          },
          hover: {
            fillColor: 'pink'
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