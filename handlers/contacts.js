// 'use strict';
// var dataProvider = require('../data/contacts.js');
// /**
//  * Operations on /contacts
//  */
// module.exports = {
//     /**
//      * summary: 
//      * description: 
//      * parameters: 
//      * produces: application/json, text/json
//      * responses: 200
//      */
//     get: function contacts_get(req, res, next) {
//         /**
//          * Get the data for response 200
//          * For response `default` status 200 is used.
//          */
//         var status = 200;
//         var provider = dataProvider['get']['200'];
//         provider(req, res, function (err, data) {
//             if (err) {
//                 next(err);
//                 return;
//             }
//             res.status(status).send(data && data.responses);
//         });
//     }
// };

'use strict';

var repository = require('../lib/contactRepository');

module.exports = {
    get: function contacts_get(req, res) {
        res.json(repository.all())
    }
}