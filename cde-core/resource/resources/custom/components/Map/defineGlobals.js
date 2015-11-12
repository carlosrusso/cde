var myglobals = {
  'cdf/lib/jquery': $,
  'amd!cdf/lib/underscore': _,
  'amd!cdf/lib/backbone': Backbone,
  'cdf/AddIn': AddIn,
  'cdf/lib/Base': Base,
  'cdf/components/UnmanagedComponent': UnmanagedComponent,
  'cdf/lib/OpenLayers':OpenLayers,
  'cdf/lib/mustache': Mustache,
  'css!./Map': ''
};


for (var p in myglobals){
  define(p, function(){
    return myglobals[p];
  });
}
var CONTEXT_PATH = '';

define('cdf/Dashboard.Clean', function () {
  Dashboards.registerGlobalAddIn = Dashboards.registerGlobalAddIn || Dashboards.registerAddIn;
  return Dashboards;
});

define('cdf/Logger', function () {
  return {
    log: Dashboards.log,
    debug: Dashboards.debug,
    error: Dashboards.error,
    warn: Dashboards.warn
  };
});

define('text!./ControlPanel.html', function () {
  return '<div class="map-control-panel">'+
    '<div class="map-control-button map-control-zoom-in"></div>'+
    '<div class="map-control-button map-control-zoom-out"></div>'+
    '<div class="map-controls-mode {{mode}}">'+
    '<div class="map-control-button map-control-pan"></div>'+
    '<div class="map-control-button map-control-zoombox"></div>'+
    '<div class="map-control-button map-control-select"></div>'+
    '</div>'+
    '</div>';
});
