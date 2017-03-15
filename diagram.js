var libhelper = require('./libhelper.js');

const STANDALONE_MCU_GAP = 50;
const BREADBOARD_TOP_MARGIN = 200;
const PIN_SPACE = 14.4;

// breadboard size
const breadboard = {
    small: {
        top_power_pin: { x: 11.2, y: 4.8 },
        power_pin_gap: 14.4,
        top_connection_pin: { x: 8.5, y: 33.6 },
        num_rows: 30,
        bottom_power_pin: { x: 11.2, y: 134.4 }
    },
    large: {
        name: 'breadboard_large',
        width: 468.238 * 2,
        height: 151.199 * 2,
        top_power_pin: { x: 25.333 * 2, y: 7.2 * 2 },
        power_pin_gap: 14.4 * 2,
        top_connection_pin: { x: 10.92 * 2, y: 36 * 2 },
        num_rows: 63 * 2,
        bottom_power_pin: { x: 25.333 * 2, y: 136.8 * 2},
        center_gap: 21.6 * 2
    }
};

// const data = {
//     platform: arduino,
//     mcu: 'MCU_1',
//     variant: 'Arduino UNO',
//     connection: [
//       {
//         name: 'Audio',
//         type: 'DEV_1',
//         pin: '3'   // must figure out how to map to pin name
//       },
//       {
//         name: 'Temp1',
//         type: 'DEV_3',
//         pin: 'I2C'
//       },
//       {
//         name: 'Temp2',
//         type: 'DEV_4',
//         pin: 'I2C'
//       }
//     ]
//   };

// const response = {
//     breadboard: {
//         name: 'breadboard_large.svg',
//         position: { x: 0, y: 0 }
//     },
//     mcu: {
//         name: 'MCU_1',
//         position: { x: 0, y: 0 }
//     },
//     devices: [
//         {
//             name: ['Temp1', 'Humidity'],
//             type: 'DEV_1'
//             position: { x: 0, y: 0 }
//         }
//     ],
//     connections: [
//         {
//             type: 'PWR',    // PWR GND GPIO SDA SCL ANALOG PWM
//             startx: 100,
//             starty: 100,
//             endx: 50,
//             endy: 50
//         },
//         {
//             type: 'I2C',
//             startx: 100,
//             starty: 100,
//             endx: 50,
//             endy: 50
//         }
//     ]
// };

function findMCUPin(mcu, pinName) {
    for (const pin of mcu['display']['pin']) {
        if (pin['name'] === pinName) {
            return pin;
        }
    }
    return undefined;
}

function findDevicePinByConnection(dev, pinName) {
    for (const pin of dev['display']['pin']) {
        if (pin['connection'] === pinName) {
            return pin;
        }
    }
    return undefined;
}

module.exports = {
    getConnectionDiagram: function (data) {
        // always use the large breadboard
        const board = breadboard['large'];

        // response object
        const response = {
            breadboard: {
                name: board['name'],
                position: { x: 0, y: BREADBOARD_TOP_MARGIN }
            },
            mcu: {},
            devices: [],
            connections: []
        };

        // sort the device into standalone and breadboard group
        const standaloneDevice = [];
        const breadboardDevice = [];
        for (const d of data['connection']) {
            const deviceInfo = libhelper.findDeviceById(data['platform'], d['type']);
            if (deviceInfo['display']['type'] === 'standalone') {
                standaloneDevice.push(d);
            } else if (deviceInfo['display']['type'] === 'breadboard') {
                breadboardDevice.push(d);
            } else {
                throw 'Found unsupport device display type : ' + deviceInfo['display']['type'];
            }
        }

        // calculate position in the breadboard for the devices that need breadboard connection
        const breadboardHole = [];
        const firstDevice = libhelper.findDeviceById(data['platform'], breadboardDevice[0]['type']);
        const hole = Math.ceil(firstDevice['display']['pin'][0]['x'] / PIN_SPACE);
        const x = board['top_connection_pin']['x'] - firstDevice['display']['pin'][0].x;
        const y = BREADBOARD_TOP_MARGIN + board['top_connection_pin']['y']
            - firstDevice['display']['pin'][0].y;
        response['devices'].push({
            name: breadboardDevice[0]['name'],
            type: breadboardDevice[0]['type'],
            position: { x: x, y: y }
        });
        breadboardHole.push(hole);
        for (let i = 1; i < data['connection'].length; i++) {
            const previousDevice = libhelper.findDeviceById(data['platform'], breadboardDevice[i - 1]['type']);
            const holeUsed = previousDevice['display']['pin'].length;
            const rightSpace = previousDevice['display']['width']
                - previousDevice['display']['pin'][previousDevice['display']['pin'].length - 1].x;

            const currentDevice = libhelper.findDeviceById(data['platform'], breadboardDevice[i]['type']);
            const leftSpace = currentDevice['display']['pin'][0].x;

            const hole = holeUsed + Math.ceil(rightSpace / PIN_SPACE) + Math.ceil(leftSpace / PIN_SPACE);
            breadboardHole.push(breadboardHole[i - 1] + hole - 1);

            const x = (board['top_connection_pin']['x'] + ((breadboardHole[i] - 1) * PIN_SPACE))
                - currentDevice['display']['pin'][0].x;
            const y = BREADBOARD_TOP_MARGIN + board['top_connection_pin']['y']
                - currentDevice['display']['pin'][0].y;
            response['devices'].push({
                name: breadboardDevice[i]['name'],
                type: breadboardDevice[i]['type'],
                position: { x: x, y: y }
            });
        }

        // TODO: handle standalone device

        // place an mcu
        const mcu = libhelper.findMCUById(data['mcu']);
        if (mcu['display']['type'] === 'standalone') {
            response['mcu'] = {
                name: data['mcu'],
                position: { x: 0, y: BREADBOARD_TOP_MARGIN + breadboard['large'].height + STANDALONE_MCU_GAP }
            };
        } else if (mcu['display']['type'] === 'breadboard') {
            // TODO: ...
        } else {
            throw 'Found unsupport MCU type : ' + mcu['display']['type'];
        }

        // connect i2c pin on breadboard
        const i2cDevice = [];
        const i2cDeviceHole = [];
        for (let i = 0; i < breadboardDevice.length; i++) {
            const dev = libhelper.findDeviceById(data['platform'], breadboardDevice[i]['type']);
            if (findDevicePinByConnection(dev, 'SDA') !== undefined) {
                i2cDevice.push(breadboardDevice[i]);
                i2cDeviceHole.push(breadboardHole[i]);
            }
        }

        // for (let i = 0; i < i2cDevice.length - 1; i++) {
        //     const dev1 = libhelper.findDeviceById(data['platform'], i2cDevice[i]['type']);
        //     const dev2 = libhelper.findDeviceById(data['platform'], i2cDevice[i + 1]['type']);

        //     const sdaPin1 = findDevicePinByConnection(dev1, 'SDA');
        //     const sdaPin2 = findDevicePinByConnection(dev2, 'SDA');
        //     response['connections'].push(
        //         {
        //             type: 'SDA',
        //             startx: board['top_connection_pin']['x'] + ((i2cDeviceHole[i] - 1) * PIN_SPACE)
        //             - dev1['display']['pin'][0]['x'] + parseInt(sdaPin1.x),
        //             starty: BREADBOARD_TOP_MARGIN + board['top_connection_pin']['y'] + PIN_SPACE * ((i % 2) + 1),
        //             endx: board['top_connection_pin']['x'] + ((i2cDeviceHole[i + 1] - 1) * PIN_SPACE)
        //             - dev2['display']['pin'][0]['x'] + parseInt(sdaPin2.x),
        //             endy: BREADBOARD_TOP_MARGIN + board['top_connection_pin']['y'] + PIN_SPACE * ((i % 2) + 1),
        //         }
        //     );
        //     const sclPin1 = findDevicePinByConnection(dev1, 'SCL');
        //     const sclPin2 = findDevicePinByConnection(dev2, 'SCL');
        //     response['connections'].push(
        //         {
        //             type: 'SCL',
        //             startx: board['top_connection_pin']['x'] + ((i2cDeviceHole[i] - 1) * PIN_SPACE)
        //             - dev1['display']['pin'][0]['x'] + parseInt(sclPin1.x),
        //             starty: BREADBOARD_TOP_MARGIN + board['top_connection_pin']['y'] + PIN_SPACE * 2 + PIN_SPACE * ((i % 2) + 1),
        //             endx: board['top_connection_pin']['x'] + ((i2cDeviceHole[i + 1] - 1) * PIN_SPACE)
        //             - dev2['display']['pin'][0]['x'] + parseInt(sclPin2.x),
        //             endy: BREADBOARD_TOP_MARGIN + board['top_connection_pin']['y'] + PIN_SPACE * 2 + PIN_SPACE * ((i % 2) + 1),
        //         }
        //     );
        // }

        // connect i2c pin from mcu to breadboard

        // connect power pin of board to power rail
        for (let i = 0; i < breadboardDevice.length; i++) {
            const currDevice = libhelper.findDeviceById(data['platform'], breadboardDevice[i]['type']);
            const vccPin = findDevicePinByConnection(currDevice, 'VCC');
            response['connections'].push(
                {
                    type: 'PWR',
                    startx: board['top_connection_pin']['x'] + ((breadboardHole[i] - 1) * PIN_SPACE)
                    - currDevice['display']['pin'][0]['x'] + parseInt(vccPin.x),
                    starty: BREADBOARD_TOP_MARGIN + board['top_connection_pin']['y'] + PIN_SPACE * 2,
                    endx: board['bottom_power_pin']['x'] + PIN_SPACE * 4 + board['power_pin_gap'] + (PIN_SPACE * i),
                    endy: BREADBOARD_TOP_MARGIN + board['bottom_power_pin']['y'] + PIN_SPACE
                });
            const gndPin = findDevicePinByConnection(currDevice, 'GND');
            response['connections'].push(
                {
                    type: 'GND',
                    startx: board['top_connection_pin']['x'] + ((breadboardHole[i] - 1) * PIN_SPACE)
                    - currDevice['display']['pin'][0]['x'] + parseInt(gndPin.x),
                    starty: BREADBOARD_TOP_MARGIN + board['top_connection_pin']['y'] + PIN_SPACE * 2,
                    endx: board['bottom_power_pin']['x'] + PIN_SPACE * 4 + board['power_pin_gap'] + (PIN_SPACE * i),
                    endy: BREADBOARD_TOP_MARGIN + board['bottom_power_pin']['y']
                });
        }

        // connect power from mcu to breadboard
        const vccPin = findMCUPin(mcu, 'VCC');
        const gndPin = findMCUPin(mcu, 'GND');
        response['connections'].push(
            {
                type: 'PWR',
                startx: parseInt(vccPin.x),
                starty: BREADBOARD_TOP_MARGIN + STANDALONE_MCU_GAP + board['height'] + parseInt(vccPin.y),
                endx: board['bottom_power_pin']['x'],
                endy: BREADBOARD_TOP_MARGIN + board['bottom_power_pin']['y'] + PIN_SPACE
            },
            {
                type: 'GND',
                startx: parseInt(gndPin.x),
                starty: BREADBOARD_TOP_MARGIN + STANDALONE_MCU_GAP + board['height'] + parseInt(gndPin.y),
                endx: board['bottom_power_pin']['x'],
                endy: BREADBOARD_TOP_MARGIN + board['bottom_power_pin']['y']
            }
        );
        
        // connect gpio pwm analog
        for (let i = 0; i < breadboardDevice.length; i++) {
            const currDevice = libhelper.findDeviceById(data['platform'], breadboardDevice[i]['type']);
            const connection = currDevice.compatibility[0].connection; // hard-coded
            console.log('conn', connection);
            if (connection === 'GPIO' || connection === 'PWM' || connection === 'Analog') {
                const pin = findDevicePinByConnection(currDevice, connection);
                const mcuPin = findMCUPin(mcu, breadboardDevice[i]['pin']);
                console.log(pin, mcuPin);
                response['connections'].push(
                    {
                        type: connection,
                        startx: board['top_connection_pin']['x'] + ((breadboardHole[i] - 1) * PIN_SPACE)
                        - currDevice['display']['pin'][0]['x'] + parseInt(pin.x),
                        starty: BREADBOARD_TOP_MARGIN + board['top_connection_pin']['y'] + PIN_SPACE * 2,
                        endx: parseInt(mcuPin.x),
                        endy: BREADBOARD_TOP_MARGIN + STANDALONE_MCU_GAP + board['height'] + parseInt(mcuPin.y),
                    }
                );
            }
        }

        return response;
    }
}