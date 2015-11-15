define("cde/components/Map/Map.lifecycle", [ "amd!cdf/lib/underscore" ], function(_) {
    return {
        maybeToggleBlock: function(block) {
            this.isSilent() || (block ? this.block() : this.unblock());
        },
        getQueryData: function() {
            var query = this.queryState = this.query = this.dashboard.getQuery(this.queryDefinition);
            query.setAjaxOptions({
                async: !0
            }), query.fetchData(this.parameters, this.getSuccessHandler(_.bind(this.onDataReady, this)), this.getErrorHandler());
        },
        _concludeUpdate: function() {
            this.postExec(), this.maybeToggleBlock(!1);
        }
    };
}), define("cde/components/Map/Map.selector", [], function() {
    return {
        getValue: function() {
            return this.model.getSelectedItems();
        },
        setValue: function(idList) {
            if (!this.model) throw "Model is not initialized";
            return this.model.setSelectedItems(idList), this;
        },
        updateSelection: function() {
            var idList = this.dashboard.getParameterValue(this.parameter);
            this.setValue(idList);
        },
        processChange: function() {
            return this.dashboard.processChange(this.name), this;
        }
    };
}), define("cde/components/Map/model/backbone.treemodel", [ "amd!cdf/lib/underscore", "amd!cdf/lib/backbone" ], function(_, Backbone) {
    return function() {
        var ArrMethods = {
            where: function(attrs) {
                var nodes = [];
                return _.each(this, function(model) {
                    nodes = nodes.concat(model.where(attrs));
                }), wrapArray(_.uniq(nodes));
            }
        }, wrapArray = function(array) {
            return _.extend(array, ArrMethods);
        }, TreeCollection = (Backbone.TreeModel = Backbone.Model.extend({
            nodesAttribute: "nodes",
            constructor: function(node) {
                Backbone.Model.prototype.constructor.apply(this, arguments), this._nodes = new TreeCollection(void 0, {
                    model: this.constructor
                }), this._nodes.parent = this, node && node[this.nodesAttribute] && (this.add(node[this.nodesAttribute]), 
                this.unset(this.nodesAttribute)), this._nodes.on("all", function(event, model, collection, options) {
                    this.root().trigger.apply(this.root(), arguments);
                }, this);
            },
            toJSON: function() {
                var jsonObj = Backbone.Model.prototype.toJSON.apply(this, arguments), children = this._nodes.toJSON();
                return children.length && (jsonObj[this.nodesAttribute] = children), jsonObj;
            },
            find: function(id) {
                return this.findWhere({
                    id: id
                });
            },
            findWhere: function(attrs) {
                return this.where(attrs, !0);
            },
            where: function(attrs, first, excludeCurrentNode) {
                var matchedNode, nodes = [];
                if (!excludeCurrentNode && _.where([ this.toJSON() ], attrs)[0] && nodes.push(this), 
                !first) return nodes = nodes.concat(this._nodes.where(attrs)), this._nodes.each(function(node) {
                    nodes = nodes.concat(node.where(attrs, !1, !0));
                }), wrapArray(nodes);
                if (nodes[0]) return nodes[0];
                if (matchedNode = this._nodes.where(attrs, !0), _.isArray(matchedNode) && (matchedNode = matchedNode[0]), 
                matchedNode instanceof Backbone.Model) return matchedNode;
                for (var i = 0, len = this._nodes.length; len > i; i++) if (matchedNode = this._nodes.at(i).where(attrs, !0, !0)) return matchedNode;
            },
            isRoot: function() {
                return null === this.parent();
            },
            root: function() {
                return this.parent() && this.parent().root() || this;
            },
            contains: function(node) {
                if (!node || !node.isRoot || !node.parent || node.isRoot()) return !1;
                var parent = node.parent();
                return parent === this || this.contains(parent);
            },
            parent: function() {
                return this.collection && this.collection.parent || null;
            },
            nodes: function() {
                return this._nodes.length && this._nodes || null;
            },
            index: function() {
                return this.isRoot() ? null : this.collection.indexOf(this);
            },
            next: function() {
                if (this.isRoot()) return null;
                var currentIndex = this.index();
                return currentIndex < this.collection.length - 1 ? this.collection.at(currentIndex + 1) : null;
            },
            prev: function() {
                if (this.isRoot()) return null;
                var currentIndex = this.index();
                return currentIndex > 0 ? this.collection.at(currentIndex - 1) : null;
            },
            remove: function(attrs, first) {
                return attrs ? (first ? this.where(attrs, !0).remove() : _.each(this.where(attrs), function(node) {
                    node.collection && node.remove();
                }), this) : this.isRoot() ? !1 : (this.collection.remove(this), !0);
            },
            empty: function() {
                return this._nodes.reset(), this;
            },
            add: function(node) {
                return node instanceof Backbone.Model && node.collection && node.collection.remove(node), 
                this._nodes.add.apply(this._nodes, arguments), this;
            },
            insertBefore: function(node) {
                return this.isRoot() || (node instanceof Backbone.Model && node.collection && node.collection.remove(node), 
                this.parent().add(node, {
                    at: this.index()
                })), this;
            },
            insertAfter: function(node) {
                return this.isRoot() || (node instanceof Backbone.Model && node.collection && node.collection.remove(node), 
                this.parent().add(node, {
                    at: this.index() + 1
                })), this;
            },
            before: function(nodes) {
                return nodes ? this.insertBefore(nodes) : this.prev();
            },
            after: function(nodes) {
                return nodes ? this.insertAfter(nodes) : this.next();
            }
        }), Backbone.TreeCollection = Backbone.Collection.extend({
            where: function(attrs, opts) {
                if (opts && opts.deep) {
                    var nodes = [];
                    return this.each(function(model) {
                        nodes = nodes.concat(model.where(attrs));
                    }), wrapArray(nodes);
                }
                return Backbone.Collection.prototype.where.apply(this, arguments);
            }
        }));
    }.call(this), Backbone;
}), define("cde/components/Map/model/baseevents", [ "amd!cdf/lib/underscore", "amd!cdf/lib/backbone", "cdf/lib/Base" ], function(_, Backbone, Base) {
    function extendClass(TargetClass) {
        return Base.extend.apply(TargetClass, rest(arguments));
    }
    function addSelfExtend(TargetClass) {
        return extendClass(TargetClass, {}, {
            extend: Base.extend
        });
    }
    function addEvents(TargetClass) {
        return extendClass(TargetClass, Backbone.Events);
    }
    function convertClass(TargetClass) {
        return extendClass(addEvents(addSelfExtend(TargetClass)), arguments[1], arguments[2]);
    }
    var rest = _.rest, BaseEvents = convertClass(Base);
    return BaseEvents.extendClass = extendClass, BaseEvents.convertClass = convertClass, 
    BaseEvents.extendWithEvents = convertClass, BaseEvents;
}), define("cde/components/Map/model/Tree", [ "amd!cdf/lib/underscore", "./backbone.treemodel", "./baseevents", "cdf/Logger" ], function(_, Backbone, BaseEvents, Logger) {
    var Tree = BaseEvents.extendWithEvents(Backbone.TreeModel).extend(Logger).extend({
        url: "",
        children: function() {
            return this.nodes.apply(this, arguments);
        },
        parse: function(response, options) {
            return response;
        },
        walkDown: function(itemCallback, combineCallback, alwaysCallback) {
            var result;
            return combineCallback || (combineCallback = function(x) {
                return x;
            }), result = this.children() ? combineCallback(this.children().map(function(child) {
                return child.walkDown(itemCallback, combineCallback, alwaysCallback);
            })) : itemCallback(this), _.isFunction(alwaysCallback) && (result = alwaysCallback(this, result)), 
            result;
        },
        flatten: function() {
            var list;
            return list = [ this ], this.children() && this.children().each(function(node) {
                return node.flatten().each(function(el) {
                    return list.push(el);
                });
            }), _.chain(list);
        },
        leafs: function() {
            return this.flatten().filter(function(m) {
                return null === m.children();
            });
        }
    });
    return Tree;
}), define("cde/components/Map/model/SelectionStates", [], function() {
    var SelectionStates = {
        SOME: null,
        NONE: !1,
        ALL: !0
    };
    return SelectionStates;
}), define("cde/components/Map/model/SelectionTree", [ "amd!cdf/lib/underscore", "./Tree", "./SelectionStates" ], function(_, Tree, SelectionStates) {
    var SelectionTree = Tree.extend({
        defaults: {
            id: void 0,
            label: "",
            isSelected: !1,
            isVisible: !0,
            numberOfSelectedItems: 0,
            numberOfItems: 0
        },
        constructor: function(attributes, options) {
            return null != (null != attributes ? attributes.label : void 0) && (null == attributes.id || (null != options ? options.useValueAsId : void 0) === !0) && (attributes.id = attributes.label), 
            this.base(attributes, options);
        },
        initialize: function() {
            return this.base.apply(this, arguments), this.on("add remove", this.update);
        },
        sync: function(action, model, options) {
            return this.log("Please " + action + " item " + model.get("label")), _.each(model.where({
                isSelected: !0
            }), function(m) {
                return this.log("Processing " + action + " on item " + m.get("label"));
            });
        },
        setSelection: function(newState) {
            return this.getSelection() === newState ? this : (this.set("isSelected", newState), 
            newState !== SelectionStates.SOME && this.children() && this.children().each(function(child) {
                return child.setSelection(newState);
            }), this.parent() && this.parent().updateSelection(), this);
        },
        getSelection: function() {
            return this.get("isSelected");
        },
        setAndUpdateSelection: function(newState) {
            return this.setSelection(newState), this.update(), this.trigger("selection", this);
        },
        setVisibility: function(newState) {
            var isVisible;
            return isVisible = this.get("isVisible"), isVisible !== newState ? this.set("isVisible", newState) : void 0;
        },
        getVisibility: function() {
            return this.get("isVisible");
        },
        getSelectedItems: function(field) {
            var getMyself = function(_this) {
                return function() {
                    var value;
                    return value = _this.get(field || "id");
                };
            }(this), isSelected = this.getSelection();
            switch (isSelected) {
              case SelectionStates.SOME:
              case void 0:
                return this.children() ? _.flatten(this.children().map(function(child) {
                    return child.getSelectedItems(field) || [];
                })) : getMyself();

              case SelectionStates.ALL:
                return getMyself();

              case SelectionStates.NONE:
                return [];

              default:
                return [];
            }
        },
        setSelectedItems: function(idList) {
            var flatTree;
            return flatTree = this.flatten(), flatTree.filter(function(m) {
                return null == m.children();
            }).each(function(m) {
                var id;
                return id = m.get("id"), _.contains(idList, id) ? m.setSelection(SelectionStates.ALL) : m.setSelection(SelectionStates.NONE);
            }), flatTree.filter(function(m) {
                return null != m.children();
            }).each(function(m) {
                var id;
                return id = m.get("id"), _.contains(idList, id) ? m.setSelection(SelectionStates.ALL) : void 0;
            }), this.update(), this.root().updateSelectedItems({
                silent: !0
            });
        },
        updateSelectedItems: function(options) {
            return this.root().set("selectedItems", this._getSelectionSnapshot(), options);
        },
        restoreSelectedItems: function() {
            var selectedItems;
            return selectedItems = this.root().get("selectedItems"), null == selectedItems && (selectedItems = {
                none: this.flatten()
            }), selectedItems.none.each(function(m) {
                return m.setSelection(SelectionStates.NONE);
            }), null != selectedItems.all && selectedItems.all.each(function(m) {
                return m.setSelection(SelectionStates.ALL);
            }), this.update();
        },
        _getSelectionSnapshot: function() {
            var flatTree = this.flatten(), selectionSnapshot = {
                none: flatTree.filter(function(m) {
                    return m.getSelection() === SelectionStates.NONE;
                }),
                some: flatTree.filter(function(m) {
                    return m.getSelection() === SelectionStates.SOME;
                }),
                all: flatTree.filter(function(m) {
                    return m.getSelection() === SelectionStates.ALL;
                })
            };
            return selectionSnapshot;
        },
        update: function() {
            var numberOfServerItems;
            return this.root().updateSelection(), numberOfServerItems = this.root().get("numberOfItemsAtServer"), 
            null != numberOfServerItems ? this.root().set("numberOfItems", numberOfServerItems) : this.root().updateCountOfItems("numberOfItems", function(model) {
                return 1;
            }), this.root().updateCountOfItems("numberOfSelectedItems", function(model) {
                return model.getSelection() === SelectionStates.ALL ? 1 : 0;
            }), this;
        },
        updateSelection: function() {
            var inferParentSelectionStateFromChildren;
            return inferParentSelectionStateFromChildren = function(childrenStates) {
                var all, none;
                return all = _.every(childrenStates, function(el) {
                    return el === SelectionStates.ALL;
                }), none = _.every(childrenStates, function(el) {
                    return el === SelectionStates.NONE;
                }), all ? SelectionStates.ALL : none ? SelectionStates.NONE : SelectionStates.SOME;
            }, this.inferSelection(inferParentSelectionStateFromChildren, function(model, isSelected) {
                return model.children() && model.getSelection() !== isSelected ? model.setSelection(isSelected) : void 0;
            });
        },
        inferSelection: function(logic, callback) {
            var bothCallback, itemCallback;
            return itemCallback = function(node) {
                return node.getSelection();
            }, bothCallback = function(node, result) {
                return _.isFunction(callback) && callback(node, result), result;
            }, this.walkDown(itemCallback, logic, bothCallback);
        },
        countItems: function(callback) {
            var count;
            return count = this.children() ? this.children().reduce(function(memo, child) {
                return memo + child.countItems(callback);
            }, 0) : callback(this);
        },
        updateCountOfItems: function(property, callback) {
            var countItem, setCountOfItems, sumItems;
            return countItem = function(model) {
                return callback(model);
            }, sumItems = function(list) {
                return _.reduce(list, function(memo, n) {
                    return memo + n;
                }, 0);
            }, setCountOfItems = function(model, count) {
                return model.children() && model.set(property, count), count;
            }, this.walkDown(countItem, sumItems, setCountOfItems);
        },
        countSelectedItems: function() {
            return this.countItems(function(model) {
                return model.getSelection() === SelectionStates.ALL ? 1 : 0;
            });
        },
        updateCountOfSelectedItems: function() {
            var countSelectedItem, setSelectedItems, sumSelectedItems;
            return countSelectedItem = function(model) {
                return model.getSelection() === SelectionStates.ALL ? 1 : 0;
            }, sumSelectedItems = function(list) {
                return _.reduce(list, function(memo, n) {
                    return memo + n;
                }, 0);
            }, setSelectedItems = function(model, count) {
                return model.children() && model.set("numberOfSelectedItems", count), count;
            }, this.walkDown(countSelectedItem, sumSelectedItems, setSelectedItems);
        },
        hasChanged: function() {
            var hasChanged, previousSelection;
            return previousSelection = this.get("selectedItems"), hasChanged = null != previousSelection ? _.any(_.map(this._getSelectionSnapshot(), function(current, state) {
                var intersection, previous;
                return previous = previousSelection[state], intersection = current.intersection(previous.value()).value(), 
                !(current.isEqual(intersection).value() && previous.isEqual(intersection).value());
            })) : !1;
        }
    }, {
        states: SelectionStates
    });
    return SelectionTree;
}), define("cde/components/Map/model/MapModel", [ "./SelectionTree", "./SelectionStates", "amd!cdf/lib/underscore", "cdf/lib/jquery" ], function(SelectionTree, SelectionStates, _, $) {
    var MapModel = SelectionTree.extend({
        defaults: {
            id: void 0,
            label: "",
            isSelected: !1,
            isHighlighted: !1,
            isVisible: !0,
            numberOfSelectedItems: 0,
            numberOfItems: 0,
            rawData: null,
            styleMap: {
                unselected: {
                    normal: {},
                    hover: {}
                },
                selected: {
                    normal: {},
                    hover: {}
                }
            }
        },
        getHover: function() {
            return this.get("isHighlighted");
        },
        setHover: function(bool) {
            return this.set("isHighlighted", bool === !0);
        },
        getStyle: function(mode, state, action) {
            var parentStyle, myStyleMap = this.get("styleMap");
            parentStyle = this.parent() ? this.parent().getStyle() : {};
            var style = $.extend(!0, {}, parentStyle, myStyleMap);
            switch (arguments.length) {
              case 0:
                return style;

              case 1:
                return style[mode];

              case 2:
                return style[mode][state];

              case 3:
                var calculatedStyle = $.extend(!0, {}, ((style[mode] || {})[state] || {})[action]);
                return _.defaults(calculatedStyle, style[mode][state].normal, style[mode].unselected.normal, style.pan[state][action], style.pan[state].normal, style.pan.unselected.normal), 
                calculatedStyle;
            }
        },
        getStyle: function(action) {
            _.isUndefined(action) && (action = this.getHover() === !0 ? "hover" : "normal");
            var mode = this.root().get("mode"), state = this.getSelection() === !0 ? "selected" : "unselected";
            return this.getStyle(mode, state, action || "normal");
        },
        getFeatureType: function() {
            var featureTypes = {
                shapes: "shape",
                markers: "marker"
            };
            return featureTypes[this._getParents([])[1]];
        },
        _getParents: function(list) {
            return list.unshift(this.get("id")), this.parent() ? this.parent()._getParents(list) : list;
        }
    });
    return MapModel;
}), define("cde/components/Map/_getMapping", [ "amd!cdf/lib/underscore" ], function(_) {
    function getMapping(json) {
        var map = {};
        if (!json.metadata || 0 == json.metadata.length) return map;
        var colToPropertyMapping = {
            key: "id",
            id: "id",
            fill: "fill",
            fillColor: "fill",
            r: "r",
            latitude: "latitude",
            longitude: "longitude",
            address: "address",
            description: "description",
            marker: "marker",
            markerwidth: "markerWidth",
            markerheight: "markerHeight",
            popupcontents: "popupContents",
            popupwidth: "popupWidth",
            popupheight: "popupHeight"
        }, colNames = _.chain(json.metadata).pluck("colName").map(function(s) {
            return s.toLowerCase();
        }).value(), map = _.chain(colNames).map(function(colName, idx) {
            var property = colToPropertyMapping[colName];
            return property ? [ property, idx ] : [ colName, idx ];
        }).compact().object().value();
        return ("latitude" in map || "longitude" in map) && (map.addressType = "coordinates"), 
        "address" in map && !map.addressType && (map.addressType = "address"), map.id || (map.id = 0), 
        map;
    }
    return getMapping;
}), define("cde/components/Map/FeatureStore/ShapeConversion", [], function() {
    var shapeConversion = {
        simplifyPoints: function(points, precision_m) {
            function properRDP(points, epsilon) {
                var firstPoint = points[0], lastPoint = points[points.length - 1];
                if (points.length < 3) return points;
                for (var index = -1, dist = 0, i = 1; i < points.length - 1; i++) {
                    var cDist = findPerpendicularDistance(points[i], firstPoint, lastPoint);
                    cDist > dist && (dist = cDist, index = i);
                }
                if (dist > epsilon) {
                    var l1 = points.slice(0, index + 1), l2 = points.slice(index), r1 = properRDP(l1, epsilon), r2 = properRDP(l2, epsilon), rs = r1.slice(0, r1.length - 1).concat(r2);
                    return rs;
                }
                return [ firstPoint, lastPoint ];
            }
            function findPerpendicularDistance(p, p1, p2) {
                var result, slope, intercept;
                return p1[0] == p2[0] ? result = Math.abs(p[0] - p1[0]) : (slope = (p2[1] - p1[1]) / (p2[0] - p1[0]), 
                intercept = p1[1] - slope * p1[0], result = Math.abs(slope * p[0] - p[1] + intercept) / Math.sqrt(Math.pow(slope, 2) + 1)), 
                result;
            }
            return 0 > precision_m ? points : properRDP(points, precision_m / 63e5);
        },
        exportShapeDefinition: function() {
            this.shapeDefinition && window.open("data:text/json;charset=utf-8," + escape(JSON.stringify(this.shapeDefinition)));
        }
    };
    return shapeConversion;
}), define("cde/components/Map/FeatureStore/resolveShapes", [ "cdf/lib/jquery", "amd!cdf/lib/underscore", "./ShapeConversion" ], function($, _, ShapeConversion) {
    function resolveShapes(json, mapping, configuration) {
        var addIn = this.getAddIn("ShapeResolver", configuration.addIns.ShapeResolver.name), url = configuration.addIns.ShapeResolver.options.url;
        !addIn && url && (addIn = url.endsWith("json") || url.endsWith("js") ? this.getAddIn("ShapeResolver", "simpleJSON") : this.getAddIn("ShapeResolver", "kml"));
        var deferred = $.Deferred();
        if (!addIn) return deferred.resolve({}), deferred.promise();
        var idList = _.pluck(json.resultset, mapping.id), tgt = this, st = {
            keys: idList,
            ids: idList,
            tableData: json,
            _simplifyPoints: ShapeConversion.simplifyPoints,
            _parseShapeKey: configuration.addIns.ShapeResolver.options.parseShapeKey,
            _shapeSource: url
        }, promise = addIn.call(tgt, st, this.getAddInOptions("ShapeResolver", addIn.getName()));
        return $.when(promise).then(function(result) {
            var shapeDefinitions = _.chain(result).map(function(geoJSONFeature, key) {
                return [ key, geoJSONFeature ];
            }).object().value();
            deferred.resolve(shapeDefinitions);
        }), deferred.promise();
    }
    return resolveShapes;
}), define("cde/components/Map/FeatureStore/resolveMarkers", [ "cdf/lib/jquery", "amd!cdf/lib/underscore" ], function($, _) {
    function resolveMarkers(json, mapping, configuration) {
        var addIn = this.getAddIn("LocationResolver", configuration.addIns.LocationResolver.name), deferred = $.Deferred();
        if (!addIn) return deferred.resolve({}), deferred.promise();
        var markerDefinitions, tgt = this, opts = this.getAddInOptions("LocationResolver", addIn.getName());
        return markerDefinitions = "coordinates" === mapping.addressType ? _.chain(json.resultset).map(function(row) {
            var id = row[mapping.id], location = [ row[mapping.longitude], row[mapping.latitude] ];
            return [ id, createFeatureFromLocation(location) ];
        }).object().value() : _.chain(json.resultset).map(function(row, rowIdx) {
            var promisedLocation = $.Deferred(), id = row[mapping.id], address = void 0 != mapping.address ? row[mapping.address] : void 0, st = {
                data: row,
                position: rowIdx,
                address: address,
                addressType: mapping.addressType,
                key: id,
                id: id,
                mapping: mapping,
                tableData: json,
                continuationFunction: function(location) {
                    promisedLocation.resolve(createFeatureFromLocation(location));
                }
            }, props = [ "country", "city", "county", "region", "state" ];
            _.each(_.pick(mapping, props), function(propIdx, prop) {
                void 0 != propIdx && (st[prop] = row[propIdx]);
            });
            try {
                addIn.call(tgt, st, opts);
            } catch (e) {
                promisedLocation.resolve(null);
            }
            return [ id, promisedLocation.promise() ];
        }).object().value(), deferred.resolve(markerDefinitions), deferred.promise();
    }
    function createFeatureFromLocation(location) {
        var longitude = location[0], latitude = location[1], feature = {
            geometry: {
                coordinates: [ longitude, latitude ],
                type: "Point",
                properties: {
                    latitude: latitude,
                    longitude: longitude
                }
            },
            type: "Feature"
        };
        return feature;
    }
    return resolveMarkers;
}), define("cde/components/Map/Map.featureStyles", [ "cdf/lib/jquery" ], function($) {
    function getStyleMap(styleMap) {
        return $.extend(!0, {}, emptyStyleMap, styleMaps[styleMap]);
    }
    var styleMaps = {
        global: {
            pan: {
                unselected: {
                    normal: {
                        stroke: "white",
                        fillOpacity: .5
                    },
                    hover: {
                        stroke: "black",
                        fillOpacity: .5
                    }
                },
                selected: {
                    normal: {
                        stroke: "white",
                        fillOpacity: .9
                    },
                    hover: {
                        stroke: "black",
                        fillOpacity: .9
                    }
                }
            }
        },
        markers: {
            pan: {
                unselected: {
                    normal: {
                        r: 10,
                        graphicName: "circle",
                        labelAlign: "cm",
                        labelYOffset: -20,
                        fill: "red",
                        strokeWidth: 2,
                        fillOpacity: .4
                    },
                    hover: {}
                },
                selected: {
                    normal: {},
                    hover: {}
                }
            },
            selection: {
                unselected: {
                    normal: {
                        fill: "gray"
                    },
                    hover: {}
                },
                selected: {
                    normal: {
                        fill: "red"
                    },
                    hover: {}
                }
            }
        },
        shapes: {
            pan: {
                unselected: {
                    normal: {
                        fontColor: "black",
                        zIndex: 0,
                        strokeWidth: 1
                    },
                    hover: {
                        zIndex: 1,
                        strokeWidth: 2,
                        fill: "orange",
                        fontColor: "orange"
                    }
                },
                selected: {
                    normal: {
                        zIndex: 0,
                        fill: "red"
                    },
                    hover: {
                        zIndex: 1,
                        fill: "darkred"
                    }
                }
            },
            selection: {
                unselected: {
                    normal: {
                        fill: "gray"
                    }
                }
            }
        }
    }, emptyStyle = {
        unselected: {
            normal: {},
            hover: {}
        },
        selected: {
            normal: {},
            hover: {}
        }
    }, emptyStyleMap = {
        pan: $.extend({}, emptyStyle),
        zoombox: $.extend({}, emptyStyle),
        selection: $.extend({}, emptyStyle)
    };
    return {
        getStyleMap: getStyleMap
    };
}), define("cde/components/Map/Map.model", [ "cdf/lib/jquery", "amd!cdf/lib/underscore", "./model/MapModel", "./_getMapping", "./FeatureStore/resolveShapes", "./FeatureStore/resolveMarkers", "./Map.featureStyles" ], function($, _, MapModel, getMapping, resolveShapes, resolveMarkers, Styles) {
    return {
        resolveFeatures: function(json) {
            var mapping = getMapping(json);
            this.mapping = $.extend(!0, mapping, this.visualRoles), this.features = this.features || {};
            var deferred, me = this;
            return deferred = "shapes" === this.mapMode ? this._resolveShapes(json, this.mapping, this.configuration).then(function(shapeDefinition) {
                return me.features.shapes = shapeDefinition, json;
            }) : "markers" === this.mapMode ? this._resolveMarkers(json, this.mapping, this.configuration).then(function(markerDefinitions) {
                return me.features.markers = markerDefinitions, json;
            }) : $.when(json), deferred.promise();
        },
        _resolveShapes: resolveShapes,
        _resolveMarkers: resolveMarkers,
        initModel: function(json) {
            this.model = new MapModel({
                styleMap: this.getStyleMap("global")
            });
            var seriesRoot = this._initSeries(this.mapMode, json);
            json && json.metadata && json.resultset && this._addSeriesToModel(seriesRoot, json);
        },
        _initSeries: function(seriesId, json) {
            var colormap = this.getColorMap(), seriesRoot = {
                id: seriesId,
                label: seriesId,
                styleMap: this.getStyleMap(seriesId),
                colormap: colormap,
                extremes: this._detectExtremes(json)
            };
            return this.model.add(seriesRoot), this.model.findWhere({
                id: seriesId
            });
        },
        visualRoles: {},
        scales: {
            fill: "default",
            r: [ 10, 20 ]
        },
        attributeMapping: {
            fill: function(context, seriesRoot, mapping, row, rowIdx) {
                var value = row[mapping.fill], useGradient = "pan" === context.mode && "unselected" === context.state && "normal" === context.action;
                if (useGradient = useGradient || "selection" === context.mode && "selected" === context.state && "normal" === context.action, 
                _.isNumber(value) && useGradient) {
                    var colormap = seriesRoot.get("colormap") || this.getColorMap();
                    return this.mapColor(value, seriesRoot.get("extremes").fill.min, seriesRoot.get("extremes").fill.max, colormap);
                }
            },
            label: function(context, seriesRoot, mapping, row, rowIdx) {
                return _.isEmpty(row) ? void 0 : row[mapping.label] + "";
            },
            r: function(context, seriesRoot, mapping, row, rowIdx) {
                var value = row[mapping.r];
                if (_.isNumber(value)) {
                    var rmin = this.scales.r[0], rmax = this.scales.r[1], v = seriesRoot.get("extremes").r, r = Math.sqrt(rmin * rmin + (rmax * rmax - rmin * rmin) * (value - v.min) / v.max - v.min);
                    if (_.isFinite(r)) return r;
                }
            }
        },
        _detectExtremes: function(json) {
            var extremes = _.chain(this.visualRoles).map(function(colIndex, role) {
                var obj, values = _.pluck(json.resultset, colIndex);
                return obj = "Numeric" === json.metadata[colIndex].colType ? {
                    type: "numeric",
                    min: _.min(values),
                    max: _.max(values)
                } : {
                    type: "categoric",
                    items: _.uniq(values)
                }, [ role, obj ];
            }).object().value();
            return extremes;
        },
        _addSeriesToModel: function(seriesRoot, json) {
            var mapping = $.extend({}, this.mapping), colNames = _.pluck(json.metadata, "colName"), me = this, series = _.map(json.resultset, function(row, rowIdx) {
                var id = row[mapping.id], styleMap = {}, modes = [ "pan", "zoombox", "selection" ], states = [ "unselected", "selected" ], actions = [ "normal", "hover" ];
                _.each(modes, function(mode) {
                    _.each(states, function(state) {
                        _.each(actions, function(action) {
                            _.each(me.attributeMapping, function(functionOrValue, attribute) {
                                if (!(_.isUndefined(mapping[attribute]) || mapping[attribute] >= row.length)) {
                                    var context = {
                                        mode: mode,
                                        state: state,
                                        action: action
                                    }, value = _.isFunction(functionOrValue) ? functionOrValue.call(me, context, seriesRoot, mapping, row, rowIdx) : functionOrValue;
                                    _.isUndefined(value) || (styleMap[mode] = styleMap[mode] || {}, styleMap[mode][state] = styleMap[mode][state] || {}, 
                                    styleMap[mode][state][action] = styleMap[mode][state][action] || {}, styleMap[mode][state][action][attribute] = value);
                                }
                            });
                        });
                    });
                });
                var shapeDefinition = me.features.shapes ? me.features.shapes[id] : void 0, markerDefinition = me.features.markers ? me.features.markers[id] : void 0, geoJSON = "shape" === seriesRoot.getFeatureType() ? shapeDefinition : markerDefinition;
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
        getStyleMap: function(styleName) {
            var localStyleMap = _.result(this.styleMap) || {}, styleMap = $.extend(!0, {}, Styles.getStyleMap(styleName), localStyleMap.global, localStyleMap[styleName]);
            switch (styleName) {
              case "shape0s":
                return $.extend(!0, styleMap, {
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
}), define("cde/components/Map/Map.configuration", [ "cdf/lib/jquery", "amd!cdf/lib/underscore" ], function($, _) {
    function getConfiguration() {
        var addIns = {
            MarkerImage: {
                name: this.markerCggGraph ? "cggMarker" : this.markerImageGetter,
                options: {
                    cggScript: this.markerCggGraph,
                    parameters: this.cggGraphParameters,
                    height: this.markerHeight,
                    width: this.markerWidth,
                    iconUrl: this.marker
                }
            },
            ShapeResolver: {
                name: this.shapeResolver,
                options: {
                    url: this.shapeSource,
                    parseShapeKey: this.parseShapeKey
                }
            },
            LocationResolver: {
                name: this.locationResolver || "openstreetmap",
                options: {}
            },
            MapEngine: {
                name: this.mapEngineType,
                options: {
                    rawOptions: {
                        map: {}
                    },
                    tileServices: this.tileServices,
                    tileServicesOptions: this.tileServicesOptions,
                    tilesets: _.isString(this.tilesets) ? [ this.tilesets ] : this.tilesets,
                    API_KEY: this.API_KEY || window.API_KEY
                }
            }
        }, viewport = {
            center: {
                latitude: parseFloat(this.centerLatitude),
                longitude: parseFloat(this.centerLongitude)
            },
            zoomLevel: {
                min: 0,
                max: 1 / 0,
                "default": this.defaultZoomLevel
            }
        };
        return $.extend(!0, {}, {
            addIns: addIns,
            styleMap: this.styleMap,
            viewport: viewport
        }, _.result(this, "options"));
    }
    return {
        getConfiguration: getConfiguration
    };
}), define("cde/components/Map/Map.colorMap", [ "amd!cdf/lib/underscore" ], function(_) {
    var IColorMap = {
        colormaps: {
            jet: [],
            gray: [ [ 0, 0, 0, 255 ], [ 255, 255, 255, 255 ] ],
            "french-flag": [ [ 255, 0, 0, 255 ], [ 255, 254, 255, 255 ], [ 0, 0, 255, 255 ] ]
        },
        getColorMap: function() {
            var colorMap = [];
            if (null == this.colormap || _.isArray(this.colormap) && !this.colormap.length) colorMap = [ [ 0, 102, 0, 255 ], [ 255, 255, 0, 255 ], [ 255, 0, 0, 255 ] ]; else for (var k = 0, L = this.colormap.length; L > k; k++) colorMap.push(JSON.parse(this.colormap[k]));
            var interpolate = function(a, b, n) {
                var k, kk, step, c = [], d = [];
                for (k = 0; k < a.length; k++) for (c[k] = [], kk = 0, step = (b[k] - a[k]) / n; n > kk; kk++) c[k][kk] = a[k] + kk * step;
                for (k = 0; k < c[0].length; k++) for (d[k] = [], kk = 0; kk < c.length; kk++) d[k][kk] = Math.round(c[kk][k]);
                return d;
            }, cmap = [];
            for (k = 1, L = colorMap.length; L > k; k++) cmap = cmap.concat(interpolate(colorMap[k - 1], colorMap[k], 32));
            return _.map(cmap, function(v) {
                return "rgba(" + v.join(",") + ")";
            });
        },
        mapColor: function(value, minValue, maxValue, colormap) {
            var n = colormap.length, level = (value - minValue) / (maxValue - minValue);
            return colormap[Math.floor(level * (n - 1))];
        }
    };
    return IColorMap;
}), define("text!cde/components/Map/ControlPanel/ControlPanel.html", [], function() {
    return '<div class="map-control-panel">\n    <div class="map-control-button map-control-zoom-in"></div>\n    <div class="map-control-button map-control-zoom-out"></div>\n    <div class="map-controls-mode {{mode}}">\n        <div class="map-control-button map-control-pan"></div>\n        <div class="map-control-button map-control-zoombox"></div>\n        <div class="map-control-button map-control-select"></div>\n    </div>\n</div>';
}), define("cdf/lib/require-css/css!cde/components/Map/ControlPanel/ControlPanel", [], function() {}), 
define("cde/components/Map/ControlPanel/ControlPanel", [ "cdf/lib/jquery", "amd!cdf/lib/underscore", "../model/baseevents", "cdf/lib/mustache", "text!./ControlPanel.html", "css!./ControlPanel" ], function($, _, BaseEvents, Mustache, template) {
    var MODES = {
        pan: "pan",
        zoombox: "zoombox",
        selection: "selection"
    }, ControlPanel = BaseEvents.extend({
        constructor: function(domNode, model, options) {
            return this.base(), this.ph = $(domNode), this.model = model, this.options = options, 
            this.setPanningMode(), this;
        },
        render: function() {
            var viewModel = {
                mode: this.model.get("mode")
            }, html = Mustache.render(template, viewModel);
            return this.ph.empty().append(html), this._bindEvents(), this;
        },
        zoomOut: function() {
            return this.trigger("zoom:out"), this;
        },
        zoomIn: function() {
            return this.trigger("zoom:in"), this;
        },
        setPanningMode: function() {
            return this.isSelectionMode() && this.trigger("selection:complete"), this.model.set("mode", MODES.pan), 
            this;
        },
        setZoomBoxMode: function() {
            return this.model.set("mode", MODES.zoombox), this;
        },
        setSelectionMode: function() {
            return this.model.set("mode", MODES.selection), this;
        },
        getMode: function() {
            return this.model.get("mode");
        },
        isPanningMode: function() {
            return this.model.get("mode") === MODES.pan;
        },
        isZoomBoxMode: function() {
            return this.model.get("mode") === MODES.zoombox;
        },
        isSelectionMode: function() {
            return this.model.get("mode") === MODES.selection;
        },
        _bindEvents: function() {
            var bindings = {
                ".map-control-zoom-out": this.zoomOut,
                ".map-control-zoom-in": this.zoomIn,
                ".map-control-pan": this.setPanningMode,
                ".map-control-zoombox": this.setZoomBoxMode,
                ".map-control-select": this.setSelectionMode
            }, me = this;
            _.each(bindings, function(callback, selector) {
                me.ph.find(selector).click(_.bind(callback, me));
            }), this.listenTo(this.model, "change:mode", _.bind(this._updateView, this));
        },
        _updateView: function() {
            var mode = this.getMode();
            this.ph.find(".map-controls-mode").removeClass(_.values(MODES).join(" ")).addClass(mode);
        }
    });
    return ControlPanel;
}), define("cde/components/Map/Map.tileServices", [], function() {
    var _tileServices = {
        "default": "http://otile{switch:1,2,3,4}.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.png",
        apple: "http://gsp2.apple.com/tile?api=1&style=slideshow&layers=default&lang=en_US&z=${z}&x=${x}&y=${y}&v=9",
        google: "http://mt{switch:0,1,2,3}.googleapis.com/vt?x=${x}&y=${y}&z=${z}",
        mapquest: "http://otile{switch:1,2,3,4}.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.png",
        "mapquest-normal": "http://otile{switch:1,2,3,4}.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.png",
        "mapquest-hybrid": "http://otile{switch:1,2,3,4}.mqcdn.com/tiles/1.0.0/hyb/${z}/${x}/${y}.png",
        "mapquest-sat": "http://otile{switch:1,2,3,4}.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg",
        "mapbox-world-light": "https://{switch:a,b,c,d}.tiles.mapbox.com/v3/mapbox.world-light/${z}/${x}/${y}.jpg",
        "mapbox-world-dark": "https://{switch:a,b,c,d}.tiles.mapbox.com/v3/mapbox.world-dark/${z}/${x}/${y}.jpg",
        "mapbox-terrain": "https://{switch:a,b,c,d}.tiles.mapbox.com/v3/examples.map-9ijuk24y/${z}/${x}/${y}.jpg",
        "mapbox-satellite": "https://{switch:a,b,c,d}.tiles.mapbox.com/v3/examples.map-qfyrx5r8/${z}/${x}/${y}.png",
        "mapbox-example": "https://{switch:a,b,c,d}.tiles.mapbox.com/v3/examples.c7d2024a/${z}/${x}/${y}.png",
        "mapbox-example2": "https://{switch:a,b,c,d}.tiles.mapbox.com/v3/examples.bc17bb2a/${z}/${x}/${y}.png",
        openstreetmaps: "http://{switch:a,b,c}.tile.openstreetmap.org/${z}/${x}/${y}.png",
        openmapsurfer: "http://129.206.74.245:8001/tms_r.ashx?x=${x}&y=${y}&z=${z}",
        "openmapsurfer-roads": "http://129.206.74.245:8001/tms_r.ashx?x=${x}&y=${y}&z=${z}",
        "openmapsurfer-semitransparent": "http://129.206.74.245:8003/tms_h.ashx?x=${x}&y=${y}&z=${z}",
        "openmapsurfer-hillshade": "http://129.206.74.245:8004/tms_hs.ashx?x=${x}&y=${y}&z=${z}",
        "openmapsurfer-contour": "http://129.206.74.245:8006/tms_b.ashx?x=${x}&y=${y}&z=${z}",
        "openmapsurfer-administrative": "http://129.206.74.245:8007/tms_b.ashx?x=${x}&y=${y}&z=${z}",
        "openmapsurfer-roads-grayscale": "http://129.206.74.245:8008/tms_rg.ashx?x=${x}&y=${y}&z=${z}",
        stamen: "http://{switch:a,b,c,d}.tile.stamen.com/terrain/${z}/${x}/${y}.jpg",
        "stamen-terrain": "http://{switch:a,b,c,d}.tile.stamen.com/terrain/${z}/${x}/${y}.jpg",
        "stamen-terrain-background": "http://{switch:a,b,c,d}.tile.stamen.com/terrain-background/${z}/${x}/${y}.jpg",
        "stamen-terrain-labels": "http://{switch:a,b,c,d}.tile.stamen.com/terrain-labels/${z}/${x}/${y}.jpg",
        "stamen-toner": "http://{switch:a,b,c,d}.tile.stamen.com/toner/${z}/${x}/${y}.png",
        "stamen-toner-lite": "http://{switch:a,b,c,d}.tile.stamen.com/toner-lite/${z}/${x}/${y}.png",
        "stamen-toner-background": "http://{switch:a,b,c,d}.tile.stamen.com/toner-background/${z}/${x}/${y}.png",
        "stamen-toner-hybrid": "http://{switch:a,b,c,d}.tile.stamen.com/toner-hybrid/${z}/${x}/${y}.png",
        "stamen-toner-labels": "http://{switch:a,b,c,d}.tile.stamen.com/toner-labels/${z}/${x}/${y}.png",
        "stamen-toner-lines": "http://{switch:a,b,c,d}.tile.stamen.com/toner-lines/${z}/${x}/${y}.png",
        "stamen-toner-2010": "http://{switch:a,b,c,d}.tile.stamen.com/toner-2010/${z}/${x}/${y}.png",
        "stamen-toner-2011": "http://{switch:a,b,c,d}.tile.stamen.com/toner-2011/${z}/${x}/${y}.png",
        "stamen-watercolor": "http://{switch:a,b,c,d}.tile.stamen.com/watercolor/${z}/${x}/${y}.jpg",
        "nokia-normal": "http://maptile.maps.svc.ovi.com/maptiler/maptile/newest/normal.day/${z}/${x}/${y}/256/png8",
        "nokia-normal-grey": "http://maptile.maps.svc.ovi.com/maptiler/maptile/newest/normal.day.grey/${z}/${x}/${y}/256/png8",
        "nokia-normal-transit": "http://maptile.maps.svc.ovi.com/maptiler/maptile/newest/normal.day.transit/${z}/${x}/${y}/256/png8",
        "nokia-satellite": "http://maptile.maps.svc.ovi.com/maptiler/maptile/newest/satellite.day/${z}/${x}/${y}/256/png8",
        "nokia-terrain": "http://maptile.maps.svc.ovi.com/maptiler/maptile/newest/terrain.day/${z}/${x}/${y}/256/png8",
        "arcgis-street": "http://services.arcgisonline.com/ArcGIS/rest/services/World_street_Map/MapServer/tile/${z}/${y}/${x}",
        "arcgis-topographic": "http://services.arcgisonline.com/ArcGIS/rest/services/World_street_Topo/MapServer/tile/${z}/${y}/${x}",
        "arcgis-natgeo": "http://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/${z}/${y}/${x}",
        "arcgis-world": "http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}",
        "arcgis-lightgray": "http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/${z}/${y}/${x}",
        "arcgis-delorme": "http://services.arcgisonline.com/ArcGIS/rest/services/Specialty/DeLorme_World_Base_Map/MapServer/tile/${z}/${y}/${x}"
    };
    return {
        tileServices: _tileServices,
        otherTileServices: [],
        tileServicesOptions: {
            apple: {
                minZoom: 3,
                maxZoom: 14
            }
        }
    };
}), define("cde/components/Map/engines/MapEngine", [ "../model/baseevents", "cdf/Logger", "cdf/lib/jquery", "amd!cdf/lib/underscore", "../model/SelectionStates" ], function(BaseEvents, Logger, $, _, SelectionStates) {
    var MapEngine = BaseEvents.extend({
        tileServices: void 0,
        tileServicesOptions: void 0,
        tileLayer: function(name) {},
        init: function() {
            var deferred = $.Deferred();
            return deferred.resolve(), deferred.promise();
        },
        renderMap: function(target) {},
        render: function(model) {
            this.model = model;
            var me = this;
            this.listenTo(this.model.root(), "change:mode", function(model, value) {
                var modes = {
                    selection: me.setSelectionMode,
                    zoombox: me.setZoomBoxMode,
                    pan: me.setPanningMode
                };
                modes[value] && modes[value].call(me), model.leafs().each(function(m) {
                    me.updateItem(m);
                });
            }), this.listenTo(this.model, "change:isSelected change:isHighlighted change:isVisible", function(model, value) {
                model.children() || me.updateItem(model);
            }), model.leafs().each(function(m) {
                me.renderItem(m);
            });
        },
        updateViewport: function(centerLongitude, centerLatitude, zoomLevel) {},
        showPopup: function() {},
        _wrapEvent: function(modelItem) {
            return {
                data: $.extend(!0, {}, modelItem.get("data"), modelItem.get("rawData")),
                id: modelItem.get("id"),
                featureType: modelItem.getFeatureType(),
                style: modelItem.getStyle(),
                isSelected: function() {
                    return modelItem.getSelection() === SelectionStates.ALL;
                }
            };
        },
        toNativeStyle: function(foreignStyle) {
            var validStyle = {};
            return _.each(foreignStyle, function(value, key) {
                switch (key) {
                  case "visible":
                  case "zIndex":
                  case "fillColor":
                  case "fillOpacity":
                  case "strokeColor":
                  case "strokeOpacity":
                  case "strokeWidth":                }
            }), validStyle;
        },
        wrapEvent: function(event, featureType) {
            return {
                latitude: void 0,
                longitude: void 0,
                data: void 0,
                feature: void 0,
                featureType: featureType,
                style: void 0,
                mapEngineType: "abstract",
                draw: function(style) {},
                raw: void 0
            };
        },
        _selectUrl: function(paramString, urls) {
            for (var product = 1, URL_HASH_FACTOR = (Math.sqrt(5) - 1) / 2, i = 0, len = paramString.length; len > i; i++) product *= paramString.charCodeAt(i) * URL_HASH_FACTOR, 
            product -= Math.floor(product);
            return urls[Math.floor(product * urls.length)];
        },
        _switchUrl: function(url) {
            var list = url.match(/(http[s]?:\/\/[0-9a-z.]*?)\{switch:([a-z0-9,]+)\}(.*)/);
            if (!list || 0 == list.length) return url;
            for (var servers = list[2].split(","), url_list = [], i = 0; i < servers.length; i++) url_list.push(list[1] + servers[i] + list[3]);
            return url_list;
        },
        _getTileServiceURL: function(name) {
            var urlTemplate = this.tileServices[name];
            return urlTemplate || name.length > 0 && name.indexOf("{") > -1 && (urlTemplate = name), 
            urlTemplate;
        }
    });
    return MapEngine;
}), define("cdf/lib/require-css/css!cde/components/Map/engines/openlayers2/style-openlayers2", [], function() {}), 
define("cde/components/Map/engines/openlayers2/MapEngineOpenLayers", [ "cdf/lib/jquery", "amd!cdf/lib/underscore", "../MapEngine", "cdf/lib/OpenLayers", "../../model/SelectionStates", "cdf/Logger", "css!./style-openlayers2" ], function($, _, MapEngine, OpenLayers, SelectionStates, Logger) {
    var OpenLayersEngine = MapEngine.extend({
        map: void 0,
        API_KEY: 0,
        constructor: function(options) {
            this.base(), $.extend(this, options), this.layers = {}, this.controls = {};
        },
        toNativeStyle: function(foreignStyle) {
            var conversionTable = {
                fill: "fillColor",
                "fill-opacity": "fillOpacity",
                stroke: "strokeColor",
                "stroke-opacity": "strokeOpacity",
                "stroke-width": "strokeWidth",
                r: "pointRadius",
                fillColor: "fillColor",
                fillOpacity: "fillOpacity",
                strokeColor: "strokeColor",
                strokeOpacity: "strokeOpacity",
                strokeWidth: "strokeWidth",
                zIndex: "graphicZIndex"
            }, validStyle = {};
            return _.each(foreignStyle, function(value, key) {
                var nativeKey = conversionTable[key];
                if (nativeKey) validStyle[nativeKey] = value; else switch (key) {
                  case "visible":
                    validStyle.display = value ? !0 : "none";
                    break;

                  default:
                    validStyle[key] = value;
                }
            }), validStyle;
        },
        wrapEvent: function(event) {
            var coords, feature = event.feature, modelItem = event.feature.attributes.model, lastXy = this.controls.mousePosition.lastXy;
            coords = lastXy ? this.map.getLonLatFromPixel(lastXy).transform(this.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326")) : {
                lat: void 0,
                lon: void 0
            };
            var me = this;
            return $.extend(this._wrapEvent(modelItem), {
                mapEngineType: "openlayers2",
                latitude: coords.lat,
                longitude: coords.lon,
                feature: feature,
                draw: function(style) {
                    var validStyle = me.toNativeStyle(style);
                    event.feature.layer.drawFeature(feature, validStyle);
                },
                setSelectedStyle: function(style) {
                    event.feature.attributes.clickSelStyle = style;
                },
                getSelectedStyle: function() {
                    return event.feature.attributes.clickSelStyle;
                },
                raw: event
            });
        },
        renderItem: function(modelItem) {
            if (modelItem) {
                var layer = this.layers[modelItem.root().children().first().get("id")], geoJSON = modelItem.get("geoJSON"), me = this;
                $.when(geoJSON).then(function(feature) {
                    if (feature) {
                        var f = me._geoJSONParser.parseFeature(feature), style = modelItem.getStyle();
                        $.extend(!0, f, {
                            attributes: {
                                id: modelItem.get("id"),
                                model: modelItem
                            },
                            style: me.toNativeStyle(style)
                        }), layer.addFeatures([ f ]);
                    }
                });
            }
        },
        __setMarker: function(markerInfo, description, data) {
            var proj = new OpenLayers.Projection("EPSG:4326"), mapProj = this.map.getProjectionObject(), point = new OpenLayers.LonLat(markerInfo.longitude, markerInfo.latitude).transform(proj, mapProj), featureOptions = {
                graphicName: "circle",
                label: "label",
                labelAlign: "cm",
                labelYOffset: -10,
                fillColor: "#ff0000",
                strokeColor: "#ffffff",
                strokeWidth: 3,
                pointRadius: 10,
                fillOpacity: .9
            };
            $.extend(featureOptions, {});
            var marker = new OpenLayers.Geometry.Point(point.lon, point.lat), feature = new OpenLayers.Feature.Vector(marker, {
                data: data,
                style: void 0,
                marker: markerInfo
            }, featureOptions);
            this.layers.markers.addFeatures([ feature ]);
        },
        showPopup: function(data, mapElement, popupHeight, popupWidth, contents, popupContentDiv, borderColor) {
            var feature = mapElement;
            if (popupContentDiv && popupContentDiv.length > 0) {
                var div = $("<div/>");
                div.append($("#" + popupContentDiv)), contents = div.html();
            }
            var name = "featurePopup";
            void 0 != borderColor && (name += borderColor.substring(1));
            var p = mapElement.geometry.getCentroid();
            feature.lonlat = new OpenLayers.LonLat(p.x, p.y);
            var popup = new OpenLayers.Popup.Anchored(name, feature.lonlat, new OpenLayers.Size(popupWidth, popupHeight), contents, null, !0, null);
            feature.popup = popup, popup.feature = feature, _.each(this.map.popups, function(elt) {
                elt.hide();
            }), this.map.addPopup(popup, !0);
        },
        renderMap: function(target) {
            var projectionMap = new OpenLayers.Projection("EPSG:900913"), projectionWGS84 = new OpenLayers.Projection("EPSG:4326"), mapOptions = {
                zoom: this.options.viewport.zoomLevel["default"],
                zoomDuration: 10,
                displayProjection: projectionWGS84,
                projection: projectionMap,
                controls: [ new OpenLayers.Control.Navigation(), new OpenLayers.Control.DragPan(), new OpenLayers.Control.PinchZoom(), new OpenLayers.Control.LayerSwitcher({
                    ascending: !1
                }), new OpenLayers.Control.ScaleLine(), new OpenLayers.Control.KeyboardDefaults(), new OpenLayers.Control.Attribution(), new OpenLayers.Control.TouchNavigation() ]
            };
            OpenLayers.TileManager && (mapOptions.tileManager = new OpenLayers.TileManager()), 
            this.map = new OpenLayers.Map(target, mapOptions);
            var me = this;
            this.map.isValidZoomLevel = function(z) {
                var minZoom = _.isFinite(me.options.viewport.zoomLevel.min) ? me.options.viewport.zoomLevel.min : 0, maxZoom = _.isFinite(me.options.viewport.zoomLevel.max) ? me.options.viewport.zoomLevel.max : this.getNumZoomLevels();
                return null != z && z >= minZoom && maxZoom >= z;
            }, this.addLayers(), this.addControls(), this.registerViewportEvents(), this._geoJSONParser = new OpenLayers.Format.GeoJSON({
                ignoreExtraDims: !0,
                internalProjection: this.map.getProjectionObject(),
                externalProjection: projectionWGS84
            });
        },
        addLayers: function() {
            var me = this;
            _.each(this.tilesets, function(thisTileset) {
                var layer, tileset = thisTileset.slice(0).split("-")[0], variant = thisTileset.slice(0).split("-").slice(1).join("-") || "default";
                switch (tileset) {
                  case "googleXXX":
                    layer = new OpenLayers.Layer.Google("Google Streets", {
                        visibility: !0,
                        version: "3"
                    });
                    break;

                  case "opengeo":
                    layer = new OpenLayers.Layer.WMS(thisTileset, "http://maps.opengeo.org/geowebcache/service/wms", {
                        layers: variant,
                        bgcolor: "#A1BDC4"
                    }, {
                        wrapDateLine: !0,
                        transitionEffect: "resize"
                    });
                    break;

                  default:
                    layer = me.tileLayer(thisTileset);
                }
                me.map.addLayer(layer), me.layers[thisTileset] = layer;
            }), this.layers.shapes = new OpenLayers.Layer.Vector("Shapes", {
                rendererOptions: {
                    zIndexing: !0
                }
            }), this.layers.markers = new OpenLayers.Layer.Vector("Markers"), this.map.addLayers([ this.layers.shapes, this.layers.markers ]);
        },
        setPanningMode: function() {
            this.controls.clickCtrl.activate(), this.controls.zoomBox.deactivate(), this.controls.boxSelector.deactivate();
        },
        setZoomBoxMode: function() {
            this.controls.clickCtrl.deactivate(), this.controls.zoomBox.activate(), this.controls.boxSelector.deactivate();
        },
        setSelectionMode: function() {
            this.controls.clickCtrl.deactivate(), this.controls.boxSelector.activate(), this.controls.zoomBox.deactivate();
        },
        zoomIn: function() {
            this.map.zoomIn();
        },
        zoomOut: function() {
            this.map.zoomOut();
        },
        updateViewport: function(centerLongitude, centerLatitude, zoomLevel) {
            if (_.isFinite(zoomLevel)) this.map.zoomTo(zoomLevel); else {
                var bounds = new OpenLayers.Bounds(), markersBounds = this.layers.markers.getDataExtent(), shapesBounds = this.layers.shapes.getDataExtent();
                markersBounds || shapesBounds ? (bounds.extend(markersBounds), bounds.extend(shapesBounds)) : bounds = null, 
                bounds ? this.map.zoomToExtent(bounds) : this.map.zoomTo(this.options.viewport.zoomLevel["default"]);
            }
            var centerPoint, projectionWGS84 = new OpenLayers.Projection("EPSG:4326");
            _.isFinite(centerLatitude) && _.isFinite(centerLongitude) ? (centerPoint = new OpenLayers.LonLat(centerLongitude, centerLatitude).transform(projectionWGS84, this.map.getProjectionObject()), 
            this.map.setCenter(centerPoint)) : bounds || (centerPoint = new OpenLayers.LonLat(-10, 20).transform(projectionWGS84, this.map.getProjectionObject()), 
            this.map.setCenter(centerPoint));
        },
        addControls: function() {
            this._addControlMousePosition(), this._addControlHover(), this._addControlClick(), 
            this._addControlBoxSelector(), this._addControlZoomBox();
        },
        _addControlMousePosition: function() {
            this.controls.mousePosition = new OpenLayers.Control.MousePosition(), this.map.addControl(this.controls.mousePosition);
        },
        _addControlBoxSelector: function() {
            this.controls.boxSelector = new OpenLayers.Control.SelectFeature([ this.layers.shapes, this.layers.markers ], {
                clickout: !0,
                toggle: !0,
                multiple: !0,
                hover: !1,
                highlightOnly: !0,
                box: !0
            }), this.map.addControl(this.controls.boxSelector);
        },
        _addControlZoomBox: function() {
            this.controls.zoomBox = new OpenLayers.Control.ZoomBox(), this.map.addControl(this.controls.zoomBox);
        },
        _addControlHover: function() {
            function event_relay(e) {
                var events = {
                    featurehighlighted: "mouseover",
                    featureunhighlighted: "mouseout"
                };
                if (events[e.type]) {
                    var model = e.feature.attributes.model;
                    model.setHover("mouseover" === events[e.type]), me.trigger(model.getFeatureType() + ":" + events[e.type], me.wrapEvent(e));
                }
            }
            var me = this;
            this.controls.hoverCtrl = new OpenLayers.Control.SelectFeature([ this.layers.markers, this.layers.shapes ], {
                hover: !0,
                highlightOnly: !0,
                renderIntent: "temporary",
                eventListeners: {
                    featurehighlighted: event_relay,
                    featureunhighlighted: event_relay
                },
                outFeature: function(feature) {
                    if (this.hover) if (this.highlightOnly) if (feature._lastHighlighter == this.id) if (feature._prevHighlighter && feature._prevHighlighter != this.id) {
                        delete feature._lastHighlighter;
                        var control = this.map.getControl(feature._prevHighlighter);
                        control && (control.highlight(feature), this.events.triggerEvent("featureunhighlighted", {
                            feature: feature
                        }));
                    } else this.unhighlight(feature); else this.events.triggerEvent("featureunhighlighted", {
                        feature: feature
                    }); else this.unselect(feature);
                }
            }), this.controls.hoverCtrl.handlers.feature.stopDown = !1, this.map.addControl(this.controls.hoverCtrl), 
            this.controls.hoverCtrl.activate();
        },
        _addControlClick: function() {
            this.controls.clickCtrl = new OpenLayers.Control.SelectFeature([ this.layers.markers, this.layers.shapes ], {
                clickout: !1
            }), this.controls.clickCtrl.handlers.feature.stopDown = !1, this.map.addControl(this.controls.clickCtrl), 
            this.controls.clickCtrl.activate();
            var me = this, createEventHandler = function(callback) {
                return function(e) {
                    var model = e.feature.attributes.model;
                    callback(model), me.trigger(model.getFeatureType() + ":click", me.wrapEvent(e));
                };
            }, eventHandlers = {
                featureselected: createEventHandler(function(modelItem) {
                    modelItem.setSelection(SelectionStates.ALL);
                    var actionMap = {
                        pan: "hover",
                        zoombox: "hover",
                        selection: "normal"
                    }, action = actionMap[modelItem.root().get("mode")];
                    modelItem.setHover("hover" === action);
                }),
                featureunselected: createEventHandler(function(modelItem) {
                    modelItem.setSelection(SelectionStates.NONE);
                    var actionMap = {
                        pan: "normal",
                        zoombox: "normal",
                        selection: "normal"
                    }, action = actionMap[modelItem.root().get("mode")];
                    modelItem.setHover("hover" === action);
                })
            };
            this.layers.markers.events.on(eventHandlers), this.layers.shapes.events.on(eventHandlers), 
            this.layers.markers.events.fallThrough = !0, this.layers.shapes.events.fallThrough = !0;
        },
        updateItem: function(modelItem) {
            var style = this.toNativeStyle(modelItem.getStyle()), featureType = modelItem.getFeatureType(), layerName = "marker" === featureType ? "markers" : "shapes", layer = this.layers[layerName], feature = layer.getFeaturesByAttribute("id", modelItem.get("id"))[0];
            feature && (feature.style = style, feature.layer.drawFeature(feature, style));
        },
        tileLayer: function(name) {
            var urlTemplate = this._getTileServiceURL(name), options = _.extend({
                transitionEffect: "resize"
            }, this.tileServicesOptions[name] || {});
            return new OpenLayers.Layer.XYZ(name, this._switchUrl(urlTemplate), _.extend({}, options));
        },
        registerViewportEvents: function() {
            function wrapViewportEvent(e) {
                var mapProj = this.map.getProjectionObject(), wsg84 = new OpenLayers.Projection("EPSG:4326"), transformPoint = function(centerPoint) {
                    var center;
                    if (centerPoint) {
                        var p = centerPoint.clone().transform(mapProj, wsg84);
                        center = {
                            latitude: p.lat,
                            longitude: p.lon
                        };
                    } else center = {
                        latitude: void 0,
                        longitude: void 0
                    };
                    return center;
                }, extentObj = e.object.getExtent(), viewport = {
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
            var me = this, eventMap = {
                zoomend: "map:zoom",
                movestart: "map:center"
            };
            _.each(eventMap, function(mapEvent, engineEvent) {
                me.map.events.register(engineEvent, me.map, function(e) {
                    var wrappedEvent = wrapViewportEvent.call(me, e);
                    me.trigger(mapEvent, wrappedEvent);
                });
            });
        }
    });
    return OpenLayersEngine;
}), define("cde/components/Map/engines/google/MapComponentAsyncLoader", [ "cdf/lib/jquery" ], function($) {
    var loadGoogleMaps = function($) {
        var promise, now = $.now();
        return function(version, apiKey) {
            if (promise) return promise;
            var params, deferred = $.Deferred(), resolve = function() {
                deferred.resolve(window.google && google.maps ? google.maps : !1);
            }, callbackName = "loadGoogleMaps_" + now++;
            return window.google && google.maps ? resolve() : window.google && google.load ? google.load("maps", version || 3, {
                other_params: "sensor=false",
                callback: resolve
            }) : (params = $.extend({
                v: version || 3,
                sensor: !1,
                callback: callbackName
            }, apiKey ? {
                key: apiKey
            } : {}), window[callbackName] = function() {
                resolve(), setTimeout(function() {
                    try {
                        delete window[callbackName];
                    } catch (e) {}
                }, 20);
            }, $.ajax({
                dataType: "script",
                data: params,
                url: "http://maps.googleapis.com/maps/api/js"
            })), promise = deferred.promise();
        };
    }($);
    return loadGoogleMaps;
}), define("cdf/lib/require-css/css!cde/components/Map/engines/google/style-google", [], function() {}), 
define("cde/components/Map/engines/google/MapEngineGoogle", [ "cdf/lib/jquery", "amd!cdf/lib/underscore", "../MapEngine", "./MapComponentAsyncLoader", "../../model/SelectionStates", "css!./style-google" ], function($, _, MapEngine, MapComponentAsyncLoader, SelectionStates) {
    function OurMapOverlay(startPoint, width, height, htmlContent, popupContentDiv, map, borderColor) {
        this.startPoint_ = startPoint, this.width_ = width, this.height_ = height, this.map_ = map, 
        this.htmlContent_ = htmlContent, this.popupContentDiv_ = popupContentDiv, this.borderColor_ = borderColor, 
        this.div_ = null, this.setMap(map);
    }
    function registerViewportEvents() {
        function wrapViewportEvent() {
            function transformPoint(centerPoint) {
                var center = {
                    latitude: centerPoint.lat(),
                    longitude: centerPoint.lng()
                };
                return center;
            }
            function getViewport(bounds) {
                viewport = bounds ? {
                    northEast: transformPoint(bounds.getNorthEast()),
                    southWest: transformPoint(bounds.getSouthWest())
                } : {
                    northEast: {},
                    southWest: {}
                };
            }
            var viewport = getViewport(this.map.getBounds()), wrappedEvent = {
                zoomLevel: this.map.getZoom(),
                center: transformPoint(this.map.getCenter() || new google.maps.LatLng()),
                viewport: viewport,
                raw: this.map
            };
            return wrappedEvent;
        }
        var me = this, eventMap = {
            zoom_changed: "map:zoom",
            center_changed: "map:center"
        };
        _.each(eventMap, function(mapEvent, engineEvent) {
            google.maps.event.addListener(me.map, engineEvent, function() {
                var wrappedEvent = wrapViewportEvent.call(me);
                me.trigger(mapEvent, wrappedEvent);
            });
        });
    }
    var GoogleMapEngine = MapEngine.extend({
        map: void 0,
        centered: !1,
        overlays: [],
        API_KEY: !1,
        selectedFeature: void 0,
        constructor: function(options) {
            this.base(), $.extend(this, options), this.controls = {}, this.controls.listenersHandle = {};
        },
        init: function() {
            return $.when(MapComponentAsyncLoader("3", this.API_KEY)).then(function(status) {
                OurMapOverlay.prototype = new google.maps.OverlayView(), OurMapOverlay.prototype.onAdd = function() {
                    var div = document.createElement("DIV");
                    div.id = "MapOverlay", div.style.position = "absolute", this.borderColor_ ? div.style.border = "3px solid " + this.borderColor_ : div.style.border = "none", 
                    this.popupContentDiv_ && this.popupContentDiv_.length > 0 ? $(div).append($("#" + this.popupContentDiv_)) : div.innerHTML = this.htmlContent_, 
                    this.div_ = div;
                    var panes = this.getPanes();
                    panes.overlayLayer.appendChild(div);
                }, OurMapOverlay.prototype.draw = function() {
                    var overlayProjection = this.getProjection(), sp = overlayProjection.fromLatLngToDivPixel(this.startPoint_), div = this.div_;
                    div.style.left = sp.x + "px", div.style.top = sp.y + 30 + "px", div.style.width = this.width_ + "px", 
                    div.style.height = this.height_ + "px";
                }, OurMapOverlay.prototype.onRemove = function() {
                    this.popupContentDiv_, this.div_.style.display = "none";
                };
            });
        },
        wrapEvent: function(event, featureType) {
            var me = this;
            return {
                id: event.feature.getId(),
                latitude: event.latLng.lat(),
                longitude: event.latLng.lng(),
                data: me.model.findWhere({
                    id: event.feature.getId()
                }).get("data"),
                feature: event.feature,
                featureType: featureType,
                style: me.model.findWhere({
                    id: event.feature.getId()
                }).getStyle(),
                mapEngineType: "google3",
                draw: function(style) {
                    var validStyle = me.toNativeStyle(style);
                    feature.setOptions(validStyle), feature.setVisible(!1), feature.setVisible(_.has(style, "visible") ? !!style.visible : !0);
                },
                setSelectedStyle: function(style) {
                    feature.selStyle = style;
                },
                getSelectedStyle: function() {
                    return feature.selStyle;
                },
                isSelected: function() {
                    return me.selectedFeature && me.selectedFeature[0] === data.key;
                },
                raw: event
            };
        },
        updateItem: function(modelItem) {
            var id = modelItem.get("id"), style = this.toNativeStyle(modelItem.getStyle()), feature = this.map.data.getFeatureById(id);
            this.map.data.overrideStyle(feature, style), console.log("updateItem");
        },
        renderMap: function(target) {
            var me = this, mapOptions = {
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                disableDefaultUI: !0
            };
            this.map = new google.maps.Map(target, mapOptions), this.map.data.setStyle(function(feature) {
                var modelItem = me.model.findWhere({
                    id: feature.getId()
                }), style = me.toNativeStyle(modelItem.getStyle());
                return "marker" === modelItem.getFeatureType() && (style.icon || (style = {
                    icon: style
                })), style;
            }), this.addLayers(), this.addControls(), registerViewportEvents.call(this);
        },
        renderItem: function(modelItem) {
            var me = this;
            if (modelItem) {
                var row = modelItem.get("rawData"), geoJSON = ({
                    rawData: row,
                    key: row && row[0]
                }, modelItem.getFeatureType(), modelItem.get("geoJSON")), me = this;
                $.when(geoJSON).then(function(feature) {
                    if (feature) {
                        $.extend(!0, feature, {
                            properties: {
                                id: modelItem.get("id"),
                                model: modelItem
                            }
                        });
                        me.map.data.addGeoJson(feature, {
                            idPropertyName: "id"
                        });
                    }
                });
            }
        },
        toNativeStyle: function(foreignStyle) {
            var conversionTable = {
                fill: "fillColor",
                "fill-opacity": "fillOpacity",
                stroke: "strokeColor",
                "stroke-opacity": "strokeOpacity",
                "stroke-width": "strokeWeight",
                r: "scale",
                fillColor: "fillColor",
                fillOpacity: "fillOpacity",
                strokeColor: "strokeColor",
                strokeOpacity: "strokeOpacity",
                strokeWidth: "strokeWeight",
                zIndex: "zIndex"
            }, validStyle = {};
            return _.each(foreignStyle, function(value, key) {
                var nativeKey = conversionTable[key];
                if (nativeKey) validStyle[nativeKey] = value; else switch (key) {
                  case "visible":
                    validStyle.display = value ? !0 : "none";
                    break;

                  case "externalGraphic":
                    validStyle.icon = value, validStyle.size = new google.maps.Size(validStyle.graphicWidth, validStyle.graphicHeight);
                    break;

                  case "graphicName":
                    var _gn;
                    _gn = "circle" == value ? google.maps.SymbolPath.CIRCLE : value, validStyle.path = _gn;
                    break;

                  default:
                    validStyle[key] = value;
                }
            }), validStyle;
        },
        addControls: function() {
            this._addControlHover(), this._addControlZoomBox(), this._addControlBoxSelector();
        },
        _removelistenersHandle: function() {
            var me = this;
            _.keys(this.controls.listenersHandle).forEach(function(m) {
                me.controls.listenersHandle[m].remove();
            });
        },
        _addControlHover: function() {
            var me = this, setStyle = function(event, action) {
                var id = event.feature.getId(), modelItem = me.model.findWhere({
                    id: id
                });
                modelItem.setHover("hover" === action);
            };
            this.map.data.addListener("mouseover", function(event) {
                setStyle(event, "hover");
            }), this.map.data.addListener("mouseout", function(event) {
                setStyle(event, "normal");
            });
        },
        _addControlZoomBox: function() {
            var me = this;
            me.controls.zoomBox = {}, me.controls.zoomBox.bounds = null, me.controls.zoomBox.gribBoundingBox = null, 
            me.controls.zoomBox.mouseIsDown = !1;
        },
        _addControlBoxSelector: function() {
            var me = this;
            me.controls.boxSelector = {}, me.controls.boxSelector.bounds = null, me.controls.boxSelector.gribBoundingBox = null, 
            me.controls.boxSelector.mouseIsDown = !1;
        },
        _addControlClick: function() {
            var me = this;
            this.map.data.addListener("click", function(e) {
                me.model.findWhere({
                    id: event.feature.getId()
                }).getFeatureType();
                me.trigger("shape:click", me.wrapEvent(e));
            });
        },
        zoomIn: function() {
            this.map.setZoom(this.map.getZoom() + 1);
        },
        zoomOut: function() {
            this.map.setZoom(this.map.getZoom() - 1);
        },
        setSelectionMode: function() {
            this._removelistenersHandle();
            var me = this;
            me.controls.listenersHandle.click = me.map.data.addListener("click", function(event) {
                var id = event.feature.getId(), modelItem = me.model.findWhere({
                    id: id
                });
                modelItem.setSelection(modelItem.getSelection() === SelectionStates.ALL ? SelectionStates.NONE : SelectionStates.ALL), 
                me.updateItem(modelItem);
            }), me.controls.listenersHandle.mousedown = google.maps.event.addListener(this.map, "mousedown", function(e) {
                var mode = me.model.root().get("mode");
                "selection" == mode && (me.controls.boxSelector.mouseIsDown = !0, me.controls.boxSelector.mouseDownPos = e.latLng, 
                me.map.setOptions({
                    draggable: !1
                }));
            }), me.controls.listenersHandle.mouseup = google.maps.event.addListener(this.map, "mouseup", function(e) {
                var mode = me.model.root().get("mode");
                if ("selection" == mode && me.controls.boxSelector.mouseIsDown) {
                    me.controls.boxSelector.mouseIsDown = !1, me.controls.boxSelector.mouseUpPos = e.latLng;
                    new google.maps.LatLngBounds(me.controls.boxSelector.gribBoundingBox.getBounds().getSouthWest(), me.controls.boxSelector.gribBoundingBox.getBounds().getNorthEast());
                    console.log("a"), me.model.flatten().filter(function(m) {
                        return null == m.children();
                    }).each(function(m) {
                        var id = m.get("id");
                        void 0 != me.map.data.getFeatureById(id) && me.map.data.getFeatureById(id).toGeoJson(function(obj) {
                            var geometry = obj.geometry, result = !1;
                            if ("MultiPolygon" == geometry.type) result = _.some(geometry.coordinates, function(value) {
                                return _.some(value, function(value) {
                                    return _.some(value, function(value) {
                                        var latLng = new google.maps.LatLng(value[1], value[0]);
                                        return me.controls.boxSelector.gribBoundingBox.getBounds().contains(latLng);
                                    });
                                });
                            }); else if ("Point" == geometry.type) {
                                var latLng = new google.maps.LatLng(geometry.coordinates[1], geometry.coordinates[0]);
                                result = me.controls.boxSelector.gribBoundingBox.getBounds().contains(latLng);
                            }
                            result ? (m.setSelection(m.getSelection() === SelectionStates.ALL ? SelectionStates.NONE : SelectionStates.ALL), 
                            me.updateItem(m)) : m.setSelection(SelectionStates.NONE);
                        });
                    }), me.controls.boxSelector.gribBoundingBox.setMap(null), me.controls.boxSelector.gribBoundingBox = null, 
                    me.map.setOptions({
                        draggable: !0
                    });
                }
            }), me.controls.listenersHandle.mousemove = google.maps.event.addListener(this.map, "mousemove", function(e) {
                var mode = me.model.root().get("mode");
                if ("selection" == mode && me.controls.boxSelector.mouseIsDown) if (null !== me.controls.boxSelector.gribBoundingBox) {
                    var newbounds = new google.maps.LatLngBounds(me.controls.boxSelector.mouseDownPos, null);
                    newbounds.extend(e.latLng), me.controls.boxSelector.gribBoundingBox.setBounds(newbounds);
                } else me.controls.boxSelector.gribBoundingBox = new google.maps.Rectangle({
                    map: me.map,
                    fillOpacity: .15,
                    strokeWeight: .9,
                    clickable: !1
                });
            }), console.log("Selection mode enable");
        },
        setZoomBoxMode: function() {
            this._removelistenersHandle();
            var me = this;
            me.controls.listenersHandle.mousedown = google.maps.event.addListener(this.map, "mousedown", function(e) {
                var mode = me.model.root().get("mode");
                "zoombox" == mode && (me.controls.zoomBox.mouseIsDown = !0, me.controls.zoomBox.mouseDownPos = e.latLng, 
                me.map.setOptions({
                    draggable: !1
                }));
            }), me.controls.listenersHandle.mouseup = google.maps.event.addListener(this.map, "mouseup", function(e) {
                var mode = me.model.root().get("mode");
                if ("zoombox" == mode && me.controls.zoomBox.mouseIsDown) {
                    me.controls.zoomBox.mouseIsDown = !1, me.controls.zoomBox.mouseUpPos = e.latLng;
                    var boundsSelectionArea = new google.maps.LatLngBounds(me.controls.zoomBox.gribBoundingBox.getBounds().getSouthWest(), me.controls.zoomBox.gribBoundingBox.getBounds().getNorthEast());
                    me.map.fitBounds(boundsSelectionArea), me.controls.zoomBox.gribBoundingBox.setMap(null), 
                    me.controls.zoomBox.gribBoundingBox = null, me.map.setOptions({
                        draggable: !0
                    });
                }
            }), me.controls.listenersHandle.mousemove = google.maps.event.addListener(this.map, "mousemove", function(e) {
                var mode = me.model.root().get("mode");
                if ("zoombox" == mode && me.controls.zoomBox.mouseIsDown) if (null !== me.controls.zoomBox.gribBoundingBox) {
                    var newbounds = new google.maps.LatLngBounds(me.controls.zoomBox.mouseDownPos, null);
                    newbounds.extend(e.latLng), me.controls.zoomBox.gribBoundingBox.setBounds(newbounds);
                } else me.controls.zoomBox.gribBoundingBox = new google.maps.Rectangle({
                    map: me.map,
                    fillOpacity: .15,
                    strokeWeight: .9,
                    clickable: !1,
                    zIndex: 999
                });
            }), console.log("Zoom mode enable");
        },
        setPanningMode: function() {
            this._removelistenersHandle();
            var me = this;
            me.controls.listenersHandle.click = me.map.data.addListener("click", function(event) {
                var selectedItens = me.model.where({
                    isSelected: !0
                });
                _.each(selectedItens, function(modelItem) {
                    modelItem.setSelection(SelectionStates.NONE);
                });
                var id = event.feature.getId(), modelItem = me.model.findWhere({
                    id: id
                });
                modelItem.setSelection(modelItem.getSelection() === SelectionStates.ALL ? SelectionStates.NONE : SelectionStates.ALL), 
                me.updateItem(modelItem);
            }), console.log("Selection mode enable");
        },
        unselectPrevShape: function(key, shapes, shapeStyle) {
            var myself = this, prevSelected = this.selectedFeature;
            if (prevSelected && prevSelected[0] !== key) {
                var prevShapes = prevSelected[1], prevStyle = prevSelected[2];
                _.each(prevShapes, function(s) {
                    var validStyle = myself.toNativeStyle(prevStyle);
                    s.setOptions(validStyle), s.setVisible(!1), s.setVisible(_.has(prevStyle, "visible") ? !!prevStyle.visible : !0);
                });
            }
            this.selectedFeature = [ key, shapes, shapeStyle ];
        },
        setMarker: function(markerInfo, description, data) {
            var myLatLng = new google.maps.LatLng(markerInfo.latitude, markerInfo.longitude), image = new google.maps.MarkerImage(markerInfo.icon, new google.maps.Size(markerInfo.width, markerInfo.height), new google.maps.Point(0, 0), new google.maps.Point(0, 0)), marker = new google.maps.Marker({
                marker: markerInfo,
                position: myLatLng,
                map: this.map,
                icon: image,
                title: description
            }), myself = this;
            google.maps.event.addListener(marker, "click", function(e) {
                myself.trigger("marker:click", myself.wrapEvent(e, marker, "marker", markerInfo, data));
            });
        },
        addLayers: function() {
            for (var layers = [], layerIds = [], layerOptions = [], k = 0; k < this.tilesets.length; k++) {
                var thisTileset = this.tilesets[k].slice(0);
                layerIds.push(thisTileset), layerOptions.push({
                    mapTypeId: thisTileset
                }), this.tileServices[thisTileset] ? layers.push(this.tileLayer(thisTileset)) : layers.push("");
            }
            for (k = 0; k < layers.length; k++) _.isEmpty(layers[k]) || (this.map.mapTypes.set(layerIds[k], layers[k]), 
            this.map.setMapTypeId(layerIds[k]), this.map.setOptions(layerOptions[k]));
        },
        updateViewport: function(centerLongitude, centerLatitude, zoomLevel) {
            zoomLevel || (zoomLevel = 2), this.map.setZoom(zoomLevel);
            var centerPoint;
            _.isFinite(centerLatitude) && _.isFinite(centerLongitude) ? (centerPoint = new google.maps.LatLng(centerLatitude, centerLongitude), 
            this.centered = !0, this.map.panTo(centerPoint)) : this.map.panTo(new google.maps.LatLng(38, -9));
        },
        tileLayer: function(name) {
            var options = _.extend({
                tileSize: new google.maps.Size(256, 256),
                minZoom: 1,
                maxZoom: 19
            }, this.tileServicesOptions[name] || {}), urlList = this._switchUrl(this._getTileServiceURL(name)), myself = this;
            return new google.maps.ImageMapType(_.defaults({
                name: name.indexOf("/") >= 0 ? "custom" : name,
                getTileUrl: function(coord, zoom) {
                    var limit = Math.pow(2, zoom);
                    if (coord.y < 0 || coord.y >= limit) return "404.png";
                    coord.x = (coord.x % limit + limit) % limit;
                    var url;
                    if (_.isArray(urlList)) {
                        var s = _.template("${z}/${x}/${y}", {
                            x: coord.x,
                            y: coord.y,
                            z: zoom
                        }, {
                            interpolate: /\$\{(.+?)\}/g
                        });
                        url = myself._selectUrl(s, urlList);
                    } else url = urlList;
                    return _.template(url, {
                        x: coord.x,
                        y: coord.y,
                        z: zoom
                    }, {
                        interpolate: /\$\{(.+?)\}/g
                    });
                }
            }, options));
        },
        showPopup: function(data, mapElement, popupHeight, popupWidth, contents, popupContentDiv, borderColor) {
            var overlay = new OurMapOverlay(mapElement.getPosition(), popupWidth, popupHeight, contents, popupContentDiv, this.map, borderColor);
            _.each(this.overlays, function(elt) {
                elt.setMap(null);
            }), this.overlays.push(overlay);
        }
    });
    return GoogleMapEngine;
}), define("cde/components/Map/addIns/LocationResolver/geonames/geonames", [ "cdf/AddIn", "cdf/Dashboard.Clean", "cdf/lib/jquery" ], function(AddIn, Dashboard, $) {
    var geonames = {
        name: "geonames",
        label: "GeoNames",
        defaults: {
            username: "",
            url: "http://ws.geonames.org/searchJSON"
        },
        implementation: function(tgt, st, opt) {
            var location, featureClass, name = st.address;
            name || (st.city ? (name = st.city, featureClass = "P") : st.county ? (name = st.county, 
            featureClass = "A") : st.region ? (name = st.region, featureClass = "A") : st.state ? (name = st.state, 
            featureClass = "A") : st.country && (name = st.country, featureClass = "A"));
            var params = {
                q: name.replace(/&/g, ","),
                maxRows: 1,
                dataType: "json",
                username: opt.username,
                featureClass: featureClass
            };
            featureClass && (params.featureClass = featureClass);
            var onSuccess = function(result) {
                result.geonames && result.geonames.length > 0 && (location = [ parseFloat(result.geonames[0].lng), parseFloat(result.geonames[0].lat) ], 
                st.continuationFunction(location));
            }, onError = function() {
                st.continuationFunction(void 0);
            };
            return $.ajax({
                dataType: "json",
                url: opt.url,
                method: "GET",
                data: params,
                success: onSuccess,
                error: onError
            });
        }
    };
    return Dashboard.registerGlobalAddIn("NewMapComponent", "LocationResolver", new AddIn(geonames)), 
    geonames;
}), define("cde/components/Map/addIns/LocationResolver/nominatim/nominatim", [ "cdf/AddIn", "cdf/Dashboard.Clean", "cdf/lib/jquery", "amd!cdf/lib/underscore" ], function(AddIn, Dashboard, $, _) {
    var nominatim = {
        name: "openstreetmap",
        label: "OpenStreetMap",
        defaults: {
            url: "http://nominatim.openstreetmap.org/search",
            serviceParams: {
                format: "json",
                limit: "1"
            },
            mapping: {
                street: "street",
                postalcode: "postalcode",
                city: "city",
                county: "county",
                state: "state",
                country: "country"
            }
        },
        implementation: function(tgt, st, opt) {
            if (st.latitude || st.longitude) {
                var location = [ parseFloat(st.longitude), parseFloat(st.latitude) ];
                return void st.continuationFunction(location);
            }
            var params = $.extend(!0, {}, opt.serviceParams);
            _.each(_.keys(st), function(key) {
                if (!_.isFunction(st[key])) {
                    var keyLower = key.toLowerCase();
                    keyLower in opt.mapping && (params[opt.mapping[keyLower]] = st[key]);
                }
            }), params.q && (params = {
                q: params.q + ", " + _.compact(_.map(opt.mapping, function(field) {
                    return params[field];
                })).join(", ")
            });
            var onSuccess = function(result) {
                if (result && result.length > 0) {
                    var location = [ parseFloat(result[0].lon), parseFloat(result[0].lat) ];
                    st.continuationFunction(location);
                }
            }, onError = function() {
                st.continuationFunction(void 0);
            };
            return $.ajax({
                dataType: "json",
                method: "GET",
                url: opt.url,
                data: $.extend({}, opt.serviceParams, params),
                success: onSuccess,
                error: onError
            });
        }
    };
    return Dashboard.registerGlobalAddIn("NewMapComponent", "LocationResolver", new AddIn(nominatim)), 
    nominatim;
}), define("cde/components/Map/addIns/LocationResolver/mapquest/mapquest", [ "cdf/AddIn", "cdf/Dashboard.Clean", "cdf/lib/jquery", "amd!cdf/lib/underscore", "../nominatim/nominatim" ], function(AddIn, Dashboard, $, _, nominatim) {
    var mapquest = $.extend(!0, {}, nominatim, {
        name: "mapquest",
        label: "MapQuest",
        defaults: {
            url: "http://open.mapquestapi.com/nominatim/v1/search"
        }
    });
    return Dashboard.registerGlobalAddIn("NewMapComponent", "LocationResolver", new AddIn(mapquest)), 
    mapquest;
}), define("cdf/components/CggComponent.ext", [], function() {
    var CggComponentExt = {
        getCggDrawUrl: function() {
            return CONTEXT_PATH + "plugin/cgg/api/services/draw";
        }
    };
    return CggComponentExt;
}), define("cde/components/Map/addIns/MarkerImage/cggMarker/cggMarker", [ "cdf/AddIn", "cdf/Dashboard.Clean", "cdf/components/CggComponent.ext" ], function(AddIn, Dashboard, CggComponentExt) {
    var cggMarker = new AddIn({
        name: "cggMarker",
        label: "CGG Marker",
        defaults: {},
        implementation: function(tgt, st, opt) {
            var url = CggComponentExt.getCggDrawUrl() + "?script=" + st.cggGraphName, cggParameters = {};
            st.width && (cggParameters.width = st.width), st.height && (cggParameters.height = st.height), 
            cggParameters.noChartBg = !0;
            var parameter;
            for (parameter in st.parameters) cggParameters[parameter] = st.parameters[parameter];
            var level = Dashboard.debug;
            level > 1 && (cggParameters.debug = !0, cggParameters.debugLevel = level);
            for (parameter in cggParameters) void 0 !== cggParameters[parameter] && (url += "&param" + parameter + "=" + encodeURIComponent(cggParameters[parameter]));
            return url;
        }
    });
    return Dashboard.registerGlobalAddIn("NewMapComponent", "MarkerImage", cggMarker), 
    cggMarker;
}), define("cde/components/Map/NewMapComponent.ext", [], function() {
    var NewMapComponentExt = {
        getMarkerImgPath: function() {
            return CONTEXT_PATH + "api/repos/pentaho-cdf-dd/resources/custom/amd-components/Map/images/";
        }
    };
    return NewMapComponentExt;
}), define("cde/components/Map/addIns/MarkerImage/urlMarker/urlMarker", [ "cdf/AddIn", "cdf/Dashboard.Clean", "../../../NewMapComponent.ext" ], function(AddIn, Dashboard, NewMapComponentExt) {
    var urlMarker = new AddIn({
        name: "urlMarker",
        label: "Url Marker",
        defaults: {
            defaultUrl: NewMapComponentExt.getMarkerImgPath() + "marker_grey.png",
            imagePath: NewMapComponentExt.getMarkerImgPath(),
            images: [ "marker_grey.png", "marker_blue.png", "marker_grey02.png", "marker_orange.png", "marker_purple.png" ]
        },
        implementation: function(tgt, st, opt) {
            return st.url ? st.url : st.position ? opt.imagePath + opt.images[st.position % opt.images.length] || opt.defaultUrl : opt.defaultUrl;
        }
    });
    return Dashboard.registerGlobalAddIn("NewMapComponent", "MarkerImage", urlMarker), 
    urlMarker;
}), define("cde/components/Map/addIns/ShapeResolver/simpleJSON", [ "cdf/AddIn", "cdf/Dashboard.Clean", "cdf/lib/jquery", "amd!cdf/lib/underscore" ], function(AddIn, Dashboard, $, _) {
    function multiPolygonToGeoJSON(latLonMultiPolygon) {
        var lonLatMultiPolygon = _.map(latLonMultiPolygon, function(polygon) {
            return _.map(polygon, function(lineString) {
                return _.map(lineString, function(point) {
                    return point.reverse();
                });
            });
        }), feature = {
            type: "Feature",
            geometry: {
                type: "MultiPolygon",
                coordinates: lonLatMultiPolygon
            },
            properties: {}
        };
        return feature;
    }
    var thisAddIn = {
        name: "simpleJSON",
        label: "Simple JSON shape resolver",
        defaults: {
            url: ""
        },
        implementation: function(tgt, st, opt) {
            var deferred = $.Deferred(), url = opt.url || st._shapeSource;
            return url ? $.ajax(url, {
                async: !0,
                type: "GET",
                dataType: "json",
                success: function(latlonMap) {
                    var map = _.chain(latlonMap).map(function(multiPolygonLatLon, key) {
                        return [ key, multiPolygonToGeoJSON(multiPolygonLatLon) ];
                    }).object().value();
                    deferred.resolve(map);
                },
                error: function() {
                    deferred.resolve({});
                }
            }) : deferred.resolve(null), deferred.promise();
        }
    };
    Dashboard.registerGlobalAddIn("NewMapComponent", "ShapeResolver", new AddIn(thisAddIn));
}), define("cde/components/Map/addIns/ShapeResolver/kml", [ "cdf/AddIn", "cdf/Dashboard.Clean", "cdf/lib/jquery", "amd!cdf/lib/underscore" ], function(AddIn, Dashboard, $, _) {
    function getShapeFromKML(rawData, idSelector, parseShapeKey) {
        var mymap = {};
        return $(rawData).find("Placemark").each(function(idx, y) {
            var key;
            if (_.isFunction(parseShapeKey)) try {
                key = parseShapeKey(y);
            } catch (e) {
                key = $(y).find(idSelector).text();
            } else key = $(y).find(idSelector).text();
            var polygonArray = _.map($(y).find("Polygon"), function(yy) {
                var polygon = [];
                return _.each([ "outerBoundaryIs", "innerBoundaryIs" ], function(b) {
                    var polygonObj = $(yy).find(b + " LinearRing coordinates");
                    _.each(polygonObj, function(v) {
                        var s = $(v).text().trim();
                        if (s.length > 0) {
                            var p = _.map(s.split(" "), function(el) {
                                return _.map(el.split(",").slice(0, 2), parseFloat);
                            });
                            polygon.push(p);
                        }
                    });
                }), polygon;
            });
            _.isEmpty(polygonArray) || mymap[key] || (mymap[key] = multiPolygonToGeoJSON(polygonArray));
        }), mymap;
    }
    function multiPolygonToGeoJSON(polygonArray) {
        var feature = {
            type: "Feature",
            geometry: {
                type: "MultiPolygon",
                coordinates: polygonArray
            },
            properties: {}
        };
        return feature;
    }
    var thisAddIn = {
        name: "kml",
        label: "KML shape resolver",
        defaults: {
            url: "",
            idSelector: "name",
            parseShapeKey: null
        },
        implementation: function(tgt, st, opt) {
            var deferred = $.Deferred(), url = opt.url || st._shapeSource, parseShapeKey = opt.parseShapeKey || st._parseShapeKey;
            return url ? $.ajax(url, {
                async: !0,
                type: "GET",
                processData: !1,
                success: function(data) {
                    var map = getShapeFromKML(data, opt.idSelector, parseShapeKey);
                    deferred.resolve(map);
                },
                error: function() {
                    deferred.resolve({});
                }
            }) : deferred.resolve(null), deferred.promise();
        }
    };
    Dashboard.registerGlobalAddIn("NewMapComponent", "ShapeResolver", new AddIn(thisAddIn));
}), define("cde/components/Map/addIns/ShapeResolver/geoJSON", [ "cdf/AddIn", "cdf/Dashboard.Clean", "cdf/Logger", "cdf/lib/jquery", "amd!cdf/lib/underscore" ], function(AddIn, Dashboard, Logger, $, _) {
    function toMappedGeoJSON(json, idPropertyName) {
        var map = _.chain(json.features).map(function(feature, idx) {
            var id = getFeatureId(feature, idPropertyName) || idx;
            return [ id, feature ];
        }).object().value();
        return map;
    }
    function getFeatureId(feature, idPropertyName) {
        var id = feature.id;
        return idPropertyName && (id = feature.properties[idPropertyName] || id), id;
    }
    var thisAddIn = {
        name: "geoJSON",
        label: "GeoJSON shape resolver",
        defaults: {
            url: "",
            idPropertyName: ""
        },
        implementation: function(tgt, st, opt) {
            var deferred = $.Deferred(), url = opt.url || st._shapeSource;
            return url ? $.ajax(url, {
                async: !0,
                type: "GET",
                dataType: "json",
                success: function(json) {
                    var map = toMappedGeoJSON(json, opt.idPropertyName);
                    deferred.resolve(map);
                },
                error: function() {
                    Logger.log("NewMapComponent geoJSON addIn: failed to retrieve data at" + url, "debug"), 
                    deferred.resolve({});
                }
            }) : (Logger.log("NewMapComponent geoJSON addIn: no url is defined", "debug"), deferred.resolve(null)), 
            deferred.promise();
        }
    };
    Dashboard.registerGlobalAddIn("NewMapComponent", "ShapeResolver", new AddIn(thisAddIn));
}), define("cde/components/Map/addIns/mapAddIns", [ "./LocationResolver/geonames/geonames", "./LocationResolver/nominatim/nominatim", "./LocationResolver/mapquest/mapquest", "./MarkerImage/cggMarker/cggMarker", "./MarkerImage/urlMarker/urlMarker", "./ShapeResolver/simpleJSON", "./ShapeResolver/kml", "./ShapeResolver/geoJSON" ], function() {}), 
define("cde/components/Map/Map", [ "cdf/lib/jquery", "amd!cdf/lib/underscore", "cdf/components/UnmanagedComponent", "./Map.lifecycle", "./Map.selector", "./Map.model", "./Map.configuration", "./Map.colorMap", "./ControlPanel/ControlPanel", "./Map.tileServices", "./engines/openlayers2/MapEngineOpenLayers", "./engines/google/MapEngineGoogle", "./addIns/mapAddIns", "css!./Map" ], function($, _, UnmanagedComponent, ILifecycle, ISelector, IMapModel, IConfiguration, IColorMap, ControlPanel, tileServices, OpenLayersEngine, GoogleMapEngine) {
    var NewMapComponent = UnmanagedComponent.extend(ILifecycle).extend(ISelector).extend(IMapModel).extend(IConfiguration).extend(IColorMap).extend(tileServices).extend({
        mapEngine: void 0,
        locationResolver: void 0,
        API_KEY: !1,
        update: function() {
            return this.preExec() ? (this.maybeToggleBlock(!0), this.configuration = this.getConfiguration(), 
            void this._initMapEngine().then(_.bind(this.init, this)).then(_.bind(function() {
                this.queryDefinition && !_.isEmpty(this.queryDefinition) ? this.getQueryData() : this.onDataReady(this.testData || {});
            }, this))) : !1;
        },
        onDataReady: function(json) {
            return $.when(this.resolveFeatures(json)).then(_.bind(function(json) {
                this.initModel(json), this._initControlPanel(), this.updateSelection(), this._processMarkerImages();
            }, this)).then(_.bind(this.render, this)).then(_.bind(this._concludeUpdate, this));
        },
        _initMapEngine: function() {
            var options = $.extend(!0, {}, this.configuration.addIns.MapEngine.options, {
                options: this.configuration
            });
            return "google" == this.configuration.addIns.MapEngine.name ? this.mapEngine = new GoogleMapEngine(options) : this.mapEngine = new OpenLayersEngine(options), 
            this.mapEngine.init();
        },
        init: function() {
            var $map = $('<div class="map-container"/>');
            $map.css({
                position: "relative",
                overflow: "hidden",
                width: "100%",
                height: "100%"
            }), $map.appendTo(this.placeholder().empty()), this._relayMapEngineEvents(), this._registerEvents(), 
            this.mapEngine.renderMap($map.get(0)), this._initPopup();
        },
        _initControlPanel: function() {
            var $controlPanel = $('<div class="map-controls" />').prependTo(this.placeholder());
            this.controlPanel = new ControlPanel($controlPanel, this.model), this.controlPanel.render();
            var me = this, eventMapping = {
                "selection:complete": _.bind(this.processChange, this),
                "zoom:in": _.bind(this.mapEngine.zoomIn, this.mapEngine),
                "zoom:out": _.bind(this.mapEngine.zoomOut, this.mapEngine)
            };
            _.each(eventMapping, function(callback, event) {
                _.isFunction(callback) && me.listenTo(me.controlPanel, event, callback);
            });
        },
        render: function() {
            this.mapEngine.render(this.model);
            var centerLatitude = this.configuration.viewport.center.latitude, centerLongitude = this.configuration.viewport.center.longitude, defaultZoomLevel = this.configuration.viewport["default"];
            this.mapEngine.updateViewport(centerLongitude, centerLatitude, defaultZoomLevel);
        },
        _relayMapEngineEvents: function() {
            var engine = this.mapEngine, component = this, events = [ "marker:click", "marker:mouseover", "marker:mouseout", "shape:click", "shape:mouseover", "shape:mouseout", "map:zoom", "map:center" ];
            _.each(events, function(event) {
                component.listenTo(engine, event, function() {
                    var args = _.union([ event ], arguments);
                    component.trigger.apply(component, args);
                });
            });
        },
        _registerEvents: function() {
            var me = this;
            this.on("marker:click", function(event) {
                var result;
                _.isFunction(me.markerClickFunction) && (result = me.markerClickFunction(event)), 
                result !== !1 && me.markerClickCallback(event);
            }), this.on("shape:mouseover", function(event) {
                if (_.isFunction(me.shapeMouseOver)) {
                    var result = me.shapeMouseOver(event);
                    result && (result = _.isObject(result) ? result : {}, event.draw(_.defaults(result, {
                        zIndex: 1
                    }, event.style)));
                }
            }), this.on("shape:mouseout", function(event) {
                var result = {};
                _.isFunction(me.shapeMouseOut) && (result = me.shapeMouseOut(event));
            }), this.on("shape:click", function(event) {
                if (me.processChange(), _.isFunction(me.shapeMouseClick)) {
                    me.shapeMouseClick(event);
                    return;
                }
            });
        },
        _processMarkerImages: function() {
            function processRow(m) {
                var mapping = this.mapping, row = m.get("rawData"), st = $.extend(!0, {}, state, {
                    data: row,
                    position: m.get("rowIdx"),
                    height: row[mapping.markerHeight],
                    width: row[mapping.markerWidth]
                }), addinName = this.configuration.addIns.MarkerImage.name, extraSt = {}, extraOpts = {};
                "cggMarker" === addinName && (extraSt = {
                    cggGraphName: this.configuration.addIns.MarkerImage.options.cggScript,
                    parameters: _.object(_.map(this.configuration.addIns.MarkerImage.options.parameters, function(parameter) {
                        return [ parameter[0], row[mapping[parameter[1]]] ];
                    }))
                });
                var addIn = this.getAddIn("MarkerImage", addinName);
                if (addIn) {
                    $.extend(!0, st, extraSt);
                    var opts = $.extend(!0, {}, this.getAddInOptions("MarkerImage", addIn.getName()), extraOpts), markerIconUrl = addIn.call(this.placeholder(), st, opts);
                    $.extend(!0, m.attributes.styleMap, {
                        pan: {
                            unselected: {
                                normal: {
                                    graphicWidth: st.width,
                                    graphicHeight: st.height,
                                    externalGraphic: markerIconUrl
                                }
                            }
                        }
                    });
                }
            }
            var markersRoot = this.model.findWhere({
                id: "markers"
            });
            if (markersRoot) {
                var state = {
                    height: this.configuration.addIns.MarkerImage.options.height,
                    width: this.configuration.addIns.MarkerImage.options.width,
                    url: this.configuration.addIns.MarkerImage.options.iconUrl
                };
                markersRoot.leafs().each(_.bind(processRow, this)).value();
            }
        },
        _initPopup: function() {
            var $popupContentsDiv = $("#" + this.popupContentsDiv), $popupDivHolder = $popupContentsDiv.clone();
            this.popupContentsDiv && 1 != $popupContentsDiv.length && this.placeholder().append($popupDivHolder.html("None"));
        },
        markerClickCallback: function(event) {
            return;
        }
    });
    return NewMapComponent;
}), function(c) {
    var d = document, a = "appendChild", i = "styleSheet", s = d.createElement("style");
    s.type = "text/css", d.getElementsByTagName("head")[0][a](s), s[i] ? s[i].cssText = c : s[a](d.createTextNode(c));
}('.map-control-panel .map-control-button{width:20px;height:20px;border:1px solid black;background-size:100% 100%;}.map-control-zoom-in{background-image:url("/pentaho/content/pentaho-cdf-dd/resources/custom/amd-components/Map/theme/dark/zoom-plus-mini.png");}.map-control-zoom-out{background-image:url("/pentaho/content/pentaho-cdf-dd/resources/custom/amd-components/Map/theme/dark/zoom-minus-mini.png");}.map-control-pan{background-image:url("/pentaho/plugin/pentaho-cdf/api/resources/js/lib/OpenMap/OpenLayers/img/panning-hand-off.png");}.map-control-select{background-image:url("/pentaho/plugin/pentaho-cdf/api/resources/js/lib/OpenMap/OpenLayers/img/drag-rectangle-off.png");}.map-control-zoombox{background-image:url("/pentaho/plugin/pentaho-cdf/api/resources/js/lib/OpenMap/OpenLayers/img/zoom-world-mini.png");}.olMap .olHandlerBoxSelectFeature{border:2px solid deeppink;}.olMap .olHandlerBoxZoomBox{border:2px solid deeppink;}#featurePopup394246{border:3px solid #394246 !important;}#featurePopup11b4eb{border:3px solid #11b4eb !important;}#featurePopup7a879a{border:3px solid #7a879a !important;}#featurePopupe35c15{border:3px solid #e35c15 !important;}#featurePopup674f73{border:3px solid #674f73 !important;}.olPopupCloseBox{background:url("amd-components/Map/images/close.png") no-repeat scroll 0 0 transparent;cursor:pointer;height:28px !important;width:28px !important;top:1px !important;right:1px !important;}#MapOverlay{background-color:white;z-index:0;}');