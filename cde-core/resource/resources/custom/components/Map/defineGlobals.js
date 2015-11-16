(function () {

  var myglobals = {
    'cdf/lib/jquery': $,
    'amd!cdf/lib/underscore': _,
    'amd!cdf/lib/backbone': Backbone,
    'cdf/AddIn': AddIn,
    'cdf/lib/mustache': Mustache,
    'cdf/lib/Base': Base,
    'cdf/lib/BaseEvents': BaseEvents,
    'cdf/components/UnmanagedComponent': UnmanagedComponent,
    'cdf/lib/BaseSelectionTree': TreeFilter.Models.SelectionTree,
    'cdf/lib/OpenLayers': OpenLayers,
    'css!./Map': ''
  };


  CONTEXT_PATH = Dashboards.getWebAppPath();
  for (var p in myglobals) {
    define(p, function () {
      return myglobals[p];
    });
  }

  define('cdf/Dashboard.Clean', function () {
    Dashboards.registerGlobalAddIn = Dashboards.registerGlobalAddIn || Dashboards.registerAddIn;
    return Dashboards;
  });

  define('cdf/Logger', function () {
    return {
      log: Dashboards.log,
      debug: Dashboards.log,
      error: Dashboards.log,
      warn: Dashboards.log
    };
  });

  define("text!./ControlPanel.html", [], function() {
    return '<div class="map-control-panel">\n    <div class="map-control-button map-control-zoom-in"></div>\n    <div class="map-control-button map-control-zoom-out"></div>\n    <div class="map-controls-mode {{mode}}">\n        <div class="map-control-button map-control-pan"></div>\n        <div class="map-control-button map-control-zoombox"></div>\n        <div class="map-control-button map-control-select"></div>\n    </div>\n</div>';
  })

}());

