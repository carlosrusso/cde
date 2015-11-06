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

define([
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore',
  '../mapengine',
  './MapComponentAsyncLoader',
  '../../model/SelectionStates',
  'css!./style-google'
], function ($, _, MapEngine, MapComponentAsyncLoader, SelectionStates) {

  function OurMapOverlay(startPoint, width, height, htmlContent, popupContentDiv, map, borderColor) {

    // Now initialize all properties.
    this.startPoint_ = startPoint;
    this.width_ = width;
    this.height_ = height;
    this.map_ = map;
    this.htmlContent_ = htmlContent;
    this.popupContentDiv_ = popupContentDiv;
    this.borderColor_ = borderColor;

    this.div_ = null;

    // Explicitly call setMap() on this overlay
    this.setMap(map);
  }


  var GoogleMapEngine = MapEngine.extend({
    map: undefined,
    centered: false,
    overlays: [],
    API_KEY: false,
    selectedFeature: undefined,
    
    constructor: function(options) {
      this.base();
      //$.extend(this, options);
      this.controls = {}; // map controls
    },
    
    init: function () {
      return $.when(MapComponentAsyncLoader('3', this.API_KEY)).then(
        function (status) {
          OurMapOverlay.prototype = new google.maps.OverlayView();
          OurMapOverlay.prototype.onAdd = function () {
            // Note: an overlay's receipt of onAdd() indicates that
            // the map's panes are now available for attaching
            // the overlay to the map via the DOM.

            // Create the DIV and set some basic attributes.
            var div = document.createElement('DIV');
            div.id = 'MapOverlay';
            div.style.position = "absolute";

            if (this.borderColor_) {
              div.style.border = '3px solid ' + this.borderColor_;
            } else {
              div.style.border = "none";
            }


            /*      var myself = this;
             var closeDiv = $("<div id=\"MapOverlay_close\" class=\"olPopupCloseBox\" style=\"position: absolute;\"></div>");
             closeDiv.click(function () {
             myself.setMap(null);
             });

             $(div).append(closeDiv);
             */
            if (this.popupContentDiv_ && this.popupContentDiv_.length > 0) {
              $(div).append($('#' + this.popupContentDiv_));
            } else
              div.innerHTML = this.htmlContent_;


            //Using implementation described on http://web.archive.org/web/20100522001851/http://code.google.com/apis/maps/documentation/javascript/overlays.html
            // Set the overlay's div_ property to this DIV
            this.div_ = div;

            // We add an overlay to a map via one of the map's panes.
            // We'll add this overlay to the overlayImage pane.
            var panes = this.getPanes();
            panes.overlayLayer.appendChild(div);
          };


          //Using implementation described on http://web.archive.org/web/20100522001851/http://code.google.com/apis/maps/documentation/javascript/overlays.html
          OurMapOverlay.prototype.draw = function () {
            // Size and position the overlay. We use a southwest and northeast
            // position of the overlay to peg it to the correct position and size.
            // We need to retrieve the projection from this overlay to do this.
            var overlayProjection = this.getProjection();

            // Retrieve the southwest and northeast coordinates of this overlay
            // in latlngs and convert them to pixels coordinates.
            // We'll use these coordinates to resize the DIV.
            var sp = overlayProjection.fromLatLngToDivPixel(this.startPoint_);

            // Resize the DIV to fit the indicated dimensions.
            var div = this.div_;
            div.style.left = sp.x + 'px';
            div.style.top = (sp.y + 30) + 'px';
            div.style.width = this.width_ + 'px';
            div.style.height = this.height_ + 'px';
          };


          OurMapOverlay.prototype.onRemove = function () {
            if (this.popupContentDiv_) {
              // $('#' + this.popupContentDiv_).append($(this.div_));
              // $(this.div_).detach();
            }
            this.div_.style.display = 'none';
            // this.div_.parentNode.removeChild(this.div_);
            // this.div_ = null;
          };

        });
    },

//    toNativeStyle: function (foreignStyle) {
//      var validStyle = {};
//      _.each(foreignStyle, function (value, key) {
//        switch (key) {
//          case 'strokeWidth':
//            validStyle['strokeWeight'] = value;
//            break;
//          case 'zIndex':
//          case 'visible':
//          case 'fillColor':
//          case 'fillOpacity':
//          case 'strokeColor':
//          case 'strokeOpacity':
//            validStyle[key] = value;
//        }
//      });
//      return validStyle;
//    },

    wrapEvent: function (event, featureType) {
      var me = this;
      return {
        id: event.feature.getId(),
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng(),
        data: me.model.findWhere({id: event.feature.getId()}).get('data'),
        feature: event.feature,
        featureType: featureType,
        style: me.model.findWhere({id: event.feature.getId()}).getStyle(),
        mapEngineType: 'google3',
        draw: function (style) {
          // this function is currently called by the shape callbacks
          var validStyle = me.toNativeStyle(style);
          feature.setOptions(validStyle);
          feature.setVisible(false);
          feature.setVisible(_.has(style, 'visible') ? !!style.visible : true);
        },
        setSelectedStyle: function (style) {
          feature.selStyle = style;
        },
        getSelectedStyle: function () {
          return feature.selStyle;
        },
        isSelected: function () {
          return me.selectedFeature && me.selectedFeature[0] === data.key;
        },
        raw: event
      };
    },
      
    /*----------------------------*/
    
    renderMap: function (target) {
      
      var me = this;

      var mapOptions = {
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      // Add base map
      this.map = new google.maps.Map(target, mapOptions);
      
      // Set initial styleMap for the feature 
      this.map.data.setStyle(function(feature) {
        
        return me.toNativeStyle( me.model.findWhere({id: feature.getId()}).inferStyle('normal') );

//        return {/** @type {google.maps.Data.StyleOptions} */
//          fillColor: "blue"
//        }
        
      });
      
      this.addControls();

      registerViewportEvents.call(this);
    },
    
    renderItem: function (modelItem) {
      
      var me = this;
      
      if (!modelItem) {
        return;
      }
      var row = modelItem.get('rawData');
      var data = {
        rawData: row,
        key: row && row[0]
        //value: row[idx.value],
      };
//      var layer = this.layers[modelItem.getFeatureType()[1]];
      var featureType = modelItem.getFeatureType();
      var geoJSON = modelItem.get('geoJSON');
      var me = this;
      $.when(geoJSON).then(function (feature) {
        if (!feature) {
          return;
        }

        //set id for the feature
        $.extend(true, feature, {
          properties: {
            id: modelItem.get('id')
          }
        });

        var f = me.map.data.addGeoJson(feature, {idPropertyName: 'id'});
        
        var style = me.toNativeStyle( modelItem.inferStyle('normal') );
        
        //me.map.data.overrideStyle(feature, style);
//        var style = modelItem.inferStyle('normal');
//        $.extend(true, f, {
//          attributes: {
//            model: modelItem,
//            data: data
//          },
//          style: me.toNativeStyle(style)
//        });
//        layer.addFeatures([f]);
        console.log(1);
      });

    },
    
    toNativeStyle: function (foreignStyle) {
      var conversionTable = {
        // SVG standard attributes : OpenLayers2 attributes
        'fill': 'fillColor',
        'fill-opacity': 'fillOpacity',
        'stroke': 'strokeColor',
        'stroke-opacity': 'strokeOpacity',
        'stroke-width': 'strokeWeight',
        //Backwards compatibility
        'fillColor': 'fillColor',
        'fillOpacity': 'fillOpacity',
        'strokeColor': 'strokeColor',
        'strokeOpacity': 'strokeOpacity',
        'strokeWeight': 'strokeWeight',
        'zIndex': 'zIndex'
      };
      var validStyle = {};
      _.each(foreignStyle, function (value, key) {
        var nativeKey = conversionTable[key];
        if (nativeKey) {
          validStyle[nativeKey] = value;
        } else {
          switch (key) {
            case 'visible':
              validStyle['display'] = value ? true : 'none';
              break;
            default:
              // be permissive about the validation
              validStyle[key] = value;
              break
          }
        }
      });
      //console.log('foreign vs valid:', foreignStyle, validStyle);
      return validStyle;
    },
    
    addControls: function () {
      
      //this._addControlClick();
      this._addControlZoomBox();
      this._addControlBoxSelector();
      
    },
    
    _checkSelectionContainFeature: function(area, id) {

      if (this.model.findWhere({id:id}).get('geoJSON') != undefined) {
        
        var geometry = this.model.findWhere({id:id}).get('geoJSON').geometry;

        if (geometry.type == 'MultiPolygon') {

          var result = _.some(geometry.coordinates, function(value) {

            return _.some(value, function(value) {

              return _.some(value, function(value) {

                var latLng = new google.maps.LatLng(value[1], value[0]);

                return area.getBounds().contains(latLng);

              });

            });

          });


          return result;

        }
      }
    },

    _removeControlZoomBox: function() {
      
      this.controls.zoomBox.listenersHandle.mousedown.remove();
      this.controls.zoomBox.listenersHandle.mouseup.remove();
      this.controls.zoomBox.listenersHandle.mousemove.remove();
      
    },
    
    _removeControlBoxSelector: function() {
      
      this.controls.boxSelector.listenersHandle.mousedown.remove();
      this.controls.boxSelector.listenersHandle.mouseup.remove();
      this.controls.boxSelector.listenersHandle.mousemove.remove();
      this.controls.boxSelector.listenersHandle.click.remove();
      
    },

    _addControlZoomBox: function() {
      
      var me = this;  
      
      me.controls.zoomBox = {};
      me.controls.zoomBox.bounds = null;
      me.controls.zoomBox.gribBoundingBox = null;
      me.controls.zoomBox.mouseIsDown = false;
      me.controls.zoomBox.listenersHandle = {};
      
    },

    _addControlBoxSelector: function() {
      
      var me = this;  
      
      me.controls.boxSelector = {};
      me.controls.boxSelector.bounds = null;
      me.controls.boxSelector.gribBoundingBox = null;
      me.controls.boxSelector.mouseIsDown = false;
      me.controls.boxSelector.listenersHandle = {};
      
    },
    
    _addControlClick: function () {
      
      var me = this;
      
      this.map.data.addListener('click', function(e) {

        var featureType = me.model.findWhere({id: e.feature.getId()}).getFeatureType();
        
//        me.trigger(featureType + ':click', me.wrapEvent(e));
        me.trigger('shape' + ':click', me.wrapEvent(e));
        
      });
      
    },

    zoomIn: function () {
      console.log('zoomIn');
      this.mapEngine.map.setZoom(this.mapEngine.map.getZoom() + 1);
    },

    zoomOut: function () {
      console.log('zoomOut');
      this.mapEngine.map.setZoom(this.mapEngine.map.getZoom() - 1);
    },
    
    setSelectionMode: function () {

      var me = this;
      
      me.controls.boxSelector.listenersHandle.click = me.map.data.addListener('click', function(event) {
        
        var id = event.feature.getId();
        var modelItem = me.model.findWhere({id:id});
        
        modelItem.setSelection( (modelItem.getSelection() === SelectionStates.ALL) ? SelectionStates.NONE : SelectionStates.ALL);
              
        var style = me.toNativeStyle( modelItem.inferStyle('normal') );
              
        me.map.data.overrideStyle(event.feature, style);

      });
      
      me.controls.boxSelector.listenersHandle.mousedown = google.maps.event.addListener(this.map, 'mousedown', function (e) {
        
        var mode = me.model.root().get('mode');
        
        if (mode == 'selection') {
          
            me.controls.boxSelector.mouseIsDown = true;
            me.controls.boxSelector.mouseDownPos = e.latLng;
            me.map.setOptions({
                draggable: false
            });
        }

      });

      me.controls.boxSelector.listenersHandle.mouseup = google.maps.event.addListener(this.map, 'mouseup', function (e) {
        
        var mode = me.model.root().get('mode');
        
        if (mode == 'selection' && me.controls.boxSelector.mouseIsDown) {
          
          me.controls.boxSelector.mouseIsDown = false;
          me.controls.boxSelector.mouseUpPos = e.latLng;
          
          var boundsSelectionArea = new google.maps.LatLngBounds(
              me.controls.boxSelector.gribBoundingBox.getBounds().getSouthWest(), 
              me.controls.boxSelector.gribBoundingBox.getBounds().getNorthEast()
          );
          
          console.log('a');
          
          me.model.flatten().filter(function (m) {
            return m.children() == null;
          }).each(function (m) {
  
            var id = m.get('id');

            var result = me._checkSelectionContainFeature(me.controls.boxSelector.gribBoundingBox, id);
            
            // Area contains shape
            if (result) {
              
              m.setSelection( (m.getSelection() === SelectionStates.ALL) ? SelectionStates.NONE : SelectionStates.ALL);
              
              var style = me.toNativeStyle( m.inferStyle('normal') );
              var feature = me.map.data.getFeatureById(id);
              
              me.map.data.overrideStyle(feature, style);
            }
            
            else {
              m.setSelection(SelectionStates.NONE);
            }
              
          });
          
          //me.map.fitBounds( boundsSelectionArea );
          
          me.controls.boxSelector.gribBoundingBox.setMap(null);
          me.controls.boxSelector.gribBoundingBox = null;

          me.map.setOptions({
            draggable: true
          });
          
        }
      });
      
      me.controls.boxSelector.listenersHandle.mousemove = google.maps.event.addListener(this.map, 'mousemove', function (e) {

        var mode = me.model.root().get('mode');
        
        if (mode == 'selection' && me.controls.boxSelector.mouseIsDown) {
          
          if (me.controls.boxSelector.gribBoundingBox !== null) // box exists
          {
            me.controls.boxSelector.bounds.extend(e.latLng);                
            me.controls.boxSelector.gribBoundingBox.setBounds(me.controls.boxSelector.bounds); // If this statement is enabled, I lose mouseUp events

          } else // create bounding box
          {
            me.controls.boxSelector.bounds = new google.maps.LatLngBounds();
            me.controls.boxSelector.bounds.extend(e.latLng);
            me.controls.boxSelector.gribBoundingBox = new google.maps.Rectangle({
              map: me.map,
              bounds: me.controls.boxSelector.bounds,
              fillOpacity: 0.15,
              strokeWeight: 0.9,
              clickable: false
            });
          }
        }
      });
      
      console.log('Box mode enable');
      this.updateFeatures();
    },

    setZoomBoxMode: function () {

      var me = this;
      
      me.controls.zoomBox.listenersHandle.mousedown = google.maps.event.addListener(this.map, 'mousedown', function (e) {
        
        var mode = me.model.root().get('mode');
        
        if (mode == 'zoombox') {
          
            me.controls.zoomBox.mouseIsDown = true;
            me.controls.zoomBox.mouseDownPos = e.latLng;
            me.map.setOptions({
                draggable: false
            });
        }

      });

      me.controls.zoomBox.listenersHandle.mouseup = google.maps.event.addListener(this.map, 'mouseup', function (e) {
        
        var mode = me.model.root().get('mode');
        
        if (mode == 'zoombox' && me.controls.zoomBox.mouseIsDown) {
          
          me.controls.zoomBox.mouseIsDown = false;
          me.controls.zoomBox.mouseUpPos = e.latLng;
          
          var boundsSelectionArea = new google.maps.LatLngBounds(
              me.controls.zoomBox.gribBoundingBox.getBounds().getSouthWest(), 
              me.controls.zoomBox.gribBoundingBox.getBounds().getNorthEast()
          );
          
          me.map.fitBounds( boundsSelectionArea );
          
          me.controls.zoomBox.gribBoundingBox.setMap(null);
          me.controls.zoomBox.gribBoundingBox = null;

          me.map.setOptions({
            draggable: true
          });
          
        }
      });
      
      me.controls.zoomBox.listenersHandle.mousemove = google.maps.event.addListener(this.map, 'mousemove', function (e) {

        var mode = me.model.root().get('mode');
        
        if (mode == 'zoombox' && me.controls.zoomBox.mouseIsDown) {
          
          if (me.controls.zoomBox.gribBoundingBox !== null) // box exists
          {
            me.controls.zoomBox.bounds.extend(e.latLng);                
            me.controls.zoomBox.gribBoundingBox.setBounds(me.controls.zoomBox.bounds); // If this statement is enabled, I lose mouseUp events

          } else // create bounding box
          {
            me.controls.zoomBox.bounds = new google.maps.LatLngBounds();
            me.controls.zoomBox.bounds.extend(e.latLng);
            me.controls.zoomBox.gribBoundingBox = new google.maps.Rectangle({
              map: me.map,
              bounds: me.controls.zoomBox.bounds,
              fillOpacity: 0.15,
              strokeWeight: 0.9,
              clickable: false
            });
          }
        }
      });
      
      
      console.log('Zoom mode enable');
      this.updateFeatures();
    },
    
    setPanningMode: function() {
      this._removeControlZoomBox();
      this._removeControlBoxSelector();
      console.log('Selection mode enable');

      this.updateFeatures();
    },
    
    updateFeatures: function() {
      
      // revertStyle deveria disparar setStyle para todas as features. mas nao esta
      this.map.data.revertStyle();
      
      // Codigo temporario
      
      var me = this;
      
      me.model.flatten().filter(function (m) {
        return m.children() == null;
      }).each(function (m) {

        var id = m.get('id');

        var style = me.toNativeStyle( m.inferStyle('normal') );
        var feature = me.map.data.getFeatureById(id);

        me.map.data.overrideStyle(feature, style);

      });
      
      
    },
  
    /*-----------------------------*/


    __setShape1: function (multiPolygon, shapeStyle, data) {
      // Attempt at using GeoJSON as a viewModel
      var shapes = this.map.data.addGeoJson(multiPolygon);
      return;
    },


    __setShape: function (feature, shapeStyle, data) {
      if (!feature) {
        return;
      }
      var myself = this;

      var multiPolygon;
      switch (feature.geometry.type) {
        case 'MultiPolygon':
          multiPolygon = feature.geometry.coordinates;
          break;
        case 'Polygon':
          multiPolygon = [feature.geometry.coordinates];
          break;
        case 'LineString':
          multiPolygon = [[feature.geometry.coordinates]];
          break;
        default:
          return;
      }

      // It seems that Google Maps does not support multipolygons, so we have to register each polygon instead.
      var feature = _.map(multiPolygon, function (polygon) {
        var polygonGM = _.map(polygon, function (ring) {
          return _.map(ring, function (lonlat) {
            return new google.maps.LatLng(lonlat[1], lonlat[0]);
          });
        });

        var shape = new google.maps.Polygon(_.extend({
          paths: polygonGM
        }, myself.toNativeStyle(shapeStyle)));
        shape.setMap(myself.map);
        return shape;
      });


      // We'll have to use a trick to emulate the callbacks on multipolygons...
      _.each(feature, function (featurePolygon) {
        // We'll have to use a trick to emulate the multipolygons...
        google.maps.event.addListener(featurePolygon, 'click', function (event) {
          myself.unselectPrevShape(data.key, feature, shapeStyle);
          addEventToFeature('shape:click', event, feature, shapeStyle, data);
        });
        google.maps.event.addListener(featurePolygon, 'mousemove', function (event) {
          addEventToFeature('shape:mouseover', event, feature, shapeStyle, data);
        });
        google.maps.event.addListener(featurePolygon, 'mouseout', function (event) {
          addEventToFeature('shape:mouseout', event, feature, shapeStyle, data);
        });
      });

      function addEventToFeature(eventName, event, feature, shapeStyle, data) {
        _.each(feature, function (f) {
          myself.trigger(eventName, myself.wrapEvent(event, f, 'shape', shapeStyle, data));
        });
      }

    },

    unselectPrevShape: function (key, shapes, shapeStyle) {
      var myself = this;
      var prevSelected = this.selectedFeature;
      if (prevSelected && prevSelected[0] !== key) {
        var prevShapes = prevSelected[1];
        var prevStyle = prevSelected[2];
        _.each(prevShapes, function (s) {
          var validStyle = myself.toNativeStyle(prevStyle);
          s.setOptions(validStyle);
          s.setVisible(false);
          s.setVisible(_.has(prevStyle, 'visible') ? !!prevStyle.visible : true);
        });
      }
      this.selectedFeature = [key, shapes, shapeStyle];
    },

    setMarker: function (markerInfo, description, data) {
      var myLatLng = new google.maps.LatLng(markerInfo.latitude, markerInfo.longitude);
      var image = new google.maps.MarkerImage(markerInfo.icon,
        // This marker is 20 pixels wide by 32 pixels tall.
        new google.maps.Size(markerInfo.width, markerInfo.height),
        // The origin for this image is 0,0.
        new google.maps.Point(0, 0),
        // The anchor for this image is the base of the flagpole at 0,32.
        new google.maps.Point(0, 0));


      var marker = new google.maps.Marker({
        marker: markerInfo,
        position: myLatLng,
        map: this.map,
        icon: image,
        title: description
      });

      var myself = this;
      google.maps.event.addListener(marker, 'click', function (e) {
        myself.trigger('marker:click', myself.wrapEvent(e, marker, 'marker', markerInfo, data));
      });

    },

    addLayers: function () {

      //Prepare tilesets as overlays
      var layers = [],
        layerIds = [],
        layerOptions = [];
      for (var k = 0; k < this.tilesets.length; k++) {
        var thisTileset = this.tilesets[k].slice(0);

        layerIds.push(thisTileset);
        layerOptions.push({
          mapTypeId: thisTileset
        });

        if (this.tileServices[thisTileset]) {
          layers.push(this.tileLayer(thisTileset));
        } else {
          layers.push('');
        }

      } //for tilesets

      for (k = 0; k < layers.length; k++) {
        if (!_.isEmpty(layers[k])) {
          this.map.mapTypes.set(layerIds[k], layers[k]);
          //this.map.overlayMapTypes.push(layers[k]);
          this.map.setMapTypeId(layerIds[k]);
          this.map.setOptions(layerOptions[k]);
        }
      }
       
    },      

    __renderMap: function (target, tilesets) {
      this.tilesets = tilesets;
      Logger.log('Requested tilesets:' + JSON.stringify(tilesets), 'debug');

      var myOptions = {
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      //Prepare tilesets as overlays
      var layers = [],
        layerIds = [],
        layerOptions = [];
      for (var k = 0; k < this.tilesets.length; k++) {
        var thisTileset = this.tilesets[k].slice(0);

        layerIds.push(thisTileset);
        layerOptions.push(_.extend(myOptions, {
          mapTypeId: thisTileset
        }));

        if (this.tileServices[thisTileset]) {
          layers.push(this.tileLayer(thisTileset));
        } else {
          layers.push('');
        }

      } //for tilesets

      // Add base map
      this.map = new google.maps.Map(target, {
        mapTypeControlOptions: {
          mapTypeIds: layerIds.concat(_.values(google.maps.MapTypeId))
        }
      });
        
      for (k = 0; k < layers.length; k++) {
        if (!_.isEmpty(layers[k])) {
          this.map.mapTypes.set(layerIds[k], layers[k]);
          //this.map.overlayMapTypes.push(layers[k]);
          this.map.setMapTypeId(layerIds[k]);
          this.map.setOptions(layerOptions[k]);
        }
      }

      registerViewportEvents.call(this);
    },


    updateViewport: function (centerLongitude, centerLatitude, zoomLevel) {
      if (!zoomLevel) zoomLevel = 2;
      this.map.setZoom(zoomLevel);

      var centerPoint;
      if (_.isFinite(centerLatitude) && _.isFinite(centerLongitude)) {
        centerPoint = new google.maps.LatLng(centerLatitude, centerLongitude);
        this.centered = true;
        this.map.panTo(centerPoint);
      } else {
        this.map.panTo(new google.maps.LatLng(38, -9));
      }


    },

    tileLayer: function (name) {
      var options = _.extend({
        tileSize: new google.maps.Size(256, 256),
        minZoom: 1,
        maxZoom: 19
      }, this.tileServicesOptions[name] || {});
      var urlList = this._switchUrl(this._getTileServiceURL(name));
      var myself = this;

      return new google.maps.ImageMapType(_.defaults({
        name: name.indexOf('/') >= 0 ? 'custom' : name,
        getTileUrl: function (coord, zoom) {
          var limit = Math.pow(2, zoom);
          if (coord.y < 0 || coord.y >= limit) {
            return '404.png';
          } else {
            // use myself._selectUrl
            coord.x = ((coord.x % limit) + limit) % limit;
            var url;
            if (_.isArray(urlList)) {
              var s = _.template('${z}/${x}/${y}', {x: coord.x, y: coord.y, z: zoom}, {interpolate: /\$\{(.+?)\}/g});
              url = myself._selectUrl(s, urlList);
            } else {
              url = urlList;
            }
            return _.template(url, {x: coord.x, y: coord.y, z: zoom}, {interpolate: /\$\{(.+?)\}/g});
          }
        }
      }, options));
    },


    showPopup: function (data, mapElement, popupHeight, popupWidth, contents, popupContentDiv, borderColor) {
      var overlay = new OurMapOverlay(mapElement.getPosition(), popupWidth, popupHeight, contents, popupContentDiv, this.map, borderColor);

      _.each(this.overlays, function (elt) {
        elt.setMap(null);
      });
      this.overlays.push(overlay);
    }

  });

  return GoogleMapEngine;

  function registerViewportEvents() {
    var me = this;
    var eventMap = {
      'zoom_changed': 'map:zoom',
      'center_changed': 'map:center'
    };
    _.each(eventMap, function (mapEvent, engineEvent) {
      google.maps.event.addListener(me.map, engineEvent, function () {
        var wrappedEvent = wrapViewportEvent.call(me);
        me.trigger(mapEvent, wrappedEvent);
      });
    });


    function wrapViewportEvent() {
      var viewport = getViewport(this.map.getBounds());
      var wrappedEvent = {
        zoomLevel: this.map.getZoom(),
        center: transformPoint(this.map.getCenter() || new google.maps.LatLng()),
        viewport: viewport,
        raw: this.map
      };
      return wrappedEvent;

      function transformPoint(centerPoint) {
        var center = {
          latitude: centerPoint.lat(),
          longitude: centerPoint.lng()
        };
        return center;
      }

      function getViewport(bounds) {
        if (bounds) {
          viewport = {
            northEast: transformPoint(bounds.getNorthEast()),
            southWest: transformPoint(bounds.getSouthWest())
          };
        } else {
          viewport = {
            northEast: {},
            southWest: {}
          }
        }
      }
    }
  }


});
