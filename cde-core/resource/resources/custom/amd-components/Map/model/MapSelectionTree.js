define([
  './SelectionTree',
  './SelectionStates',
  'amd!cdf/lib/underscore',
  'cdf/lib/jquery'
], function (SelectionTree, SelectionStates, _, $) {

  var MapSelectionTree = SelectionTree.extend({
    defaults: {
      id: void 0,
      label: "",
      isSelected: false,
      isVisible: true,
      numberOfSelectedItems: 0,
      numberOfItems: 0,
      rawData: null,
      styleMap: {
        unselected: {
          'default': {},
          hover: {}
        },
        selected: {
          'default': {},
          hover: {}
        }
      }
    },

    /**
     * Computes the node's style, using inheritance.
     *
     * Rules:
     *
     */
    getStyle: function (mode, state, action) {
      var myStyleMap = this.get('styleMap');

      var parentStyle;
      if (this.parent()) {
        parentStyle = this.parent().getStyle();
      } else {
        parentStyle = {};
      }

      var style = $.extend(true, {}, parentStyle, myStyleMap);

      switch (arguments.length) {
        case 0:
          return style;
        case 1:
          return style[mode];
        case 2:
          return style[mode][state];
        case 3:
          var calculatedStyle = $.extend(true, {}, ((style[mode] || {})[state] || {})[action]);
          // Attempt to fill in the gaps
          _.defaults(calculatedStyle,
            style[mode][state].normal,
            style[mode].unselected.normal,
            style.pan[state][action],
            style.pan[state].normal,
            style.pan.unselected.normal
          );
          //console.log(this.get('id'), mode, state, action, style, calculatedStyle);
          return calculatedStyle;
      }
    },

    inferStyle: function (action) {
      var mode = this.root().get('mode');
      var state = (this.getSelection() === true) ? 'selected' : 'unselected';
      return this.getStyle(mode, state, action || 'normal');
    },
    getFeatureType: function () {
      return this._getFeatureType([]);
    },

    _getFeatureType: function (list) {
      list.unshift(this.get('id'));

      if (this.parent()) {
        return this.parent()._getFeatureType(list);
      } else {
        return list;
      }
    }


  });


  return MapSelectionTree;

});