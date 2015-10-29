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

/*
 * OpenLayers engine.
 *
 */
define([
  '../mapengine',
  '../MapComponentAsyncLoader',
  'cdf/Logger',
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore',
  'cdf/lib/OpenLayers',
  'cdf/lib/OpenStreetMap'
], function (MapEngine, loadGoogleMaps, Logger, $, _, OpenLayers) {

  var OpenLayersEngine = MapEngine.extend({
    map: undefined,
    //    featureLayer: undefined,
    API_KEY: 0,
    constructor: function (options) {
      this.base();
      this.layers = {}; // map layers
      this.controls = {}; // map controls
    },
    init: function (tilesets) {
      this.tilesets = tilesets;
      Logger.log('Requested tilesets:' + JSON.stringify(tilesets), 'debug');

      var contains = function (v) {
        return _.some(tilesets, function (tileset) {
          //Logger.log(tileset, 'debug');
          return tileset.search(v) >= 0;
        });
      };

      var deferred;
      if (contains('googleXXX')) {
        // This is (probably) only needed if we use the OpenLayers.Layer.Google API,
        deferred = $.when(loadGoogleMaps('3', this.API_KEY));
      } else {
        deferred = $.Deferred();
        deferred.resolve();
      }
      return deferred.promise();
    },


    toNativeStyle: function (foreignStyle) {
      var validStyle = {};
      _.each(foreignStyle, function (value, key) {
        switch (key) {
          case 'visible':
            validStyle['display'] = value ? true : 'none';
            break;
          case 'zIndex':
            validStyle['graphicZIndex'] = value;
            break;
          case 'fillColor':
          case 'fillOpacity':
          case 'strokeColor':
          case 'strokeOpacity':
          case 'strokeWidth':
            validStyle[key] = value;
        }
      });
      return validStyle;
    },

    wrapEvent: function (event, featureType) {
      var lastXy = this.map.getControlsByClass('OpenLayers.Control.MousePosition')[0].lastXy; // || {x: undefined, y: undefined};
      var coords;
      if (lastXy) {
        coords = this.map.getLonLatFromPixel(lastXy)
          .transform(this.map.getProjectionObject(), new OpenLayers.Projection('EPSG:4326')
        );
      } else {
        coords = {lat: undefined, lon: undefined};
      }
      var feature = event.feature.layer.getFeatureById(event.feature.id);
      var myself = this;
      return {
        latitude: coords.lat,
        longitude: coords.lon,
        data: event.feature.attributes.data,
        feature: feature, // can refer to either the shape or the marker
        featureType: featureType,
        style: event.feature.attributes.style, // currently only shape styles
        marker: event.feature.attributes.marker, //marker-specific attributes
        mapEngineType: 'openlayers2',
        draw: function (style) {
          // currently only makes sense to be called on shape callbacks
          var validStyle = myself.toNativeStyle(style);
          event.feature.layer.drawFeature(feature, validStyle);
        },
        setSelectedStyle: function (style) {
          event.feature.attributes.clickSelStyle = style;
        },
        getSelectedStyle: function () {
          return event.feature.attributes.clickSelStyle;
        },
        isSelected: function () {
          return event.feature == event.feature.layer.selectedFeatures[0];
        },
        raw: event
      };
    },

    render: function (model) {
      this.model = model;
      var me = this;
      this.model.where({id: 'markers'}).each(function (m) {
        me._renderMarker(m);
      });
      this.model.where({id: 'shapes'}).each(function (m) {
        me._renderShape(m);
      });
    },

    _renderShape: function (modelItem) {

    },
    _renderMarker: function (modelItem) {

    },

    setMarker: function (markerInfo, description, data) {
      var proj = new OpenLayers.Projection('EPSG:4326'),  // transform from WGS 1984 //4326
        mapProj = this.map.getProjectionObject();
      var point = new OpenLayers.LonLat(markerInfo.longitude, markerInfo.latitude).transform(
        proj, // transform from WGS 1984
        mapProj // to the map system
      );

      var featureOptions = {
        graphicName: 'circle',
        label: 'label',
        labelAlign: 'cm',
        labelYOffset: -10,
        fillColor: '#ff0000',
        strokeColor: '#ffffff',
        strokeWidth: 3,
        pointRadius: 10,
        fillOpacity: 0.9
      };

      if (markerInfo.icon) {
        featureOptions = {
          externalGraphic: markerInfo.icon,
          graphicWidth: markerInfo.width,
          graphicHeight: markerInfo.height
        }
      }
      $.extend(featureOptions, {});

      var marker = new OpenLayers.Geometry.Point(point.lon, point.lat);
      var feature = new OpenLayers.Feature.Vector(marker, {
        data: data,
        style: undefined,
        marker: markerInfo
      }, featureOptions);

      this.layers.markers.addFeatures([feature]);

    },

    setShape: function (multiPolygon, shapeStyle, data) {
      if (!multiPolygon) {
        return;
      }
      var feature = this._geoJSONParser.parseFeature(multiPolygon);
      $.extend(true, feature, {
        attributes: {
          //data: data,
          //style: shapeStyle
          style: this.toNativeStyle(shapeStyle)
        },
        data: {
          data: data,
          //style: shapeStyle
        },
        //style: this.toNativeStyle(shapeStyle)
      });
      this.layers.shapes.addFeatures([feature]);
    },


    showPopup: function (data, mapElement, popupHeight, popupWidth, contents, popupContentDiv, borderColor) {

      var feature = mapElement;

      if (popupContentDiv && popupContentDiv.length > 0) {
        var div = $('<div/>');
        div.append($('#' + popupContentDiv));
        contents = div.html();
      }

      var name = 'featurePopup';
      if (borderColor != undefined) {
        name = name + borderColor.substring(1);
      }

      var p = mapElement.geometry.getCentroid(); // Hack to get the point
      feature.lonlat = new OpenLayers.LonLat(p.x, p.y);

      var popup = new OpenLayers.Popup.Anchored(name,
        feature.lonlat,
        new OpenLayers.Size(popupWidth, popupHeight),
        contents,
        null, true, null);

      feature.popup = popup;
      popup.feature = feature;

      _.each(this.map.popups, function (elt) {
        elt.hide();
      });

      this.map.addPopup(popup, true);
    },

    renderMap: function (target) {
      var projectionMap = new OpenLayers.Projection('EPSG:900913');
      var projectionWGS84 = new OpenLayers.Projection('EPSG:4326');

      var mapOptions = {
        //maxExtent: new OpenLayers.Bounds(-20037508,-20037508,20037508,20037508),
        //numZoomLevels: 18,
        //maxResolution: 156543,
        //units: 'm',
        zoomDuration: 10, // approximately match Google's zoom animation
        displayProjection: projectionWGS84,
        projection: projectionMap,
        controls: [
          new OpenLayers.Control.Navigation(),
          // new OpenLayers.Control.NavToolbar(),
          // new OpenLayers.Control.PanZoom(),
          //new OpenLayers.Control.ZoomPanel(),
          new OpenLayers.Control.DragPan(),
          new OpenLayers.Control.PinchZoom(),
          new OpenLayers.Control.LayerSwitcher({'ascending': false}),
          new OpenLayers.Control.ScaleLine(),
          new OpenLayers.Control.KeyboardDefaults(),
          new OpenLayers.Control.MousePosition(),
          new OpenLayers.Control.Attribution(),
          new OpenLayers.Control.TouchNavigation()
        ]
      };
      if (OpenLayers.TileManager) {
        mapOptions.tileManager = new OpenLayers.TileManager();
      }
      this.map = new OpenLayers.Map(target, mapOptions);
      var me = this;
      _.each(this.tilesets, function (thisTileset) {
        var layer;
        var tileset = thisTileset.slice(0).split('-')[0],
          variant = thisTileset.slice(0).split('-').slice(1).join('-') || 'default';
        Logger.log('Tilesets: ' + JSON.stringify(this.tilesets) + ', handling now :' + thisTileset + ', ie tileset ' + tileset + ', variant ' + variant);
        switch (tileset) {
          case 'googleXXX':
            layer = new OpenLayers.Layer.Google('Google Streets', {visibility: true, version: '3'});
            break;

          case 'opengeo':
            layer = new OpenLayers.Layer.WMS(thisTileset,
              'http://maps.opengeo.org/geowebcache/service/wms', {
                layers: variant,
                bgcolor: '#A1BDC4'
              }, {
                wrapDateLine: true,
                transitionEffect: 'resize'
              });
            break;

          default:
            layer = me.tileLayer(thisTileset);
            break;
        }

        // add the OpenStreetMap layer to the map
        me.map.addLayer(layer);
        me.layers[thisTileset] = layer;
      });

      // this.layers.shapes.style = new OpenLayers.StyleMap({
      //   'default': {
      //     fillColor: '#aaaaaa',
      //     graphicZIndex: 0
      //   },
      //   'select': {
      //     fillColor: '#0000ff',
      //     graphicZIndex: 1
      //   }
      // });

      var style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);

      style.fillColor = '${fillColor}';
      style.fillOpacity = '${fillOpacity}';
      style.strokeWidth = '${strokeWidth}';
      style.graphicZIndex = '${graphicZIndex}';
      style.strokeColor = '${strokeColor}';

      var olStyle = new OpenLayers.Style(style, {
        context: {
          fillColor: function (feature) {
            if (feature.hasOwnProperty('attributes')) {
              if (feature.attributes.hasOwnProperty('style')) {
                if (feature.attributes.style.hasOwnProperty('fillColor')) {
                  return feature.attributes.style.fillColor;
                }
              }
            }

            // Default color
            return '#999999';
          },

          strokeColor: function (feature) {
            return 'black';
          }
        }
      });

      var olOver = new OpenLayers.Style({
        fillColor: 'red'
      });

      var olSelect = new OpenLayers.Style({
        fillColor: 'blue'
      });

      var olStyleMap = new OpenLayers.StyleMap({
        'default': olStyle,
        'select': olSelect,
        'temporary': olOver
      });


      // add layers for the markers and for the shapes
      this.layers.shapes = new OpenLayers.Layer.Vector('Shapes', {
        styleMap: olStyleMap,
        rendererOptions: {
          zIndexing: true
        }
      });

      this.layers.markers = new OpenLayers.Layer.Vector('Markers');

      this.map.addLayers([this.layers.shapes, this.layers.markers]);
      this.setCallbacks();

      // add box selector controler
      this.controls.boxSelector = new OpenLayers.Control.SelectFeature(this.layers.shapes, {
        clickout: true,
        toggle: true,
        multiple: true,
        hover: false,
        box: true
      });
      this.map.addControl(this.controls.boxSelector);

      // add zoom box controler
      this.controls.zoomBox = new OpenLayers.Control.ZoomBox();
      this.map.addControl(this.controls.zoomBox);


      this._geoJSONParser = new OpenLayers.Format.GeoJSON({
        ignoreExtraDims: true,
        internalProjection: this.map.getProjectionObject(),
        externalProjection: projectionWGS84
      });
    },

    setPanningMode: function () {
      console.log('Panning mode enable');
      this.controls.boxSelector.deactivate();
      this.controls.zoomBox.deactivate();
    },

    setZoomBoxMode: function () {
      console.log('Zoom mode enable');
      this.controls.boxSelector.deactivate();
      this.controls.zoomBox.activate();
    },

    setSelectionMode: function () {
      console.log('Selection mode enable');
      this.controls.zoomBox.deactivate();
      this.controls.boxSelector.activate();
    },

    zoomIn: function () {
      console.log('zoomIn');
      this.map.zoomIn();
    },

    zoomOut: function () {
      console.log('zoomIn');
      this.map.zoomOut();
    },

    updateViewport: function (centerLongitude, centerLatitude, zoomLevel) {

      var bounds = new OpenLayers.Bounds();
      var markersBounds = this.layers.markers.getDataExtent();
      var shapesBounds = this.layers.shapes.getDataExtent();
      if (markersBounds || shapesBounds) {
        bounds.extend(markersBounds);
        bounds.extend(shapesBounds);
      } else {
        bounds = null;
      }

      if (_.isFinite(zoomLevel)) {
        this.map.zoomTo(zoomLevel);
      } else {
        if (bounds) {
          this.map.zoomToExtent(bounds);
        } else {
          this.map.zoomTo(2);
        }
      }

      var projectionWGS84 = new OpenLayers.Projection('EPSG:4326');
      var centerPoint;
      if (_.isFinite(centerLatitude) && _.isFinite(centerLongitude)) {
        centerPoint = (new OpenLayers.LonLat(centerLongitude, centerLatitude)).transform(projectionWGS84, this.map.getProjectionObject());
        this.map.setCenter(centerPoint);
      } else if (!bounds) {
        centerPoint = (new OpenLayers.LonLat(-10, 20)).transform(projectionWGS84, this.map.getProjectionObject());
        this.map.setCenter(centerPoint);
      }

    },

    setCallbacks: function () {
      var myself = this;

      function event_relay(e) {
        var prefix;
        if (e.feature.layer.name == 'Shapes') {
          prefix = 'shape';
        } else {
          prefix = 'marker';
        }
        var events = {
          'featurehighlighted': 'mouseover',
          'featureunhighlighted': 'mouseout',
          'featureselected': 'click'
        };
        if (events[e.type]) {
          myself.trigger(prefix + ':' + events[e.type], myself.wrapEvent(e));
        }
      }

      registerViewportEvents.call(this);

      this.controls.hoverCtrl = new OpenLayers.Control.SelectFeature([this.layers.markers, this.layers.shapes], {
        hover: true,
        highlightOnly: true,
        renderIntent: 'temporary',
        eventListeners: {
          featurehighlighted: event_relay,
          featureunhighlighted: event_relay,
          featureselected: event_relay
        },
        // this version of OpenLayers has issues with the outFeature function
        // this version of the function patches those issues
        // code from -> http://osgeo-org.1560.x6.nabble.com/SelectFeature-outFeature-method-tt3890333.html#a4988237
        outFeature: function (feature) {
          if (this.hover) {
            if (this.highlightOnly) {
              // we do nothing if we're not the last highlighter of the
              // feature
              if (feature._lastHighlighter == this.id) {
                // if another select control had highlighted the feature before
                // we did it ourself then we use that control to highlight the
                // feature as it was before we highlighted it, else we just
                // unhighlight it
                if (feature._prevHighlighter &&
                  feature._prevHighlighter != this.id) {
                  delete feature._lastHighlighter;
                  var control = this.map.getControl(
                    feature._prevHighlighter);
                  if (control) {
                    control.highlight(feature);
                    // THIS IS ADDED BY ME
                    this.events.triggerEvent('featureunhighlighted', {
                      feature: feature
                    });
                  }
                } else {
                  this.unhighlight(feature);
                }
              } else {
                // THIS IS ELSE BLOCK AND TRIGGER CALL ADDED BY ME
                this.events.triggerEvent('featureunhighlighted', {
                  feature: feature
                });
              }
            } else {
              this.unselect(feature);
            }
          }
        }
      });
      // allowing event to travel down
      this.controls.hoverCtrl.handlers['feature'].stopDown = false;
      this.map.addControl(this.controls.hoverCtrl);
      this.controls.hoverCtrl.activate();

      this.controls.clickCtrl = new OpenLayers.Control.SelectFeature([this.layers.markers, this.layers.shapes], {
        clickout: false
      });
      // allowing event to travel down
      this.controls.clickCtrl.handlers['feature'].stopDown = false;
      this.map.addControl(this.controls.clickCtrl);
      this.controls.clickCtrl.activate();

      this.layers.markers.events.on({
        featurehighlighted: function (e) {
          myself.trigger('marker:mouseover', myself.wrapEvent(e));
        },
        featureunhighlighted: function (e) {
          myself.trigger('marker:mouseout', myself.wrapEvent(e));
        },
        featureselected: function (e) {
          myself.trigger('marker:click', myself.wrapEvent(e));
          // The feature remains selected after we close the popup box, which disables clicking on the same box.
          // Thus we enforce that no marker is selected.
          myself.controls.clickCtrl.unselectAll();
        }
      });

      this.layers.shapes.events.on({
        featureselected: function (e) {

          // getAttrib
          // setFeatAtt
          // redraw
          console.log(e.feature.data.data.key);

          var id = e.feature.data.data.key;
          myself.model.where({id: id})[0].setSelection(true);

          //myself.trigger('shape:click', myself.wrapEvent(e));
        },
        featureunselected: function (e) {
          console.log(e.feature.data.data.key);

          var id = e.feature.data.data.key;
          myself.model.where({id: id})[0].setSelection(false);

          // myself.model.where({id: id}).each(function(m){
          //   m.setSelection(false);
          // });

          //myself.trigger('shape:click', myself.wrapEvent(e));
        }
      });

      // letting shapes events fall through
      this.layers.shapes.events.fallThrough = true;
    },

    tileLayer: function (name) {
      var urlTemplate = this._getTileServiceURL(name);
      var options = _.extend({
        'transitionEffect': 'resize'
      }, this.tileServicesOptions[name] || {});
      return new OpenLayers.Layer.XYZ(name, this._switchUrl(urlTemplate), _.extend({}, options));

    }
  });

  function registerViewportEvents() {
    var me = this;
    var eventMap = {
      'zoomend': 'map:zoom',
      'movestart': 'map:center'
    };
    _.each(eventMap, function (mapEvent, engineEvent) {
      me.map.events.register(engineEvent, me.map, function (e) {
        var wrappedEvent = wrapViewportEvent.call(me, e);
        me.trigger(mapEvent, wrappedEvent);
      });
    });
    function wrapViewportEvent(e) {
      var mapProj = this.map.getProjectionObject();
      var wsg84 = new OpenLayers.Projection('EPSG:4326');
      var transformPoint = function (centerPoint) {
        var center;
        if (centerPoint) {
          var p = centerPoint.clone().transform(mapProj, wsg84);
          center = {
            latitude: p.lat,
            longitude: p.lon
          };
        } else {
          center = {
            latitude: undefined,
            longitude: undefined
          };
        }
        return center;
      };

      var extentObj = e.object.getExtent();
      var viewport = {
        northEast: {},
        southWest: {}
      };
      if (extentObj) {
        var extentInLatLon = extentObj.transform(mapProj, wsg84);
        viewport = {
          northEast: {
            latitude: extentInLatLon.top,
            longitude: extentInLatLon.right
          },
          southWest: {
            latitude: extentInLatLon.bottom,
            longitude: extentInLatLon.left
          }
        };
      }
      var wrappedEvent = {
        zoomLevel: e.object.getZoom(),
        center: transformPoint(e.object.center),
        viewport: viewport,
        raw: e
      };
      return wrappedEvent;
    }
  }


  return OpenLayersEngine;

});
