define([
  'cdf/lib/jquery'
], function ($) {

  var styleMaps = {
    global: {
      pan: {
        unselected: {
          normal: {
            //fill: "#aaa",
            //stroke: "#000",
            fillOpacity: 0.5
          },
          hover: {
            //fill: "#fff"
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
            r: 10,
            graphicName: 'circle',
            label: 'Normal',
            labelAlign: 'cm',
            labelYOffset: -20,
            fill: 'red',
            stroke: '#ffffff',
            strokeWidth: 3,
            fillOpacity: 0.9
          },
          hover: {
            fill: 'orange',
            label: 'Ouch!'
          }
        },
        selected: {
          normal: {
            stroke: 'yellow',
            fill: 'darkred',
            label: 'Selected'
          },
          hover: {
            fill: 'darkorange',
            label: 'Whooah!'
          }
        }
      }
    },
    shapes: {
      pan: {
        unselected: {
          normal: {
            zIndex: 0,
            strokeWidth: 1
          },
          hover: {
            strokeWidth: 2,
            fill: 'orange',
            stroke: '#ffffff'
          }
        },
        selected: {
          normal: {
            zIndex: 1,
            stroke: 'yellow',
            fill: 'red'
          },
          hover: {
            fill: 'darkred'
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