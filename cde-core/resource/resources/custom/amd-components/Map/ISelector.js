define([], function () {

  return {

    /**
     * Gets the current selection state
     * @method getValue
     * @public
     * @return {Array} List of strings containing the IDs of the selected items,
     * in the same format as they would be written to the parameter
     */
    getValue: function() {

      return this.model.getSelectedItems();
    },

    /**
     * Updates the selection state of the filter
     * @method setValue
     * @public
     * @param {Array} value List of strings containing the IDs of the selected items,
     * which will be written to the parameter
     * @chainable
     */
    setValue: function(idList) {
      if (this.model){
        this.model.setSelectedItems(idList);
      } else {
        throw 'Model is not initialized';
      }
      return this;
    },

    /**
     * Implement's CDF logic for updating the state of the parameter, by
     * invoking Dashboards.processChange()
     * @method processChange
     * @public
     * @param {Array} value List of strings containing the IDs of the selected items,
     * in the same format as they would be written to the parameter
     */
    processChange: function() {
      this.dashboard.processChange(this.name);
      return this;
    }
  };


});