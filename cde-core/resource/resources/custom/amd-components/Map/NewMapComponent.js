/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

/**
 *
 * NewMapComponent
 *
 * Places markers on a map or represents values as a color code
 *

 Changelog 2014-02-27 -------------
 Support for representing data as a colored shape in a map,
 e.g. population of a country using a color map.

 New CDE properties:
 - mapMode = markers, shapes, just the map
 - colormap = [[0,0,0,255],[255,255,255,0]] (RGBA array for defining the colormap of the shapes)
 - shapeSource: file/url with the shape definitions
 - shapeMouseOver, shapeMouseOut, shapeMouseClick: callbacks for handling shapes
 - tilesets: which of the tilesets to use for rendering the map (added support for about 30 tilesets)

 Internal changes:
 - renamed OpenStreetMapEngine to OpenLayersEngine, modified mapEngineType enums to "openlayers" (default), "google"
 - added a bunch of functions to the map engines

 Features:

 1) SHAPES:
 Loading of shapes in the following file formats
 - GeoJSON (used as the internal representation of shapes and markers)
 - JSON (not quite the same format as Kleyson's gmapsoverlay component)
 - KML (google earth)

 Goodies:
 - possibility to reduce the number of points (useful for importing KML and exporting to JSON)
 - abstracted the interface to the map engines for simple tasks like changing the color of the shape on mouseover/click

 TODO:
 - smart detection of columns in the datasource, as it is currently done with the markers. Currently key=column[0], value = column[1]
 - ability to have both markers and shapes in the same datasource
 - consider supporting GeoJSON format

 2) TILES (png images representing the map)
 OpenStreetMaps default tiles are ugly, I found many nicer tilesets that work in both map engines (google/openlayers)
 To compare the various tilesets, visit http://mc.bbbike.org/mc/?num=2

 Example of valid values for the CDE property "tilesets"
 'mapquest'
 ['mapquest']
 ['mapquest', 'apple']
 'custom/static/localMapService/${z}/${x}/${y}.png'
 "http://otile1.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.png"
 "http://otile{switch:1,2,3,4}.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.png"

 3) TODOs/Ideas

 - Write map engines for jvectormap, openlayers3
 - improve handling of markers and popups
 - implement firing of "marker:mouseout" and "marker:mouseover" events and add corresponding callbacks
 - generalize handling of colours (shapes currently support only RGBA )

 *
 */

define([
    'cdf/lib/jquery',
    'amd!cdf/lib/underscore',
    'cdf/components/UnmanagedComponent',
    'cdf/Logger',
    './Map/ISelector',
    './Map/ColorMapMixin',
    './Map/model/MapSelectionTree',
    './Map/ControlPanel/ControlPanel',
    './Map/getMapping',
    './Map/FeatureStore/resolveShapes',
    './Map/FeatureStore/resolveMarkers',
    './Map/Styles',
    './Map/tileServices',
    './Map/engines/openlayers2/mapengine-openlayers',
    './Map/engines/google/mapengine-google',
    './Map/addIns/mapAddIns',
    'css!./NewMapComponent'
  ],
  function ($, _, UnmanagedComponent, Logger,
            ISelector, ColorMapMixin,
            MapSelectionTree, ControlPanel,
            getMapping,
            resolveShapes, resolveMarkers,
            Styles, _tileServices,
            OpenLayersEngine, GoogleMapEngine) {


    var NewMapComponent = UnmanagedComponent.extend(ISelector).extend(ColorMapMixin).extend({
      ph: undefined, //perhaps this is not needed
      mapEngine: undefined, // points to one instance of a MapEngine object
      locationResolver: undefined, // addIn used to process location
      //shapeResolver: undefined, // addIn used to process location
      API_KEY: false, // API KEY for map services such as Google Maps
      // Properies defined in CDE
      //mapMode: ['', 'markers', 'shapes'][1],
      //shapeDefinition: undefined,
      //shapeSource: '',
      //tilesets: ['mapquest'],
      //colormap: [[0, 102, 0, 255], [255, 255 ,0,255], [255, 0,0, 255]], //RGBA
      tileServices: _tileServices,
      otherTileServices: [
        // These are tilesets using special code
        //'google'
      ],
      tileServicesOptions: {
        // WIP: interface for overriding defaults
        'apple': {minZoom: 3, maxZoom: 14}
      },
      // shapeMouseOver : function(event){
      //     Logger.log('Currently at lat=' + event.latitude + ', lng=' + event.longitude + ': Beat '+ event.data.key + ':' + event.data.value + ' crimes');
      //     return {
      //         fillColor: 'blue',
      //         fillOpacity: 1,
      //         strokeColor: 'white',
      //         strokeWidth: 2
      //     };

      // },
      // shapeMouseOut: undefined,
      // // function(event){
      // //         return event.style;
      // // },
      // shapeMouseClick: function(event){
      //     return {
      //         fillColor: 'red',
      //         fillOpacity: 1
      //     };
      // },
      // // End
      update: function () {
        if (!this.preExec()) {
          return false;
        }
        this.maybeToggleBlock(true);

        this._registerEvents();
        if (_.isString(this.tilesets)) {
          this.tilesets = [this.tilesets];
        }

        this.init().then(_.bind(function () {
          if (this.queryDefinition && !_.isEmpty(this.queryDefinition)) {
            this.getQueryData();
          } else {
            // No datasource, we'll just display the map
            this.onDataReady(this.testData || {});
          }
        }, this));
      },

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

      onDataReady: function (json) {

        var mapping = getMapping(json);
        this.mapping = $.extend(true, mapping, this.visualRoles);

        var me = this;
        if (this.mapMode === "shapes") {
          this.resolveShapes(json, this.mapping, this.shapeResolver, this.shapeSource)
            .then(function (shapeDefinition) {
              me.shapeDefinition = shapeDefinition;
              me.render.call(me, json);
            });
        } else if (this.mapMode === "markers") {
          this.resolveMarkers(json, this.mapping, this.locationResolver)
            .then(function (markerDefinitions) {
              me.markerDefinitions = markerDefinitions;
              me.render.call(me, json);
            });
        } else {
          this.render(json);
        }

      },


      init: function () {
        //var inputOptions = {};
        //this.inputDataHandler = new MapInputDataHandler(inputOptions);

        var options = {
          API_KEY: this.API_KEY || window.API_KEY, //either local or global API_KEY
          tileServices: this.tileServices,
          tileServicesOptions: this.tileServicesOptions
        };


        if (this.mapEngineType == 'google') {
          this.mapEngine = new GoogleMapEngine(options);
        } else {
          this.mapEngine = new OpenLayersEngine(options);
        }

        return this.mapEngine.init().then(_.bind(function () {
          var ph = this.placeholder().empty();
          this._initControlPanel();
          this._relayMapEngineEvents();
          this.mapEngine.renderMap(ph[0], this.tilesets);
          this._initPopup();
        }, this));
      },

      _initControlPanel: function () {
        var $controlPanel = $('<div class="map-controls" />').appendTo(this.placeholder());
        this.controlPanel = new ControlPanel($controlPanel);
        this.controlPanel.render();
        var me = this;
        var eventMapping = {
          'selection:complete': _.bind(this.processChange, this),
          'zoom:in': _.bind(this.mapEngine.zoomIn, this.mapEngine),
          'zoom:out': _.bind(this.mapEngine.zoomOut, this.mapEngine)
        };

        _.each(eventMapping, function (callback, event) {
          if (_.isFunction(callback)) {
            me.listenTo(me.controlPanel, event, callback);
          }
        });
      },

      render: function (json) {
        this.initModel(json);
        this.updateSelection();

        this._processMarkerImages();

        this.mapEngine.render(this.model);
        var centerLatitude = parseFloat(this.centerLatitude);
        var centerLongitude = parseFloat(this.centerLongitude);
        this.mapEngine.updateViewport(centerLongitude, centerLatitude, this.defaultZoomLevel);

        // google mapEngine implementation will still fetch data asynchronously before ca
        // so only here can we finish the lifecycle.
        this.postExec();
        this.maybeToggleBlock(false);
      },


      _relayMapEngineEvents: function () {
        var engine = this.mapEngine;
        var component = this;
        var events = [
          'marker:click', 'marker:mouseover', 'marker:mouseout',
          'shape:click', 'shape:mouseover', 'shape:mouseout'
        ];
        _.each(events, function (event) {
          component.listenTo(engine, event, function () {
            var args = _.union([event], arguments);
            component.trigger.apply(component, args);
            //console.log('Relayed event: ', event);
          });
        });

      },

      _registerEvents: function () {
        /** Registers handlers for mouse events
         *
         */
        var me = this;
        this.on('marker:click', function (event) {
          var result;
          if (_.isFunction(me.markerClickFunction)) {
            result = me.markerClickFunction(event);
          }
          if (result !== false) {
            // built-in click handler for markers
            me.markerClickCallback(event);
          }
        });

        // Marker mouseover/mouseout events are not yet completely supported
        // this.on('marker:mouseover', function(event){
        //   // Logger.log('Marker mouseover');
        // });
        // this.on('marker:mouseout', function(event){
        //   Logger.log('Marker mouseout');
        // });

        this.on('shape:mouseover', function (event) {
          // Logger.log('Shape mouseover');
          //this.mapEngine.showPopup(event.data,  event.feature, 50, 20, "Hello", undefined, 'red'); //Poor man's popup, only seems to work with OpenLayers
          if (_.isFunction(me.shapeMouseOver)) {
            var result = me.shapeMouseOver(event);
            return;
            if (result) {
              result = _.isObject(result) ? result : {};
              event.draw(_.defaults(result, {'zIndex': 1}, event.style));
            }
          }
        });

        this.on('shape:mouseout', function (event) {
          //Logger.log('Shape mouseout');
          var result = {};
          if (_.isFunction(me.shapeMouseOut)) {
            result = me.shapeMouseOut(event);
          }
          return;
          result = _.isObject(result) ? result : {};
          if (event.isSelected()) {
            event.draw(_.defaults(result, event.getSelectedStyle()));
          } else if (_.size(result) > 0) {
            event.draw(_.defaults(result, event.style));
          } else if (me.shapeMouseOver) {
            event.draw(event.style);
          }

        });

        this.on('shape:click', function (event) {
          me.processChange();
          if (_.isFunction(me.shapeMouseClick)) {
            var result = me.shapeMouseClick(event);
            return;
            if (result) {
              result = _.isObject(result) ? result : {};
              var selStyle = _.defaults(result, event.style);
              //event.setSelectedStyle(selStyle);
              //event.draw(selStyle);
            }
          }
        });
      },


      resolveShapes: resolveShapes,
      resolveMarkers: resolveMarkers,

      initModel: function (json) {

        this.model = new MapSelectionTree({
          styleMap: this.getStyleMap('global')
        });

        this.model.root().set('mode', this.controlPanel.getMode());
        var me = this;
        this.listenTo(this.controlPanel, 'change:mode', function (model, value) {
          me.model.root().set('mode', value);
        });

        var colormap = this.getColorMap();

        var modelTree = {
          id: this.mapMode,
          label: this.mapMode,
          styleMap: this.getStyleMap(this.mapMode),
          colormap: colormap//,
          //nodes: this.initNodesModel(json)
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
            var qvalues = _.pluck(json.resultset, colIndex);
            var minValue = _.min(qvalues),
              maxValue = _.max(qvalues);
            return [role, {
              min: minValue,
              max: maxValue
            }]
          })
          .object()
          .value();

        return extremes;
      },

      _addSeriesToModel: function (json) {
        var mapping = $.extend({}, this.mapping);

        console.log(this.name, 'visualRoles', this.visualRoles);

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

          var shapeDefinition = me.shapeDefinition ? me.shapeDefinition[id] : undefined;
          var markerDefinition = me.markerDefinitions ? me.markerDefinitions[id] : undefined;
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
      },

      _processMarkerImages: function () {
        var markersRoot = this.model.findWhere({id: 'markers'});
        if (!markersRoot) {
          return;
        }

        var state = {
          height: this.markerHeight,
          width: this.markerWidth,
          url: this.marker
        };

        markersRoot.flatten()
          .filter(function (m) {
            // just the leafs
            return m.children() == null;
          })
          .each(_.bind(processRow, this))
          .value();

        function processRow(m) {
          var mapping = this.mapping;
          var row = m.get('rawData');
          var st = $.extend(true, {}, state, {
            data: row,
            position: m.get('rowIdx'),
            height: row[mapping.markerHeight],
            width: row[mapping.markerWidth]
          });


          // Select addIn, consider all legacy special cases
          var addinName,
            extraSt = {},
            extraOpts = {};
          if (this.markerCggGraph) {
            addinName = 'cggMarker';
            extraSt = {
              cggGraphName: this.markerCggGraph,
              parameters: _.object(_.map(this.cggGraphParameters, function (parameter) {
                return [parameter[0], row[mapping[parameter[1]]]];
              }))
            };
          } else {
            addinName = this.markerImageGetter;
          }

          // Invoke addIn
          var addIn = this.getAddIn("MarkerImage", addinName);
          if (!addIn) {
            return;
          }
          $.extend(true, st, extraSt);
          var opts = $.extend(true, {}, this.getAddInOptions("MarkerImage", addIn.getName()), extraOpts);
          var markerIconUrl = addIn.call(this.placeholder(), st, opts);

          // Update model's style
          $.extend(true, m.attributes.styleMap, {
            pan: {
              unselected: {
                normal: {
                  // TODO: works for now, for openlayers. must improve this
                  graphicWidth: st.width,
                  graphicHeight: st.height,
                  externalGraphic: markerIconUrl
                }
              }
            }
          });
        }
      },

      /**
       * Legacy stuff I'd like to delete
       */


      _initPopup: function () {
        var $popupContentsDiv = $("#" + this.popupContentsDiv);
        var $popupDivHolder = $popupContentsDiv.clone();
        //after first render, the popupContentsDiv gets moved inside ph, it will be discarded above, make sure we re-add him
        if (this.popupContentsDiv && $popupContentsDiv.length != 1) {
          this.placeholder().append($popupDivHolder.html("None"));
        }
      },
      markerClickCallback: function (event) {
        return;
        var elt = event.data;
        var defaultMarkers = event.marker.defaultMarkers;
        var mapping = event.marker.mapping;
        var position = event.marker.position;
        var me = this;
        _.each(this.popupParameters, function (eltA) {
          me.dashboard.fireChange(eltA[1], event.data[mapping[eltA[0].toLowerCase()]]);
        });

        if (this.popupContentsDiv || mapping.popupContents) {
          var contents;
          if (mapping.popupContents) contents = elt[mapping.popupContents];
          var height = mapping.popupContentsHeight ? elt[mapping.popupContentsHeight] : undefined;
          var width = mapping.popupContentsWidth ? elt[mapping.popupContentsWidth] : undefined;
          height = height || this.popupHeight;
          width = width || this.popupWidth;
          //  if (!contents) contents = $("#" + myself.popupContentsDiv).html();

          var borderColor = undefined;
          if (defaultMarkers) {
            var borderColors = ["#394246", "#11b4eb", "#7a879a", "#e35c15", "#674f73"];
            borderColor = borderColors[position % 5];
          }
          this.mapEngine.showPopup(event.data, event.feature, height, width, contents, this.popupContentsDiv, borderColor);
        }
      }


    });


    return NewMapComponent;

  });
