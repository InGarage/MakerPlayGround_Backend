var libhelper = require('./libhelper.js');

module.exports = {
    getDeviceList: function (graph) {
        var deviceMapping = new Map();

        // populate device mapping
        for (const nodeId of Object.keys(graph['nodes'])) {
            const node = graph['nodes'][nodeId];
            const name = node['params']['name'][0].replaceAll(' ', '_');   // replace space with an underscore
            const action = libhelper.findActionById(node['action_id']);
            if (action === undefined) {
                throw 'Error: unknown action id => ' + node['action_id'];
            }
            // create a new device if it doesn't exist in a map
            if (!deviceMapping.has(name)) {
                const device = {
                    type: action['require']['type'],
                    name: name,
                    fn: [action['require']['fn_name']]
                };
                deviceMapping.set(name, device);
            } else {
                const device = deviceMapping.get(name);
                if (device.fn.indexOf(action['require']['fn_name']) === -1) {
                    device.fn.append(action['require']['fn_name']);
                }
            }
        }
        for (const edgeId of Object.keys(graph['edges'])) {
            const edges = graph['edges'][edgeId];
            for (const trigger of edges['trigger']) {
                const name = trigger['params']['name'][0].replaceAll(' ', '_');   // replace space with an underscore
                const triggerInfo = libhelper.findTriggerById(trigger['id']);
                if (triggerInfo === undefined) {
                    throw 'Error: unknown trigger id => ' + trigger['id'];
                }
                // create a new device if it doesn't exist in a map
                if (!deviceMapping.has(name)) {
                    const device = {
                        type: triggerInfo['require']['type'],
                        name: name,
                        fn: [triggerInfo['require']['fn_name']]
                    };
                    deviceMapping.set(name, device);
                } else {
                    const device = deviceMapping.get(name);
                    if (device.fn.indexOf(triggerInfo['require']['fn_name']) === -1) {
                        device.fn.append(triggerInfo['require']['fn_name']);
                    }
                }
            }
        }

        for (const device of deviceMapping) {
            libhelper.findDeviceByFunction(device['type'], device['fn']);
        }

    }
}