define([
    'cdf/lib/jquery',
    'amd!cdf/lib/underscore',
    './baseevents/baseeventsModel'],
  function ($, _, BaseModel) {


    /**
     * Import data from multiple sources, populate the model
     * @class InputDataHandler
     * @extends BaseModel
     * @constructor
     * @param {Object} options
     */
    var InputDataHandler = BaseModel.extend({
      getModel: function () {
        return this.get('model');
      },

      _groupGenerator: groupGenerator,
      _itemGenerator: itemGenerator,

      /**
       * Import data into the MVC model, eventually inferring the data format
       * @method updateModel
       * @param {CDAJson | Array} whatever
       * @chainable
       * @public
       */
      updateModel: function (whatever) {
        if (_.isArray(whatever)) {
          this._updateModelFromBidimensionalArray(whatever);
        } else if (this.isCdaJson(whatever)) {
          this._updateModelFromCdaJson(whatever);
        } else {
          this._updateModelJson(whatever);
        }
        var model = this.get('model');
        model.set('isBusy', false);
        model.set('isDisabled', this.get('model').children() === null);
        var options = this.get('options');

        var ref;
        if ((ref = options.hooks) != null ? ref.postUpdate : void 0) {
          _.each(options.hooks.postUpdate, function (hook) {
            return hook.call(null, null, model, options);
          });
        }
        this.trigger('postUpdate', model);
        return this;
      },
      _updateModelFromCdaJson: function (json) {
        var data, numberOfItems, options, pageData, ref, ref1, searchPattern;
        options = $.extend(true, {}, this.get('options'));
        pageData = getPageData(json.queryInfo, options.query.getOption('pageSize'));
        if (_.chain(options.indexes).map(_.identity).max().value() < json.metadata.length) {
          data = _.chain(json.resultset).groupBy(function (row) {
            return row[options.indexes.parentId];
          }).map(groupGenerator(options.indexes, pageData)).value();
        } else {
          data = itemGenerator(options.indexes, pageData)(json.resultset);
          if (((ref = options.root) != null ? ref.id : void 0) != null) {
            this.get('model').set('id', options.root.id);
          }
        }
        this.get('model').add(data);
        if (((ref1 = json.queryInfo) != null ? ref1.pageStart : void 0) != null) {
          numberOfItems = parseInt(json.queryInfo.totalRows);
        } else {
          numberOfItems = void 0;
        }
        searchPattern = options.query.getOption('searchPattern');
        if (_.isEmpty(searchPattern)) {
          this.get('model').set('numberOfItemsAtServer', numberOfItems);
        }
        return this;
      },
      _updateModelFromJson: function (anyJsonObject) {
        return this;
      },
      _updateModelFromBidimensionalArray: function (rows) {
        var data, idx;
        /* if (rows.length > 0) {
         return this;
         } */
        idx = {
          id: 0,
          label: 1,
          value: void 0
        };
        data = itemGenerator(idx)(rows);
        this.get('model').add(data);
        return this;
      },
      isCdaJson: function (obj) {
        var result;
        result = false;
        if (_.isObject(obj)) {
          if (_.isArray(obj.resultset)) {
            if (_.isArray(obj.metadata)) {
              result = true;
            }
          }
        }
        return result;
      },

      /**
       * Matches the items against a list and marks the matches as selected
       * @method setValue
       * @param {Array} selectedItems Arrays containing the ids of the selected items
       * @chainable
       * @public
       */
      setValue: function (selectedItems) {
        this.get('model').setSelectedItems(selectedItems);
        this.trigger('setValue', selectedItems);
        return this;
      }
    });

    return InputDataHandler;



    function getPageData(queryInfo, pageSize) {
      var pageData;
      pageData = {};
      if ((queryInfo != null ? queryInfo.pageStart : void 0) != null) {
        pageData = {
          page: Math.floor(parseInt(queryInfo.pageStart) / pageSize)
        };
      }
      return pageData;
    }

    function itemGenerator(idx, pageData) {
      var createItems;
      if (!_.isObject(pageData)) {
        pageData = {};
      }
      createItems = function (rows) {
        return _.map(rows, function (row) {
          var itemData;
          itemData = {
            id: row[idx.id],
            label: row[idx.label],
            raw: row
          };
          if (_.isFinite(idx.value) && idx.value >= 0) {
            itemData.value = row[idx.value];
          }
          itemData = $.extend(true, itemData, pageData);
          return itemData;
        });
      };
      return createItems;
    }

    function groupGenerator(idx, pageData) {
      var createGroup;
      createGroup = function (rows, group) {
        var groupData;
        groupData = {
          id: group != null ? rows[0][idx.parentId] : void 0,
          label: rows[0][idx.parentLabel],
          nodes: itemGenerator(idx, pageData)(rows)
        };
        return groupData;
      };
      return createGroup;
    }



  });