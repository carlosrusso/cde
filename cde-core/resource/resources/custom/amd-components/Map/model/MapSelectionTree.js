define([
  './SelectionTree',
  './SelectionStates',
  'amd!cdf/lib/underscore'
], function (SelectionTree, SelectionStates, _) {

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
    getStyle: function(){
      var myStyleMap = $.extend(true, {
        unselected: {
          'default': {},
          hover: {}
        },
        selected:{
          'default': {},
          hover:{}
        }
      }, this.get('styleMap'));

      var style;
      if (this.parent()) {
        style = this.parent().getStyle();
      } else {
        style = {
          'default': {},
          hover: {}
        }
      }

      $.extend(true, style, myStyleMap.unselected);
      var isSelected = this.get(isSelected) === SelectionStates.ALL;
      if (isSelected){
        $.extend(true, style, myStyleMap.selected);
      }
      return style;
    }
  });


  return MapSelectionTree;

});