// 'use strict';
// var dataProvider = require('../../data/contacts/{id}.js');
// /**
//  * Operations on /contacts/{id}
//  */
// module.exports = {
//     /**
//      * summary: 
//      * description: 
//      * parameters: id
//      * produces: application/json, text/json
//      * responses: 200
//      */
//     get: function contacts_getById(req, res, next) {
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

var repository = require('../../lib/contactRepository');

module.exports = {
    get: function contacts_get(req, res) {
        res.json(repository.get(req.params['id']))
    }
}