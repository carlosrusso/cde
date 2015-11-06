define([
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore',
  './model/MapModel',
  './getMapping',
  './FeatureStore/resolveShapes',
  './FeatureStore/resolveMarkers',
  './Styles'
], function ($, _,
             MapModel,
             getMapping,
             resolveShapes, resolveMarkers,
             Styles) {

  return {
    resolveFeatures: function (json) {
      var mapping = getMapping(json);
      this.mapping = $.extend(true, mapping, this.visualRoles);
      this.features = this.features || {};

      var me = this;
      var deferred;
      if (this.mapMode === "shapes") {
        deferred = this._resolveShapes(json, this.mapping, this.configuration)
          .then(function (shapeDefinition) {
            me.features.shapes = shapeDefinition;
            return json;
          });
      } else if (this.mapMode === "markers") {
        deferred = this._resolveMarkers(json, this.mapping, this.configuration)
          .then(function (markerDefinitions) {
            me.features.markers = markerDefinitions;
            return json;
          });
      } else {
        deferred = $.when(json);
      }
      return deferred.promise();
    },

    _resolveShapes: resolveShapes,

    _resolveMarkers: resolveMarkers,

    initModel: function (json) {

      this.model = new MapModel({
        styleMap: this.getStyleMap('global')
      });

      var colormap = this.getColorMap();
      var modelTree = {
        id: this.mapMode,
        label: this.mapMode,
        styleMap: this.getStyleMap(this.mapMode),
        colormap: colormap
      };
      this.model.add(modelTree);
      if (json && json.metadata && json.resultset) {
        this._addSeriesToModel(json);
      }

    },

    visualRoles: {},

    scales: {
      fill: 'default', //named colormap, or a colormap definition
      r: [10, 20]
    },

    attributeMapping: {
      fill: function (context, seriesRoot, mapping, row, rowIdx) {
        // TODO: Discover automatically which columns correspond to the key and to the value
        var value = row[mapping.fill];
        var useGradient = (context.mode === 'pan' && context.state === 'unselected' && context.action === 'normal');
        useGradient = useGradient || (context.mode === 'selection' && context.state === 'selected' && context.action === 'normal');

        if (_.isNumber(value) && useGradient) {
          var colormap = seriesRoot.get('colormap') || this.getColorMap();
          return this.mapColor(value,
            seriesRoot.get('extremes').fill.min,
            seriesRoot.get('extremes').fill.max,
            colormap
          );
        }
      },
      label: function (context, seriesRoot, mapping, row, rowIdx) {
        return _.isEmpty(row) ? undefined : (row[mapping.label] + '');
      },
      r: function (context, seriesRoot, mapping, row, rowIdx) {
        var value = row[mapping.r];
        if (_.isNumber(value)) {
          var rmin = this.scales.r[0];
          var rmax = this.scales.r[1];
          var v = seriesRoot.get('extremes').r;
          //var r = rmin + (value - v.min)/(v.max - v.min)*(rmax-rmin); //linear scaling
          var r = Math.sqrt(rmin * rmin + (rmax * rmax - rmin * rmin) * (value - v.min) / v.max - v.min); //sqrt scaling
          if (_.isFinite(r)) {
            return r;
          }
        }
      }
    },

    _detectExtremes: function (json) {
      var extremes = _.chain(this.visualRoles)
        .map(function (colIndex, role) {
          if (json.metadata[colIndex].colType !== 'Numeric') {
            return [role, {}];
          }
          var values = _.pluck(json.resultset, colIndex);
          return [role, {
            min: _.min(values),
            max: _.max(values)
          }]
        })
        .object()
        .value();

      return extremes;
    },

    _addSeriesToModel: function (json) {
      var mapping = $.extend({}, this.mapping);
      var seriesRoot = this.model.findWhere({'id': this.mapMode});
      seriesRoot.set('extremes', this._detectExtremes(json));

      var colNames = _.pluck(json.metadata, 'colName');

      var me = this;
      var series = _.map(json.resultset, function (row, rowIdx) {

        var id = row[mapping.id];
        var styleMap = {};
        var modes = ['pan', 'zoombox', 'selection'],
          states = ['unselected', 'selected'],
          actions = ['normal', 'hover'];

        _.each(modes, function (mode) {
          _.each(states, function (state) {
            _.each(actions, function (action) {
              _.each(me.attributeMapping, function (functionOrValue, attribute) {
                if (_.isUndefined(mapping[attribute]) || mapping[attribute] >= row.length) {
                  return; //don't bother running the function when attribute is not mapped to the data
                }
                var context = {
                  mode: mode,
                  state: state,
                  action: action
                };
                var value = _.isFunction(functionOrValue) ? functionOrValue.call(me, context, seriesRoot, mapping, row, rowIdx) : functionOrValue;
                if (_.isUndefined(value)) {
                  return;
                }
                styleMap[mode] = styleMap[mode] || {};
                styleMap[mode][state] = styleMap[mode][state] || {};
                styleMap[mode][state][action] = styleMap[mode][state][action] || {};
                styleMap[mode][state][action][attribute] = value;
              });
            });
          });

        });

        var shapeDefinition = me.features.shapes ? me.features.shapes[id] : undefined;
        var markerDefinition = me.features.markers ? me.features.markers[id] : undefined;
        var geoJSON = (seriesRoot.get('id') === 'shapes') ? shapeDefinition : markerDefinition;

        return {
          id: id,
          label: id,
          styleMap: styleMap,
          geoJSON: geoJSON,
          rowIdx: rowIdx,
          rawData: row,
          data: _.object(_.zip(colNames, row))
        };

      });

      seriesRoot.add(series);
    },

    getStyleMap: function (styleName) {
      var localStyleMap = this.styleMap || {};
      var styleMap = $.extend(true, {}, Styles.getStyleMap(styleName), localStyleMap.global, localStyleMap[styleName]);
      // TODO: should we just drop this?
      switch (styleName) {
        case 'shape0s':
          return $.extend(true, styleMap, {
            pan: {
              unselected: {
                normal: this.shapeSettings
              }
            }
          });
      }
      return styleMap;
    }


  };

});