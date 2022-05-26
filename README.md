# Marvel-API-Client
node/express application which uses the Marvel API

Copy the following into myKeys.js, using you marvel API keys. to fill the empty strings.
-------------
const publicKey = '';
const privateKey = '';
const {getHashFunction} = require('./hash');

const hash = getHashFunction(privateKey);

module.exports = {publicKey, hash};
---------------

Run the application with the following command:
node app.js

It'll run on port 3000.
