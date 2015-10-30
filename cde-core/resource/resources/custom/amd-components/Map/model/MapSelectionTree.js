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
        selected:{
          'default': {},
          hover:{}
        }
      }
    },

    /**
     * Computes the node's style, using inheritance.
     * Assumes that the style "selected" applies over the "unselected" case.
     * Assumes that at each level "hover" applies over default.
     * @returns { default: {...}, hover:{...}}
     */
    getStyle: function(state){
      var myStyleMap = this.get('styleMap');

      var style;
      if (this.parent()) {
        style = this.parent().getStyle();
      } else {
        style = {}
      }

      $.extend(true, style, myStyleMap);

      if (state != undefined)
        return style[state];
      else
        return style;
    },

    getFeatureType: function(){

      return this._getFeatureType([]);

    },

    _getFeatureType: function(list){
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