'use strict';

var actions = require('./lib/action.json');
var triggers = require('./lib/trigger.json');
var devices = {
    arduino: require('./lib/device_arduino.json'),
    grovepi: require('./lib/device_grovepi.json')
};
var mcu = require('./lib/mcu.json');

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
    findDeviceById: function (platform, id) {
        const device = devices[platform];
        for (const d of device) {
            if (d['id'] === id) {
                return d;
            }
        }
        return undefined;
    },
    findDeviceByFunction: function (platform, deviceType, funcName) {
        const result = [];
        for (const device of devices[platform]) {
            let connectivity = [];
            for (const compatibility of device.compatibility) {
                for (const type of compatibility.type) {
                    if (type.name === deviceType) {
                        // for each function support we push the one that match what we need
                        // into a list along with it's dependency
                        const supportFn = [];
                        for (const fn of type.fn) {
                            if (funcName.indexOf(fn) !== -1) {
                                supportFn.push(fn);
                            }
                        }

                        // if the lenght of support function it equal to the lenght of funcName
                        // (function that we need) then this device is usuable
                        if (supportFn.length === funcName.length) {
                            connectivity.push(compatibility.connection);
                        }
                    }
                }
            }
            if (connectivity.length != 0) {
                result.push({ name: device.id, connectivity: connectivity });
            }
        }
        return result;
    },
    findMCUById: function (id) {
        for (const m of mcu) {
            if (m['id'] === id) {
                return m;
            }
        }
        return undefined;
    },
}