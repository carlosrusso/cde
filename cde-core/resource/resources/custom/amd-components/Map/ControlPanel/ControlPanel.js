define([
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore',
  '../model/baseevents/baseeventsModel',
  'cdf/lib/mustache',
  'text!./ControlPanel.html',
  'css!./ControlPanel'
], function ($, _, BaseModel, Mustache, template) {

  var MODES = {
    'pan': 'pan',
    'zoombox': 'zoombox',
    'selection': 'selection'
  };

  var ControlPanel = BaseModel.extend({
    constructor: function (domNode, options) {
      this.base();
      this.ph = $(domNode);
      this.options = options;
      this.setPanningMode();
      return this;
    },

    render: function () {
      var viewModel = {
        mode: this.get('mode')
      };
      var html = Mustache.render(template, viewModel);
      this.ph.empty().append(html);
      this._bindEvents();

      return this;
    },

    zoomOut: function () {
      this.trigger('zoom:out');
      return this;
    },
    zoomIn: function () {
      this.trigger('zoom:in');
      return this;
    },

    setPanningMode: function () {
      if (this.isSelectionMode()){
        this.trigger('selection:complete');
      }
      this.set('mode', MODES.pan);
      return this;
    },

    setZoomBoxMode: function () {
      this.set('mode', MODES.zoombox);
      return this;
    },

    setSelectionMode: function () {
      this.set('mode', MODES.selection);
      return this;
    },

    getMode: function () {
      return this.get('mode');
    },

    isPanningMode: function () {
      return this.get('mode') === MODES.pan;
    },

    isZoomBoxMode: function () {
      return this.get('mode') === MODES.zoombox;
    },

    isSelectionMode: function () {
      return this.get('mode') === MODES.selection;
    },

    _bindEvents: function () {
      var bindings = {
        '.map-control-zoom-out': this.zoomOut,
        '.map-control-zoom-in': this.zoomIn,
        '.map-control-pan': this.setPanningMode,
        '.map-control-zoombox': this.setZoomBoxMode,
        '.map-control-select': this.setSelectionMode
      };

      var me = this;
      _.each(bindings, function (callback, selector) {
        me.ph.find(selector).click(_.bind(callback, me));
      });
    }

  });
  return ControlPanel;
});