var http = require('http');

const {publicKey, hash} = require('./myKeys');

const common = 'http://gateway.marvel.com/v1/public';
const host = 'http://gateway.marvel.com';
const characters_ep = `${common}/characters?apikey=${publicKey}`;

// httpsshrink-to-fit=no://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
function escapeHtml(unsafe)
{
	return unsafe
		 .replace(/&/g, "&amp;")
		 .replace(/</g, "&lt;")
		 .replace(/>/g, "&gt;")
		 .replace(/"/g, "&quot;")
		 .replace(/'/g, "&#039;");
};

const MAXBLOCK = 100;

// Thanks to https://stackoverflow.com/questions/38282950/concatenating-api-responses-in-the-correct-sequence-asynchronously
// also https://stackoverflow.com/questions/38533580/nodejs-how-to-promisify-http-request-reject-got-called-two-times
// -------
function getBlock(baseUrl,limit=MAXBLOCK)
{
	return new Promise(
		function(resolve, reject) 
		{
			let ts = Date.now(), hashVal = hash(publicKey, ts);
			let url =`${baseUrl}&ts=${ts}&hash=${hashVal}&limit=${limit}`;
			let options = 
			{
				host: host.substring(7),
				path: url.substring(host.length)
			};

			const callback = function(response)
			{
				let s = '';
				response.on('data', (chunk)=>{s += chunk;});
				response.on('end', ()=>{resolve(s);});
			};
			let apiReq = http.request(options,callback);
			apiReq.on('error', (err)=>{reject(err);});
			apiReq.end();
		});
}

function getAllBlocks()
{
	return getBlock(characters_ep).then(
		function(results) 
		{
//console.log(results.substring(0,200));
//			let data = JSON.parse(results.body);
			let data = JSON.parse(results);
//if(!data || !data.data || !data.data.total) 
console.log('data is:',data);
			let totalData = data.data.total;
			let limit = data.data.limit;
			let promises = [];
			let responseData =
			{
				code: data.code, 
				status: data.status, 
				copyright: data.copyright, 
				attributionText: data.attributionText, 
				attributionHTML: data.attributionHTML, 
				etag: data.etag,
				data:
				{
					results:[...data.data.results]
				}
			};

			for(let i = limit; i < totalData; i += limit) 
			{
				let promise = getBlock(`${characters_ep}&offset=${i}`,limit);
				promises.push(promise.then(function(results) {return JSON.parse(results).data.results;}));
			}
			return Promise.all(promises).then(function(results) {
				for(let i=0; i<results.length; i++)
				{
console.log('promise.all:',results[i]?results[i].length:'null');
					for(let res of results[i])
						responseData.data.results.push({...res});
				}
console.log('total # of results:',responseData.data.results.length);
				return responseData;
			})
		});
}

/*
	Gets every character matching the search criteria by making repeated API
	calls, then concatenating all the results for the response.
*/
const getAllCharacters = function(req,res)
{
	getAllBlocks().then
	(
		function(data) {console.log('getAllBlocks:',data); res.send(data);}, 
		function(err) {console.log(err);res.status(400).send('-> '+err);}
	);
};	
// -------

/*
	Gets 1 API call's worth of characters.  The client is responsible for
	making follow-up API requests to fetch all the matching characters.
*/
const getCharacters = function(req,res)
{
//console.log(req.query);return;
	let ts = Date.now(), hashVal = hash(publicKey, ts);
	let url =`${characters_ep}&ts=${ts}&hash=${hashVal}&limit=${MAXBLOCK}`;
	if(req.query.offset)
		url += `&offset=${req.query.offset}`;
	if(req.query.nameStartsWith)
		url += `&nameStartsWith=${req.query.nameStartsWith}`;
	let options = 
	{
		host:host.substring(7),
		path: url.substring(host.length)
	};
	const callback = function(response)
	{
		let s = '';
		response.on('data', (chunk)=>{s += chunk;});
		response.on('end', ()=>{res.setHeader("Content-Type","application/json");res.send(s);});
	};
	let apiReq = http.request(options,callback);
	apiReq.on('error', (err)=>{res.status(400).send('-> '+err)});
	apiReq.end();
};

module.exports = {getCharacters};
