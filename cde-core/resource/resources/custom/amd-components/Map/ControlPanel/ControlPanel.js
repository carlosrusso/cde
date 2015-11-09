define([
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore',
  '../model/baseevents',
  'cdf/lib/mustache',
  'text!./ControlPanel.html',
  'css!./ControlPanel'
], function ($, _, BaseEvents, Mustache, template) {

  var MODES = {
    'pan': 'pan',
    'zoombox': 'zoombox',
    'selection': 'selection'
  };

  var ControlPanel = BaseEvents.extend({
    constructor: function (domNode, model, options) {
      this.base();
      this.ph = $(domNode);
      this.model = model;
      this.options = options;
      this.setPanningMode();
      return this;
    },

    render: function () {
      var viewModel = {
        mode: this.model.get('mode')
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
      this.model.set('mode', MODES.pan);
      return this;
    },

    setZoomBoxMode: function () {
      this.model.set('mode', MODES.zoombox);
      return this;
    },

    setSelectionMode: function () {
      this.model.set('mode', MODES.selection);
      return this;
    },

    getMode: function () {
      return this.model.get('mode');
    },

    isPanningMode: function () {
      return this.model.get('mode') === MODES.pan;
    },

    isZoomBoxMode: function () {
      return this.model.get('mode') === MODES.zoombox;
    },

    isSelectionMode: function () {
      return this.model.get('mode') === MODES.selection;
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
      this.listenTo(this.model, 'change:mode', _.bind(this._updateView, this));
    },

    _updateView: function(){
      var mode = this.getMode();
      this.ph.find('.map-controls-mode')
        .removeClass(_.values(MODES).join(' '))
        .addClass(mode)
    }

  });
  return ControlPanel;
});