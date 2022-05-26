// Based on https://expressjs.com/en/starter/hello-world.html
const express = require('express')
const app = express()
const port = 3000
const fs = require('fs').promises;
const {getCharacters} = require('./apicalls');

app.use(express.static('public'));
app.use('/public', express.static('public'));


app.get('/', function (req, res) 
{
//	res.setHeader("Content-Type", "text/html");
//	res.sendFile('./public/index.html', {root:__dirname});
/*
	fs.readFile(__dirname+"/public/index.html")
        .then(contents => 
	{
            res.setHeader("Content-Type", "text/html");
            res.writeHead(200);
            res.end(contents);
        })
        .catch(err => 
	{
            res.writeHead(500);
            res.end(err);
            return;
        });
*/
});

app.get('/characters', (req, res) => {getCharacters(req,res);});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
