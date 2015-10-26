define([
  './SelectionTree',
  'amd!cdf/lib/underscore'
], function (SelectionTree, _) {

  var MapSelectionTree = SelectionTree.extend({
    defaults: {
      id: void 0,
      label: "",
      isSelected: false,
      isVisible: true,
      numberOfSelectedItems: 0,
      numberOfItems: 0,
      rawData: null
    }
  });


  return MapSelectionTree;

});