var libhelper = require('./libhelper.js');

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

module.exports = {
    getDeviceList: function (graph) {
        let graphData = {};

        // populate device mapping
        for (const nodeId of Object.keys(graph['nodes'])) {
            const node = graph['nodes'][nodeId];
            const name = node['params']['name'][0].replaceAll(' ', '_');   // replace space with an underscore
            const action = libhelper.findActionById(node['action_id']);
            if (action === undefined) {
                throw 'Error: unknown action id => ' + node['action_id'];
            }
            // create a new device if it doesn't exist in a map
            const type = action['require']['type'];
            if (!graphData.hasOwnProperty(type)) {
                graphData[type] = {};
            }
            if (!graphData[type].hasOwnProperty(name)) {
                graphData[type][name] = [action['require']['fn_name']];
            } else {
                // push the new function name to the exist list
                const fnList = graphData[type][name];
                if (fnList.indexOf(action['require']['fn_name']) === -1) {
                    fnList.push(action['require']['fn_name']);
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
                const type = triggerInfo['require']['type'];
                if (!graphData.hasOwnProperty(type)) {
                    graphData[type] = {};
                }
                if (!graphData[type].hasOwnProperty(name)) {
                    graphData[type][name] = [triggerInfo['require']['fn_name']];
                } else {
                    // push the new function name to the exist list
                    const fnList = graphData[type][name];
                    if (fnList.indexOf(triggerInfo['require']['fn_name']) === -1) {
                        fnList.push(triggerInfo['require']['fn_name']);
                    }
                }
            }
        }

        console.log('DEVICE MAPPING', graphData);

        const response = [];

        const platformName = ['arduino', 'grovepi'];
        for (const pn of platformName) {
            const platformInfo = {
                mcu: pn,
                devices: []
            };

            for (const type of Object.keys(graphData)) {
                const category = {
                    category: type,
                    devices: []
                }
                for (const name of Object.keys(graphData[type])) {
                    const compatibleDevices = libhelper.findDeviceByFunction(pn, type, graphData[type][name]);
                    const device = {
                        name: name,
                        compatible_device: compatibleDevices
                    }
                    category.devices.push(device);
                }
                platformInfo.devices.push(category);
            }
            
            response.push(platformInfo);
        }

        // console.log(result);

        // let response = [];
        // for (const [key, value] of result.entries()) {
        //     response.push({ category: key, device: value });
        // }
        
        return response;
    }
}