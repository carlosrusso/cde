define([
  'cdf/lib/jquery'
], function ($) {

  var styleMaps = {
    global: {
      pan: {
        unselected: {
          normal: {
            stroke: 'white',
            fillOpacity: 0.5
          },
          hover: {
            stroke: 'black',
            fillOpacity: 0.5
          }
        },
        selected: {
          normal: {
            stroke: 'white',
            fillOpacity: 0.9
          },
          hover: {
            stroke: 'black',
            fillOpacity: 0.9
          }
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
            strokeWidth: 2,
            fillOpacity: 0.4
          },
          hover: {}
        },
        selected: {
          normal: {},
          hover: {}
        }
      },
      selection: {
        unselected: {
          normal: {
            fill: 'gray'
          },
          hover: {}
        },
        selected: {
          normal: {
            fill: 'red'
          },
          hover: {}
        }
      }
    },
    shapes: {
      pan: {
        unselected: {
          normal: {
            fontColor: 'black',
            zIndex: 0,
            strokeWidth: 1
          },
          hover: {
            zIndex: 1,
            strokeWidth: 2,
            fill: 'orange',
            fontColor: 'orange'
            //stroke: '#ffffff'
          }
        },
        selected: {
          normal: {
            zIndex: 0,
            fill: 'red'
          },
          hover: {
            zIndex: 1,
            fill: 'darkred'
          }
        }
      },
      selection: {
        unselected: {
          normal: {
            fill: 'gray'
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