// initial api request
let elClicked = null;
//let characterAPI = null;
$(document).ready(function () 
{
console.log('initializing ...');
	let characterAPI = getCharacterAPI();
	$('#gcb').click(()=>characterAPI.getCharacters(0, characterAPI.showCharacters));
	$('#chName').keypress(function(e){console.log(e);if(e.key === "Enter")characterAPI.getCharacters(0, characterAPI.showCharacters);});
});

// https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
function escapeHtml(unsafe)
{
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

const getCharacterAPI = function()
{
	const searchMode = function()
	{
		$('#chName').val('');
		$('.search_group').css('display','block');
		$('.wait_group').css('display', 'none');
		$('#rc-progress').css('width', '0%');
		$('#rc-progress').attr('aria-valuenow', 0);
		$('#rc-progress').attr('aria-hidden', true);
		$('#rc-progress').html('');
	};

	const waitMode = function()
	{
		$('.search_group').css('display','none');
		$('.wait_group').css('display', 'block');
		$('#rc-progress').attr('aria-hidden', false);
		$('#comics-list').off('change');
		$('#character-summary > *').css('visibility','hidden');	
	};

	const getCharacters = function(off, cb=null)
	{
		console.log('The mighty whatever has been summoned ...');

		/* The callback starts the next request and calls the configurable display function. */
		const getCallback = function(display)
		{
			return function(result){
				let response = JSON.parse(result);
				if(response.status === "Ok")
				{
					let total = response.data.total, cRead = response.data.offset + response.data.count;
					if(cRead < total)
						getCharacters(cRead, display);
				}
				display(response);
			}
		};

		/* Prepare request. */
		let request = 
		{
			url: 'http://localhost:3000/characters',
			dataType: "text",
			success: getCallback(cb || function (result) {console.log('success'); console.log(result);})
		};
		let fields = [];
		if(off !== 0)
			fields.push(`offset=${escapeHtml(off+'')}`);
		let searchText = $("input[name='chName']").val();
		if(searchText !== '')
			fields.push(`nameStartsWith=${escapeHtml(searchText)}`);
		if(fields.length > 0)
			request.url += '?'+fields.join('&');
		$.ajax(request).done((result)=>{console.log('done');});

		/* Turn on the waiting UI. */
		if(off === 0 && cb)
			waitMode();
	};


	let characterSummaries = []; 

	/* Click handler for selecting a listed character. */
	const characterClick = function(e) 
	{
console.log('characterClick');
elClicked = $(this);
		e.preventDefault();	// no  bubbles allowed.
console.log(e); 
console.log($(this)); 
//console.log($(this).text());
//console.log($(this).html());
//let index = $(this).attr('character-index')-'0';
		let index = $(this).val()-'0';
console.log('index:', index);
console.log('summary:',characterSummaries[index]);

		showCharacterSummary(index);
	};

	const showCharacterSummary = function(index)
	{
		if(index >= characterSummaries.length)
			return;
		$('#character-summary > *').css('visibility','visible');
		$('#character-thumbnail').attr('src', characterSummaries[index].thumb);
		$('#character-name').html(characterSummaries[index].name);
		$('#character-detail').attr('href', characterSummaries[index].detail);
		$('#character-wiki').attr('href', characterSummaries[index].wiki);
	};

	const showCharacters = function(response)
	{
		/* Show something obnoxious on a fail. */
		if(response.status !== "Ok")
		{
  			$('#api_results').html('pfffftt');
			setTimeout(searchMode, 500);
			return;
		}

		let characters = [];
		let cpr = response.copyright, results = response.data.results, attr = response.attributionHTML;
		let total = response.data.total, cRead = response.data.offset + response.data.count;

		/* Update progress UI. */
		let progress = Math.floor(100*cRead/total);
		$('#rc-progress').css('width', progress+'%');
		$('#rc-progress').attr('aria-valuenow', progress);
		$('#rc-progress').html(progress+'%');

		/* Add characters from response to character list HTML. */
		let api_results = $('#api_results');
		if(response.data.offset === 0)
		{
			api_results.html("<div class="+attr+"<br />");

			/* Build an unordered list in api_result. */
//			api_results.append($("<ul id='comics-list'></ul>"));
			api_results.append($("<select class='form-select' aria-label='Matching Characters' id='comics-list' name='comics-list'></select>"));
//console.log($('#comics-list').children());
			$('#comics-list').change(characterClick);
			characterSummaries = [];
		}
		let ind = response.data.offset;
		for(let result of results)
		{
//			characters.push(`<li class='character-item' character-index='${ind++}'>${result.name}</li>`);
			characters.push(`<option class='character-item' value='${ind++}'>${result.name}</option>`);
			let summary = 
			{
				name:result.name, 
				thumb:result.thumbnail.path+'/standard_fantastic.'+result.thumbnail.extension,
				resourceURI: result.resourceURI,
			};
			if(result.thumbnail.path.substr(result.thumbnail.path.length-19) === 'image_not_available')
				summary.thumb = result.thumbnail.path+'/standard_large.'+result.thumbnail.extension; 
			for(let url of result.urls)
			{
				switch(url.type)
				{
					case 'detail': summary.detail = url.url; break;
					case 'wiki': summary.wiki = url.url; break;
					case 'comicLink': summary.comicLink = url.url; break;
				}
			}
			characterSummaries.push({...summary});
		}
		$('#comics-list').append(`${characters.join('\n')}`);

		/* Switch back to ready UI when done. */
		if(cRead >= total)
		{
			showCharacterSummary(0);
			setTimeout(searchMode, 1000);
		}
	};

	return {getCharacters, showCharacters, characterClick};
}; 
