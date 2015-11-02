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
    './Map/engines/google/mapengine-google',
    './Map/engines/openlayers2/mapengine-openlayers',
    './Map/model/MapSelectionTree',
    './Map/ControlPanel/ControlPanel',
    './Map/Styles',
    './Map/resolveShapes',
    './Map/resolveMarkers',
    './Map/tileServices',
    './Map/ColorMapMixin',
    './Map/ISelector',
    './Map/model/MapInputDataHandler',
    './Map/addIns/mapAddIns',
    'css!./NewMapComponent'],
  function ( $, _, UnmanagedComponent, Logger,
            GoogleMapEngine, OpenLayersEngine,
            MapSelectionTree, ControlPanel,
            Styles,
            resolveShapes, resolveMarkers,
            _tileServices,
            ColorMapMixin, ISelector,
            MapInputDataHandler) {


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
        var idx = {
          id: 0,
          value: 1
        };

        var me = this;
        if (this.mapMode === "shapes") {
          var keys = _.pluck(json.resultset, idx.id);
          this.resolveShapes(this.shapeResolver, this.shapeSource, keys, json)
            .then(function (shapeDefinition) {
              me.shapeDefinition = shapeDefinition;
              Logger.log('Loaded ' + _.size(me.shapeDefinition) + ' shapes', 'debug');
              me.render.call(me, json);
            });
        } else if (this.mapMode === "markers") {
          this.resolveMarkers(this.locationResolver, json)
            .then(function (markerDefinitions) {
              me.markerDefinitions = markerDefinitions;
              me.render.call(me, json);
            });
        } else {
          this.render(json);
        }

      },

      initModel: function (json) {

        this.model = new MapSelectionTree({
          styleMap: this.getStyleMap('global')
        });
        this.model.root().set('mode', this.controlPanel.getMode());
        var me = this;
        this.listenTo(this.controlPanel, 'change:mode', function (model, value) {
          me.model.root().set('mode', value);
        });

        // var series = _.map(json.resultset, function (row, rowIdx) {
        //   return {
        //     id: row[0],
        //     label: row[0],
        //     styleMap: {
        //       unselected: {
        //         'default': {
        //         }
        //       }
        //     },
        //     rowIdx: rowIdx,
        //     rawData: row
        //   };
        // });

        // var markers = {
        //   id: 'markers',
        //   label: 'Markers',
        //   style: this.getStyleMap('markers'),
        //   //nodes: this.mapMode === 'markers' ? series : undefined
        // };

        // var shapes = {
        //   id: 'shapes',
        //   label: 'Shapes',
        //   style: this.getStyleMap('shapes'),
        //   //nodes: this.mapMode === 'shapes' ? series : undefined
        // };

        // if (this.mapMode === 'markers') {
        //   this.model.add(markers);
        // }

        // if (this.mapMode === 'shapes') {
        //   this.model.add(shapes);
        // }

        //TODO: Discover automatically which columns correspond to the key and to the value
        var idx = {
          key: 0,
          value: 1
        };

        var qvalues = _.pluck(json.resultset, idx.value);
        var minValue = _.min(qvalues),
          maxValue = _.max(qvalues);

        var colormap = this.getColorMap();

        var modelTree = {
          id: this.mapMode,
          label: this.mapMode,
          styleMap: this.getStyleMap(this.mapMode),
          minValue: minValue,
          maxValue: maxValue,
          colormap: colormap//,
          //nodes: this.initNodesModel(json)
        };
        this.model.add(modelTree);
        this._addSeriesToModel(json);

      },

      attributeMapping: {
        fill: function (context, seriesRoot, mapping, row, rowIdx) {
          // TODO: Discover automatically which columns correspond to the key and to the value
          var value = row[mapping.fill];
          var colormap = seriesRoot.get('colormap');

          if (_.isNumber(value) && context.mode === 'pan'
            && context.state === 'unselected'
            && context.action === 'normal') {
            return this.mapColor(value,
              seriesRoot.get('minValue'),
              seriesRoot.get('maxValue'),
              colormap
            );
          } else {
            var fillColor = seriesRoot.getStyle(context.mode, context.state, context.action).fill;
            return; //fillColor;
          }
        }
      },

      _addSeriesToModel: function (json) {
        var mapping = {
          id: 0,
          fill: 1
        };

        var me = this;

        var seriesRoot = this.model.findWhere({'id': this.mapMode});
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
          /*
           _.each(me.attributeMapping, function (modeStyle, mode) {
           _.each(modeStyle, function (stateStyle, state) {
           _.each(stateStyle, function (actionStyle, action) {
           _.each(actionStyle, function (value, attr) {
           styleMap[mode] = styleMap[mode] || {};
           styleMap[mode][state] = styleMap[mode][state] || {};
           styleMap[mode][state][action] = styleMap[mode][state][action] || {};
           styleMap[mode][state][action][attr] = _.isFunction(value) ? value.call(me, seriesRoot, row, rowIdx) : value;
           })
           });
           });
           });
           */
          /*
           var styleMapTemplate = {
           'pan': {
           'unselected': {
           'normal': {},
           'hover': {}
           },
           'selected': {
           'normal': {},
           'hover': {}
           }
           },
           'zoombox': {
           'unselected': {
           'normal': {},
           'hover': {}
           },
           'selected': {
           'normal': {},
           'hover': {}
           }
           },
           'selection': {
           'unselected': {
           'normal': {},
           'hover': {}
           },
           'selected': {
           'normal': {},
           'hover': {}
           }
           }
           };
           var modeKeys = _.keys(nodeStyleMap);

           for (var t in modeKeys) {

           //6500 2002

           var modeName = modeKeys[t];
           var stateKeys = _.keys(nodeStyleMap[modeName]);

           for (var i in stateKeys) {

           var stateName = stateKeys[i];
           var actionKeys = _.keys(nodeStyleMap[modeName][stateName]);

           for (var j in actionKeys) {

           var actionName = actionKeys[j];
           var attrList = _.keys(nodeStyleMap[modeName][stateName][actionName]);

           for (var k in attrList) {

           var attrName = attrList[k];
           var attr = nodeStyleMap[modeName][stateName][actionName][attrName];

           if (_.isFunction(attr)) {
           //console.log(modeName + ' / ' + stateName + ' / ' + actionName + ' / ' + attrName);
           styleMapTemplate[modeName][stateName][actionName][attrName] = nodeStyleMap[modeName][stateName][actionName][attrName].call(me, row, rowIdx);
           }
           }
           }
           }
           }
           */
          var shapeDefinition = me.shapeDefinition ? me.shapeDefinition[id] : undefined;
          var markerDefinition = me.markerDefinitions ? me.markerDefinitions[id] : undefined;
          var geoJSON = (me.mapMode === 'shapes') ? shapeDefinition : markerDefinition;

          return {
            id: id,
            label: id,
            styleMap: styleMap,
            geoJSON: geoJSON,
            rowIdx: rowIdx,
            rawData: row
          };

        });

        //console.log(series);
        //return series;

        //this.model.where({'id': this.mapMode})[0].set({'nodes' : series});
        seriesRoot.add(series);

        //Build an hashmap from metadata
        //var mapping = this.getMapping(values);
        //TODO: Discover automatically which columns correspond to the key and to the value
        // var idx = {
        //   key: 0,
        //   value: 1
        // };

        // var defaultShapeStyle = this.getStyleMap('shapes').unselected.default;

        // // Attribute a color each shape
        // var colormap = this.getColorMap();
        // var qvalues = _.pluck(json.resultset, idx.value);
        // var minValue = _.min(qvalues),
        //   maxValue = _.max(qvalues);

        // var me = this;
        // _.each(json.resultset, function (row) {

        //   var shapeDefinition = me.shapeDefinition[row[idx.key]];
        //   var fillColor = me.mapColor(row[idx.value], minValue, maxValue, colormap);
        //   var shapeStyle = _.defaults({
        //     fillColor: fillColor
        //   }, defaultShapeStyle);
        //   var data = {
        //     rawData: row,
        //     key: row[idx.key],
        //     value: row[idx.value],
        //     minValue: minValue,
        //     maxValue: maxValue
        //   };

        //   me.mapEngine.setShape(shapeDefinition, shapeStyle, data);
        // });


      },

      resolveShapes: resolveShapes,
      resolveMarkers: resolveMarkers,

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
          this._initPopup();
          this._relayEvents();
          this.mapEngine.renderMap(ph[0], this.tilesets);
        }, this));
      },

      _initControlPanel: function () {
        var $controlPanel = $('<div class="map-controls" />').appendTo(this.placeholder());
        this.controlPanel = new ControlPanel($controlPanel);
        this.controlPanel.render();
        var eventMapping = {
          'change:mode': function (model, value) {
            var modes = {
              'selection': this.setSelectionMode,
              'zoombox': this.setZoomBoxMode,
              'pan': this.setPanningMode
            };
            modes[value] && modes[value].call(this);
          },
          'zoom:in': this.mapEngine.zoomIn,
          'zoom:out': this.mapEngine.zoomOut,
        };

        var me = this;
        _.each(eventMapping, function (callback, event) {
          if (_.isFunction(callback)) {
            me.listenTo(me.controlPanel, event, _.bind(callback, me.mapEngine));
          }
        });


        this.listenTo(this.controlPanel, 'selection:complete', function () {
          me.processChange();
        });
      },

      render: function (json) {

        this.initModel(json);

        // Mark selected model items
        var idList = this.dashboard.getParameterValue(this.parameter);
        this.setValue(idList);


        var centerLatitude = parseFloat(this.centerLatitude);
        var centerLongitude = parseFloat(this.centerLongitude);
        this.mapEngine.render(this.model);
        this.mapEngine.updateViewport(centerLongitude, centerLatitude, this.defaultZoomLevel);


        // google mapEngine implementation will still fetch data asynchronously before ca
        // so only here can we finish the lifecycle.
        this.postExec();
        this.maybeToggleBlock(false);
      },


      _relayEvents: function () {
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
          });
        });

      },

      _registerEvents: function () {
        /** Registers handlers for mouse events
         *
         */
        var me = this;
        this.on('marker:click', function (event) {
          return;
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
          return;
          //this.mapEngine.showPopup(event.data,  event.feature, 50, 20, "Hello", undefined, 'red'); //Poor man's popup, only seems to work with OpenLayers
          if (_.isFunction(me.shapeMouseOver)) {
            var result = me.shapeMouseOver(event);
            if (result) {
              result = _.isObject(result) ? result : {};
              event.draw(_.defaults(result, {'zIndex': 1}, event.style));
            }
          }
        });

        this.on('shape:mouseout', function (event) {
          //Logger.log('Shape mouseout');
          return;
          var result = {};
          if (_.isFunction(me.shapeMouseOut)) {
            result = me.shapeMouseOut(event);
          }
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
          return;
          if (_.isFunction(me.shapeMouseClick)) {
            var result = me.shapeMouseClick(event);
            if (result) {
              result = _.isObject(result) ? result : {};
              var selStyle = _.defaults(result, event.style);
              //event.setSelectedStyle(selStyle);
              //event.draw(selStyle);
            }
          }
        });
      },

      getStyleMap: function (styleName) {

        // TODO: VERIFICAR A ORIGEM DESSE shapeDefinition e como se encaixa nos varios StyleMaps

        // switch (styleName){
        //   case 'shapes':
        //     return _.defaults({
        //       pan: {
        //         unselected: {
        //           normal: this.shapeSettings
        //         }
        //       }
        //     }, Styles.getStyleMap('shapes'), Styles.getStyleMap('global'));
        // }
        return Styles.getStyleMap(styleName);
      },

      _renderMarker: function (location, row, mapping, position) {
        var myself = this;
        if (location === undefined) {
          Logger.log('Unable to get location for address ' + row[mapping.address] + '. Ignoring element.', 'debug');
          return true;
        }

        var markerIcon;
        var description;

        var markerWidth = myself.markerWidth;
        if (mapping.markerWidth) {
          markerWidth = row[mapping.markerWidth];
        }
        var markerHeight = myself.markerHeight;
        if (mapping.markerHeight) {
          markerHeight = row[mapping.markerHeight];
        }

        var defaultMarkers = false;

        if (mapping.marker) {
          markerIcon = row[mapping.marker];
        }
        if (markerIcon == undefined) {
          var st = {
            data: row,
            position: position,
            width: markerWidth,
            height: markerHeight
          };
          var addinName = this.markerImageGetter;

          //Check for cgg graph marker
          if (this.markerCggGraph) {
            st.cggGraphName = this.markerCggGraph;
            st.parameters = {};
            _.each(this.cggGraphParameters, function (parameter) {
              st.parameters[parameter[0]] = row[mapping[parameter[1]]];
            });
            addinName = 'cggMarker';
          } else {
            //Else resolve to urlMarker addin
            st.url = myself.marker;
            defaultMarkers = (myself.marker == undefined);
            addinName = 'urlMarker';
          }

          if (!addinName) {
            addinName = 'urlMarker';
          }
          var addIn = this.getAddIn("MarkerImage", addinName);
          markerIcon = addIn.call(this.placeholder(), st, this.getAddInOptions("MarkerImage", addIn.getName()));
        }
        if (mapping.description) {
          description = row[mapping.description];
        }


        var markerInfo = { // hack to pass marker information to the mapEngine. This information will be included in the events
          longitude: location[0],
          latitude: location[1],
          defaultMarkers: defaultMarkers,
          position: position,
          mapping: mapping,
          icon: markerIcon,
          width: markerWidth,
          height: markerHeight
        };

        Logger.log('About to render ' + markerInfo.longitude + ' / ' + markerInfo.latitude + ' with marker sized ' + markerHeight + ' / ' + markerWidth + 'and description ' + description, 'debug');
        myself.mapEngine.setMarker(markerInfo, description, row);
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
