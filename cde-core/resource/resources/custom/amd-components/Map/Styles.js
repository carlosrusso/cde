define([
  'cdf/lib/jquery'
], function ($) {

  var styleMaps = {
    global: {
      pan: {
        unselected: {
          normal: {
            fillOpacity: 0.5
          },
          hover: {
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
            strokeWidth: 2,
            fillOpacity: 0.9
          },
          hover: {
            //fill: 'orange',
            stroke: "black",
            label: 'Ouch!'
          }
        },
        selected: {
          normal: {
            //fill: 'darkred',
            stroke: 'white',
            label: 'Selected'
          },
          hover: {
            //fill: 'darkorange',
            stroke: "black",
            label: 'Whooah!'
          }
        }
      },
      selection: {
        unselected: {
          normal: {
            fill: 'gray'
          },
          hover: {
            //fill: 'orange',
            stroke: "black"
          }
        },
        selected: {
          normal: {
            fill: 'red',
            stroke: 'white'
          },
          hover: {
            //fill: 'darkred',
            stroke: "black"
          }
        }
      }
    },
    shapes: {
      pan: {
        unselected: {
          normal: {
            label: 'yeah',
            fontColor: 'black',
            zIndex: 0,
            strokeWidth: 1
          },
          hover: {
            strokeWidth: 2,
            fill: 'orange',
            fontColor: 'orange',
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