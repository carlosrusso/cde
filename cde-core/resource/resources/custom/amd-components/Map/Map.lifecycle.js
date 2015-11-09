define([], function () {

  return {
    maybeToggleBlock: function (block) {
      if (!this.isSilent()) {
        block ? this.block() : this.unblock();
      }
    },

    getQueryData: function () {
      var query = this.queryState = this.query = this.dashboard.getQuery(this.queryDefinition);
      query.setAjaxOptions({async: true});
      query.fetchData(
        this.parameters,
        this.getSuccessHandler(this.onDataReady),
        this.getErrorHandler());
    },

    _concludeUpdate: function () {
      // google mapEngine implementation will still fetch data asynchronously before ca
      // so only here can we finish the lifecycle.
      this.postExec();
      this.maybeToggleBlock(false);
    }
  }


});