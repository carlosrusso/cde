define('cdf/lib/jquery', function () {
  return $;
});
define('amd!cdf/lib/underscore', function () {
  return _;
});
define('amd!cdf/lib/backbone', function () {
  return Backbone;
});
define('cdf/AddIn', function () {
  return AddIn;
});

define('cdf/components/BaseComponent', function () {
  return BaseComponent;
});
define('cdf/components/UnmanagedComponent', function () {
  return UnmanagedComponent;
});
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

define('cdf/lib/OpenLayers', function () {
  return OpenLayers;
});
define('cdf/lib/mustache', function () {
  return Mustache;
});
define('text!./ControlPanel.html', function () {
  return '<div class="map-control-panel"/>';
});
