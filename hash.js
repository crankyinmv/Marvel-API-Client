const crypto = require('crypto');

const getHashFunction = function(prKey)
{
	return function(publicKey, ts=null)
	{
		ts = ts || Date.now();
		let hash = crypto.createHash('md5').update(ts+prKey+publicKey).digest('hex')
		return hash; 
	};
};

module.exports = {getHashFunction};
