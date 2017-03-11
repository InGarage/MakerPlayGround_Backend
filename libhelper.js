'use strict';

var actions = require('./lib/action.json');
var triggers = require('./lib/trigger.json');
var interfaces = require('./lib/interface.json');
var devices = require('./lib/device.json');

module.exports = {
    findActionById: function (id) {
        for (var category of actions) {
            for (var action of category['children']) {
                if (action['id'] === id)
                    return action;
            }
        }
        return undefined;
    },
    findTriggerById: function (id) {
        for (var category of triggers) {
            for (var trigger of category['children']) {
                if (trigger['id'] === id)
                    return trigger;
            }
        }
        return undefined;
    },
    findEdgeBySrcNode: function (graph, nodeId) {
        var result = [];
        for (var edgeId of Object.keys(graph['edges'])) {
            var edge = graph['edges'][edgeId];
            if (edge['src_node_id'] === nodeId) {
                result.push(edge);
            }
        }
        return result;
    },
    findEdgeBySrcDestNode: function (graph, nodeId) {
        var result = [];
        for (var edgeId of Object.keys(graph['edges'])) {
            var edge = graph['edges'][edgeId];
            if (edge['src_node_id'] === nodeId || edge['dest_node_id'] === nodeId) {
                result.push(edge);
            }
        }
        return result;
    },
    findDeviceById: function (id) {
        for (var device of devices) {
            if (device['id'] === id) {
                return device;
            }
        }
        return undefined;
    },
    findDeviceByFunction: function(deviceType, funcName) {
        var result = [];
        for (var device of devices) {
            for (var compatibility of device.compatibility) {
                for (var type of compatibility.type) {
                    if (type.name === deviceType) {
                        var availableName = [];
                        for (var fn of type.fn) {
                            availableName.push(fn['name']);
                        }

                        for (var fn of funcName) {
                            if (fn)
                        }

                        for (var fn of type.fn) {
                            if (fn.name === funcName) {
                                var d = {
                                    name: device.id,
                                    connection: compatibility.connection,
                                    dependency: fn.dependency
                                }
                                result.push(d);
                            }
                        }
                    }
                }
            }
        }
        return result;
    }
}