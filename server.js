const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jwt = require('express-jwt');
const cors = require('cors');

var port = process.env.PORT || 3001;

var config = {
  userName: process.env.SQLAZURECONNSTR_USERNAME,
  password: process.env.SQLAZURECONNSTR_PASSWORD,
  server: process.env.SQLAZURECONNSTR_SERVER,
  options: { encrypt: true, database: 'makerplayground' }
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cors());

// Authentication middleware. When used, the access token must exist and be verified against
// the signing secret for the API
const authenticate = jwt({
  // Dynamically provide a signing key based on the kid in the header and the singing keys provided by the JWKS endpoint.
  secret: process.env.CUSTOMCONNSTR_AUTH0_CLIENT_SECRET,
  // Validate the audience and the issuer.
  audience: process.env.CUSTOMCONNSTR_AUTH0_CLIENT_ID,
  issuer: `https://${process.env.CUSTOMCONNSTR_AUTH0_DOMAIN}/`,
  algorithms: ['HS256']
});

//app.use(express.static('web'));

app.get('/api/project', authenticate, function (req, res) {
  console.log(req.user);

  var Connection = require('tedious').Connection;
  var connection = new Connection(config);

  connection.on('connect', function (err) {
    if (err) {
      console.error(err);
      return;
    }
    console.log('connected to the db');

    var Request = require('tedious').Request;
    var TYPES = require('tedious').TYPES;

    var result = { "projects": [] };

    //var queryString = "SELECT ProjectId, ProjectName, ModifiedDate FROM Project WHERE OwnerId = (SELECT UserId from UserInfo WHERE MicrosoftAccountId = @accountId)";
    var queryString = "SELECT ProjectId, ProjectName, ModifiedDate FROM Project";
    var request = new Request(queryString, function (err, rowCount, rows) {
      if (err) {
        console.log(err);
        return;
      }
      console.log(rowCount + ' rows returned');
      res.status(200).send(result);
    });
    //request.addParameter('accountId', TYPES.VarChar, req.get('X-MS-CLIENT-PRINCIPAL-ID'));
    request.on('row', function (columns) {
      var project = {
        "project_id": columns[0].value,
        "project_name": columns[1].value,
        "modified_date": columns[2].value
      };
      console.log('retreive: ', project);
      result['projects'].push(project);
    });

    connection.execSql(request);
  });
});

app.get('/api/project/:projectId', authenticate, function (req, res) {
  var Connection = require('tedious').Connection;
  var connection = new Connection(config);

  connection.on('connect', function (err) {
    console.log('connected to the db');

    var Request = require('tedious').Request;
    var TYPES = require('tedious').TYPES;

    var project;
    //var queryString = "SELECT ProjectId, ProjectName, ProjectData, ModifiedDate FROM Project WHERE ProjectId = @projectId AND OwnerId = (SELECT UserId from UserInfo WHERE MicrosoftAccountId = @accountId)";
    var queryString = "SELECT ProjectId, ProjectName, ProjectData, ModifiedDate FROM Project WHERE ProjectId = @projectId";
    var request = new Request(queryString, function (err, rowCount, rows) {
      if (err) {
        console.log(err);
      }
      console.log('done');
      if (rowCount !== 0) {
        res.status(200).send(project);
      } else {
        res.status(404).send('Project not found!!!');
      }
    });
    request.addParameter('projectId', TYPES.VarChar, req.params.projectId);
    //request.addParameter('accountId', TYPES.VarChar, req.get('X-MS-CLIENT-PRINCIPAL-ID'));
    request.on('row', function (columns) {
      project = {
        "project_id": columns[0].value,
        "project_name": columns[1].value,
        "project_data": columns[2].value,
        "modified_date": columns[3].value
      };
      console.log('retreive: ', project);
    });
    connection.execSql(request);
  });
});

app.post('/api/project', authenticate, function (req, res) {
  const uuidV4 = require('uuid/v4');
  var Connection = require('tedious').Connection;
  var connection = new Connection(config);

  connection.on('connect', function (err) {
    console.log('connected to the db');

    var Request = require('tedious').Request;
    var TYPES = require('tedious').TYPES;

    //var queryString = "INSERT INTO Project(ProjectId, OwnerId, ProjectName, ProjectData, ModifiedDate) VALUES (@projectId, (SELECT UserId FROM UserInfo WHERE MicrosoftAccountId = @accountId), @projectName, @projectData, GETDATE())";
    var queryString = "INSERT INTO Project(ProjectId, OwnerId, ProjectName, ProjectData, ModifiedDate) VALUES (@projectId, 1, @projectName, @projectData, GETDATE())";
    var request = new Request(queryString, function (err, rowCount, rows) {
      if (err) {
        console.log(err);
      }
      console.log('Successfully add to DB');
      res.send(req.body);
    });

    req.body.project_id = uuidV4();

    request.addParameter('projectId', TYPES.VarChar, req.body.project_id);
    //request.addParameter('accountId', TYPES.VarChar, req.get('X-MS-CLIENT-PRINCIPAL-ID'));
    request.addParameter('projectName', TYPES.NVarChar, req.body.project_name);
    request.addParameter('projectData', TYPES.NVarChar, req.body);

    connection.execSql(request);
  });
});

app.put('/api/project', authenticate, function (req, res) {
  console.log('put endpoint');

  var Connection = require('tedious').Connection;
  var connection = new Connection(config);

  connection.on('connect', function (err) {
    console.log('connected to the db');

    var Request = require('tedious').Request;
    var TYPES = require('tedious').TYPES;

    //var queryString = "DELETE FROM Project WHERE ProjectId=@projectId; INSERT INTO Project(ProjectId, OwnerId, ProjectName, ProjectData, ModifiedDate) VALUES (@projectId, (SELECT UserId FROM UserInfo WHERE MicrosoftAccountId = @accountId), @projectName, @projectData, GETDATE())";
    var queryString = "DELETE FROM Project WHERE ProjectId=@projectId; INSERT INTO Project(ProjectId, OwnerId, ProjectName, ProjectData, ModifiedDate) VALUES (@projectId, 1, @projectName, @projectData, GETDATE())";
    var request = new Request(queryString, function (err, rowCount, rows) {
      if (err) {
        console.log(err);
      }
      console.log('Successfully add to DB');
      console.log(JSON.stringify(req.body));
      res.sendStatus(200);
    });

    request.addParameter('projectId', TYPES.VarChar, req.body.project_id);
    //request.addParameter('accountId', TYPES.VarChar, req.get('X-MS-CLIENT-PRINCIPAL-ID'));
    request.addParameter('projectName', TYPES.NVarChar, req.body.project_name);
    request.addParameter('projectData', TYPES.NVarChar, JSON.stringify(req.body));

    connection.execSql(request);
  });
});

app.post('/api/deviceselector', authenticate, function (req, res) {
  console.log('using device selector');
  console.log(req.body['project_data']);

  var device = require('./device');
  var response = device.getDeviceList(req.body['project_data']);

  console.log(JSON.stringify(response, null, 2));
  // var response = {
  //   devices: []
  // };

  // res.json(response);

  res.sendStatus(200);
});

app.post('/api/codegen', authenticate, function (req, res) {
  console.log('using codegen');
  console.log(req.body['project_data']);

  //var generator = require('./generator');
  //var response = generator.generateCode(req.body['project_data']);
  //console.log(response);

  //var device = require('./device');
  //device.getDeviceList(req.body['project_data']);

  var diagram = require('./diagram');

  const data = {
    platform: 'arduino',
    mcu: 'MCU_1',
    variant: 'Arduino UNO',
    connection: [
      {
        name: 'Audio',
        type: 'DEV_1',
        pin: '3'
      },
      {
        name: 'Mic',
        type: 'DEV_2',
        pin: 'A0'
      },
      {
        name: 'Temp1',
        type: 'DEV_3',
        pin: 'I2C'
      },
      {
        name: 'Temp2',
        type: 'DEV_4',
        pin: 'I2C'
      }
    ]
  };

  var response = {
    devices: [],
    diagram: JSON.stringify(diagram.getConnectionDiagram(data)),
    sourcecode: "We will launch the new code generator soon!!!!"
  };

  res.json(response);
});

app.listen(port);
console.log('Listening on port' + port);