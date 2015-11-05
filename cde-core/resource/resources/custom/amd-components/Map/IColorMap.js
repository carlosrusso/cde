(function (root, factory) {
  if (typeof Dashboards === 'undefined') {
    define([
      'amd!cdf/lib/underscore'
    ], factory);
  } else {
    namespace(root, 'CDFComponents.NewMap.IColorMap', factory(
      root._
    ));
  }
  function namespace(root, path, f) {
    var levels = path.split('.');
    var location = levels.slice(0, levels.length - 1).reduce(function (base, level) {
      base[level] = base[level] || {};
      return base[level];
    }, root);
    location[levels[levels.length - 1]] = f;
  }
})(this, function (_) {

  var IColorMap = {
    /** Mixin for handling color maps
     This should probably be elevated to a proper class with a nice database of colormaps
     */
    colormaps: {
      'jet': [],
      'gray': [[0, 0, 0, 255], [255, 255, 255, 255]],
      'french-flag': [[255, 0, 0, 255], [255, 254, 255, 255], [0, 0, 255, 255]]
    },
    getColorMap: function () {

      var colorMap = [];
      if (this.colormap == null || (_.isArray(this.colormap) && !this.colormap.length)) {
        colorMap = [[0, 102, 0, 255], [255, 255, 0, 255], [255, 0, 0, 255]]; //RGBA
      } else {
        for (var k = 0, L = this.colormap.length; k < L; k++) {
          colorMap.push(JSON.parse(this.colormap[k]));
        }
      }

      var interpolate = function (a, b, n) {
        var c = [], d = [];
        var k, kk, step;
        for (k = 0; k < a.length; k++) {
          c[k] = [];
          for (kk = 0, step = (b[k] - a[k]) / n; kk < n; kk++) {
            c[k][kk] = a[k] + kk * step;
          }
        }
        for (k = 0; k < c[0].length; k++) {
          d[k] = [];
          for (kk = 0; kk < c.length; kk++) {
            d[k][kk] = Math.round(c[kk][k]);
          }
        }
        return d;
      };
      var cmap = [];
      for (k = 1, L = colorMap.length; k < L; k++) {
        cmap = cmap.concat(interpolate(colorMap[k - 1], colorMap[k], 32));
      }
      return _.map(cmap, function (v) {
        return 'rgba(' + v.join(',') + ')';
      });
    },
    mapColor: function (value, minValue, maxValue, colormap) {
      var n = colormap.length;
      var level = (value - minValue) / (maxValue - minValue);
      return colormap[Math.floor(level * (n - 1))];
    }
  };

  return IColorMap;


});