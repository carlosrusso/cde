define([
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore',
  './model/baseevents/baseevents',
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
      constructor: function (domNode, options) {
        this.base();
        this.ph = $(domNode);
        this.options = options;
        this.mode = MODES.pan;
        return this;
      },

      render: function () {
        var viewModel = {
          mode: this.mode
        };
        var html = Mustache.render(template, viewModel);
        this.ph.empty().append(html);
        this._bindEvents();

        return this;
      },


      zoomOut: function(){
        console.log('zoom out');
        this.trigger('zoom:out');
        return this;
      },
      zoomIn: function(){
        console.log('zoom in');
        this.trigger('zoom:in');
        return this;
      },
      setPanningMode: function(){
        this.mode = MODES.pan;
        console.log('pan');
        this.trigger('mode:pan');
        return this;
      },
      setZoomBoxMode: function(){
        this.mode = MODES.zoombox;
        console.log('zoombox');
        this.trigger('mode:zoombox');
        return this;
      },
      setSelectionMode: function() {
        this.mode = MODES.selection;
        console.log('selection');
        this.trigger('mode:selection');
        return this;
      },

      _bindEvents: function(){
        var bindings = {
          '.map-control-zoom-out': this.zoomOut,
          '.map-control-zoom-in': this.zoomIn,
          '.map-control-pan': this.setPanningMode,
          '.map-control-zoombox': this.setZoomBoxMode,
          '.map-control-select': this.setSelectionMode
        };

        var me = this;
        _.each(bindings, function(callback, selector){
          me.ph.find(selector).click(_.bind(callback, me));
        });
      }

    })
    ;
  return ControlPanel;
})
;