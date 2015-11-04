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
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore',
  '../mapengine',
  'cdf/lib/OpenLayers',
  '../../model/SelectionStates',
  'cdf/Logger',
  'css!./style-openlayers2'
], function ($, _, MapEngine, OpenLayers, SelectionStates, Logger) {

  var OpenLayersEngine = MapEngine.extend({
    map: undefined,
    //    featureLayer: undefined,
    API_KEY: 0,
    constructor: function (options) {
      this.base();
      $.extend(this, options);
      this.layers = {}; // map layers
      this.controls = {}; // map controls
    },

    toNativeStyle: function (foreignStyle) {
      var conversionTable = {
        // SVG standard attributes : OpenLayers2 attributes
        'fill': 'fillColor',
        'fill-opacity': 'fillOpacity',
        'stroke': 'strokeColor',
        'stroke-opacity': 'strokeOpacity',
        'stroke-width': 'strokeWidth',
        'r': 'pointRadius',
        //Backwards compatibility
        'fillColor': 'fillColor',
        'fillOpacity': 'fillOpacity',
        'strokeColor': 'strokeColor',
        'strokeOpacity': 'strokeOpacity',
        'strokeWidth': 'strokeWidth',
        'zIndex': 'graphicZIndex'
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

    wrapEvent: function (event, featureType) {
      var lastXy = this.controls.mousePosition.lastXy; // || {x: undefined, y: undefined};
      var coords;
      if (lastXy) {
        coords = this.map.getLonLatFromPixel(lastXy)
          .transform(this.map.getProjectionObject(), new OpenLayers.Projection('EPSG:4326')
        );
      } else {
        coords = {lat: undefined, lon: undefined};
      }
      var feature = event.feature; //.layer.getFeatureById(event.feature.id);
      var myself = this;
      return {
        id: event.feature.attributes.model.get('id'),
        latitude: coords.lat,
        longitude: coords.lon,
        data: event.feature.attributes.model.get('data'), //TODO review this
        feature: feature, // can refer to either the shape or the marker
        featureType: featureType,
        style: event.feature.attributes.style, // currently only shape styles //TODO review this
        mapEngineType: 'openlayers2',
        draw: function (style) {
          // currently only makes sense to be called on shape callbacks
          var validStyle = myself.toNativeStyle(style);
          event.feature.layer.drawFeature(feature, validStyle);
        },
        // TODO: BEGIN code that must die
        setSelectedStyle: function (style) {
          event.feature.attributes.clickSelStyle = style;
        },
        getSelectedStyle: function () {
          return event.feature.attributes.clickSelStyle;
        },
        isSelected: function () {
          return event.feature == event.feature.layer.selectedFeatures[0];
        },
        // END code that must die
        raw: event
      };
    },


    renderItem: function (modelItem) {
      if (!modelItem) {
        return;
      }
      var row = modelItem.get('rawData');
      var data = {
        rawData: row,
        key: row && row[0]
        //value: row[idx.value],
      };
      var layer = this.layers[modelItem.getFeatureType()[1]];
      var geoJSON = modelItem.get('geoJSON');
      var me = this;
      $.when(geoJSON).then(function (feature) {
        if (!feature) {
          return;
        }
        var f = me._geoJSONParser.parseFeature(feature);
        var style = modelItem.inferStyle('normal');
        $.extend(true, f, {
          attributes: {
            model: modelItem,
            data: data
          },
          style: me.toNativeStyle(style)
        });
        layer.addFeatures([f]);
      });

    },

    __setMarker: function (markerInfo, description, data) {
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

      if (false && markerInfo.icon) {
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

    renderMap: function (target, tilesets) {
      this.tilesets = tilesets;
      Logger.log('Requested tilesets:' + JSON.stringify(tilesets), 'debug');

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
          new OpenLayers.Control.Attribution(),
          new OpenLayers.Control.TouchNavigation()
        ]
      };
      if (OpenLayers.TileManager) {
        mapOptions.tileManager = new OpenLayers.TileManager();
      }
      this.map = new OpenLayers.Map(target, mapOptions);


      this.addLayers();
      this.addControls();
      this.registerViewportEvents();

      this._geoJSONParser = new OpenLayers.Format.GeoJSON({
        ignoreExtraDims: true,
        internalProjection: this.map.getProjectionObject(),
        externalProjection: projectionWGS84
      });
    },

    addLayers: function () {
      var me = this;
      _.each(this.tilesets, function (thisTileset) {
        var layer;
        var tileset = thisTileset.slice(0).split('-')[0],
          variant = thisTileset.slice(0).split('-').slice(1).join('-') || 'default';
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

      // add layers for the markers and for the shapes
      this.layers.shapes = new OpenLayers.Layer.Vector('Shapes', {
        //styleMap: olStyleMap,
        rendererOptions: {
          zIndexing: true
        }
      });

      this.layers.markers = new OpenLayers.Layer.Vector('Markers');

      this.map.addLayers([this.layers.shapes, this.layers.markers]);
    },

    setPanningMode: function () {
      console.log('Panning mode enable');
      this.controls.clickCtrl.activate();
      this.controls.zoomBox.deactivate();
      this.controls.boxSelector.deactivate();
      this.updateFeatures();
    },

    setZoomBoxMode: function () {
      console.log('Zoom mode enable');
      this.controls.clickCtrl.deactivate();
      this.controls.zoomBox.activate();
      this.controls.boxSelector.deactivate();
      this.updateFeatures();
    },

    setSelectionMode: function () {
      console.log('Selection mode enable');
      this.controls.clickCtrl.deactivate();
      this.controls.boxSelector.activate();
      this.controls.zoomBox.deactivate();
      this.updateFeatures();
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

    addControls: function () {
      this._addControlMousePosition();
      this._addControlHover();
      this._addControlClick();
      this._addControlBoxSelector();
      this._addControlZoomBox();
    },

    _addControlMousePosition: function () {
      this.controls.mousePosition = new OpenLayers.Control.MousePosition();
      this.map.addControl(this.controls.mousePosition);
    },

    _addControlBoxSelector: function () {
      // add box selector controler
      this.controls.boxSelector = new OpenLayers.Control.SelectFeature([this.layers.shapes, this.layers.markers], {
        clickout: true,
        toggle: true,
        multiple: true,
        hover: false,
        box: true
      });
      this.map.addControl(this.controls.boxSelector);

    },

    _addControlZoomBox: function () {
      // add zoom box controler
      this.controls.zoomBox = new OpenLayers.Control.ZoomBox();
      this.map.addControl(this.controls.zoomBox);
    },

    _addControlHover: function () {
      var me = this;

      function event_relay(e) {
        var featureType = getLayerFromEvent(e);

        var events = {
          'featurehighlighted': 'mouseover',
          'featureunhighlighted': 'mouseout'
        };

        var model = e.feature.attributes.model;
        var styles = {
          'featurehighlighted': model.inferStyle('hover'),
          'featureunhighlighted': model.inferStyle('normal')
        };

        //console.log('hoverCtrl', featureType, e.type, styles[e.type]);
        if (events[e.type]) {
          var style = me.toNativeStyle(styles[e.type]);
          e.feature.style = style;
          e.feature.layer.drawFeature(e.feature, style);
          me.trigger(featureType + ':' + events[e.type], me.wrapEvent(e));
        }
      }


      this.controls.hoverCtrl = new OpenLayers.Control.SelectFeature([this.layers.markers, this.layers.shapes], {
        hover: true,
        highlightOnly: true,
        renderIntent: 'temporary',
        eventListeners: {
          featurehighlighted: event_relay,
          featureunhighlighted: event_relay
        },
        //// this version of OpenLayers has issues with the outFeature function
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
    },

    _addControlClick: function () {
      this.controls.clickCtrl = new OpenLayers.Control.SelectFeature([this.layers.markers, this.layers.shapes], {
        clickout: false
      });
      // allowing event to travel down
      this.controls.clickCtrl.handlers['feature'].stopDown = false;
      this.map.addControl(this.controls.clickCtrl);
      this.controls.clickCtrl.activate();

      var me = this;
      var createEventHandler = function (callback) {
        return function (e) {
          var model = e.feature.attributes.model;
          var style = me.toNativeStyle(callback(model));
          e.feature.style = style;
          e.feature.layer.drawFeature(e.feature, style);
          var featureType = getLayerFromEvent(e);
          me.trigger(featureType + ':click', me.wrapEvent(e));
        }
      };
      var eventHandlers = {
        'featureselected': createEventHandler(function (model) {
          model.setSelection(SelectionStates.ALL);
          var actionMap = {
            'pan': 'hover',
            'zoombox': 'hover',
            'selection': 'normal'
          };
          var action = actionMap[model.root().get('mode')];
          return model.inferStyle(action);
        }),
        'featureunselected': createEventHandler(function (model) {
          model.setSelection(SelectionStates.NONE);
          var actionMap = {
            'pan': 'normal',
            'zoombox': 'normal',
            'selection': 'hover'
          };
          var action = actionMap[model.root().get('mode')];
          return model.inferStyle(action);
        })
      };

      this.layers.markers.events.on(eventHandlers);
      this.layers.shapes.events.on(eventHandlers);
      // letting marker events fall through
      this.layers.markers.events.fallThrough = true;
      this.layers.shapes.events.fallThrough = true;

    },

    updateFeatures: function () {
      var me = this;
      var features = _.union(this.layers.shapes.features, this.layers.markers.features);
      _.each(features, function (f) {
        var model = f.attributes.model;
        var style = me.toNativeStyle(model.inferStyle('normal'));
        f.style = style;
        f.layer.drawFeature(f, style);
      });
    },

    tileLayer: function (name) {
      var urlTemplate = this._getTileServiceURL(name);
      var options = _.extend({
        'transitionEffect': 'resize'
      }, this.tileServicesOptions[name] || {});
      return new OpenLayers.Layer.XYZ(name, this._switchUrl(urlTemplate), _.extend({}, options));

    },

    registerViewportEvents: function () {
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
  });

  function getLayerFromEvent(e) {
    var layer;
    if (e.feature.layer.name == 'Shapes') {
      layer = 'shape';
    } else {
      layer = 'marker';
    }
    return layer;
  }

  return OpenLayersEngine;

})
;
