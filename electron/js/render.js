
'use stict';


const { ipcRenderer } = require('electron');
const ipcr = ipcRenderer;

var username;
var userAddress;
var currentRating		= "";















// ==============================
// =====  EVENTS FROM MAIN  =====

// Event handler for incoming addresses
ipcr.on('addresses', (event, arg) => {
	jsonP = JSON.parse(arg);
	var idx = 0;
	jsonP.forEach(el => {
		var tmpid = "dropel" + idx;
		$("#dropdownElements").append('<li class="item" id="' + tmpid + '" data-val="' + tmpid + '">' + el + '</li>');
		idx++;
	});

	showCustomerView ();
})




// Event handler for balance information
ipcr.on('newBalance', (event, arg) => {
	jsonP = JSON.parse(arg);
	$('#balanceContainer').html(jsonP['balance'] + " (ether)");
})




// Event handler for incoming user information
ipcr.on ('user-info', (evt, arg) => {
	jsonP = JSON.parse(arg);
	console.log(jsonP);

	if (jsonP['result'] == 'error') {
		var cause	= '';
		if (jsonP.cause != undefined)
			cause	= jsonP.cause;
		error ('Problem fetching user information: ' + cause);
	}
	else {
		$('#balanceContainer').html(jsonP['balance'] + " (ether)");
		if (jsonP['isPremium'] == true)
			$('#premium').removeClass('inactive');
		else
			$('#premium').addClass('inactive');

		if (jsonP.contentsList != undefined) {

				jsonP.contentsList.forEach ((el) => {
				htmlText	= newContentItem (el.address, Number(el.type), el.title);
				$('#published-contents-list').append(htmlText);
			});
		}
	}
})




// Event handler for incoming initial user information
ipcr.on('init-info', (event, arg) => {
	jsonP = JSON.parse(arg);

	if (jsonP['result'] == 'error') {
		var cause	= '';
		if (jsonP.cause != undefined)
			cause	= jsonP.cause;
		error ('Problem fetching user information: ' + cause);

		showModal ('loginModal');
	}
	else {
		$('#usernameContainer').html(username);
		$('#balanceContainer').html(jsonP['balance'] + " (ether)");
		if (jsonP['isPremium'] == true)
			$('#premium').removeClass('inactive');
		else
			$('#premium').addClass('inactive');

		
		jsonP.contentsList.forEach ((el) => {
			htmlText	= newContentItem (el.address, Number(el.type), el.title);
			$('#published-contents-list').append(htmlText);
		});


		$('#childContainer').removeClass('inactive');
		hideLoader('loaderDiv');
	}
})




// Event handler for a content creation reply
ipcr.on('create-content-reply', ((evt, arg) => {

	if (arg.result == 'success') {
		htmlText = newContentItem (arg.address, arg.type, arg.title);
		$('#published-contents-list').append (htmlText);
	}
	else {
		if (arg.cause != undefined && arg.cause != '')
			error ('Error on publish content: ' + arg.cause);
		else
			error ('Error on publish content');
	}

	hideLoader('create-content-dimmer');
}));




// Event handler for consumable content list reply
ipcr.on ('contents-list-reply', ((evt, arg) => {
	i	= 0;
	$('#last-sync').text (arg.time);
	$('#available-contents-list').empty ();
	arg.list.forEach ((el) => {
		$('#available-contents-list').prepend (newAvailableContent (el, i));
		$('#more-info-'+i).click ((evt) => {getMoreInfo ($('#'+evt.target.id).prev())});
		i++;
	})
	hideLoader ('refresh-contents-dimmer');
}));




// Event handler for more information about specific content reply
ipcr.on ('more-info-reply', ((evt, arg) => {
	$('#info-title').text (arg.title);
	$('#info-author').text (arg.author);
	$('#info-price').text (arg.price + ' (milliether)');
	$('#info-rating').text (arg.rating);
	$('#info-type').text (type2TypeString (arg.type));


	hideLoader ('loaderDiv');
	$('#more-info-modal').modal('show');
}))




// Event handler for buyed content reply
ipcr.on ('buy-content-reply', (evt, arg) => {
	// Disabling previous content's buyed button
	$('#button-' + arg.hexTitle).addClass ('disabled');
	$('#button-' + arg.hexTitle).attr("id","newId");


	// If an error occurs, it is notified to user. Otherwise the content is inserted in the consumable contents list
	if (arg.result == 'error') {
		if (arg.cause != undefined && arg.cause != '')
			error ('Error buying content: ' + arg.cause);
		else
			error ('Error buying content. Have you enough money and is title correct?');
	}
	else {
		$('#consumable-contents-list').append (newBuyedItem (arg.title, arg.hexTitle));

		$('#button-'+arg.hexTitle).click ((ev) => {
			console.log ('Clicked for consume');
			var title	= ev.target.id.substring (7);
			ipcr.send ('consume-content-request', {'title':title});
			showLoader ('consume-rate-content-dimmer');
		});
	}

	hideLoader ('buy-gift-content-dimmer');
})




/* Event handler for a consume content reply. The green button related to consumable content is modified into
	a rating button, but it is not activated. It is activated when feedback activation event is received
*/
ipcr.on ('consume-content-reply', (evt, arg) => {
	if (arg.result == 'error') {
		if (arg.cause != undefined && arg.cause != '')
			error ('Error consuming content: ' + arg.cause);
		else
			error ('Error consuming content');
	}
	else {
	
		$('#button-' + arg.title).text	('Rate me');
		$('#button-' + arg.title).addClass ('disabled');
		$('#button-' + arg.title).off	('click');

		
		$('#button-' + arg.title).click	((ev) => {
			showModal ('rating-modal');
			var title		= ev.target.id.substring (7);
			currentRating	= title;
			// Cleaning values
			$('.ui.rating').rating();
		})
	}
	hideLoader ('consume-rate-content-dimmer');
})




// Event handler for a gift content reply. If an error occurs, it will be shown
ipcr.on ('gift-content-reply', (ev, arg) => {
	hideLoader ('buy-gift-content-dimmer');

	if (arg.result == 'success') {
		// Do nothing
	}
	else {
		if (arg.cause != undefined && arg.cause != '')
			error ('Error gifting content: ' + arg.cause);
		else
			error ('Error gifting content. Have you enough money or is username correct?');
	}
})




// Event handler for a buy content reply.
ipcr.on ('buy-premium-reply', (evt, arg) => {
	hideLoader ('buy-gift-premium-dimmer');

	if (arg.result == 'success') {
		console.log ("Premium user!");
		$('#premium').removeClass('inactive');
	}
	else {
		console.log ('NOT premium user');
		if (arg.cause != undefined && arg.cause != '')
			error ('Error buying premium: ' + arg.cause);
		else
			error ('Error buying premium. Have you enough money?');
	}
})




// Event handler for a gift content reply
ipcr.on ('gift-premium-reply', (evt, arg) => {
	hideLoader ('buy-gift-premium-dimmer');
	
	if (arg.result == 'failure') {
		if (arg.cause != undefined && arg.cause != '')
			error ('Error buying content: ' + arg.cause);
		else
			error ('Error buying content. Have you enough money of is username correct?');
	}
})










/* Following events handler are fired when a reply about some statistics is received.
	A modal window is shown with the received response 
*/


ipcr.on ('get-views-count-reply', (evt, arg) => {
	hideLoader ('loaderDiv');

	if (arg.result == 'success') {

		$('#query-reply-title').text ('Count of contents views');
		$('#query-reply-list').empty ();

		if (arg.data.length == 0) {
			$('#query-reply-list').append ("No content publihed");
		}

		else
			arg.data.forEach(el => {
				$('#query-reply-list').append (newQueryItem (el.title + ' : ' + el.count));
			});

		showModal ('query-reply-modal');
	}
	else {
		error ('Error executing operation');
	}
})




ipcr.on ('get-newest-content-list-reply', (evt, arg) => {
	hideLoader ('loaderDiv');

	if (arg.result == 'success') {

		$('#query-reply-title').text ('Newest published contents');
		$('#query-reply-list').empty ();

		if (arg.data.length == 0) {
			$('#query-reply-list').append ("No content publihed");
		}

		else
			arg.data.forEach(el => {
				console.log (el);
				$('#query-reply-list').append (newQueryItem (el));
			});

		showModal ('query-reply-modal');
	}
	else {
		error ('Error executing operation');
	}
})




ipcr.on ('get-latest-content-by-author-reply', (evt, arg) => {
	hideLoader ('loaderDiv');

	if (arg.result == 'success') {
		$('#query-reply-title').text ('Latest content');
		$('#query-reply-list').empty ();

		if (arg.data == undefined || arg.data == "" )
			$('#query-reply-list').append ("No content published");
		else
			$('#query-reply-list').append (newQueryItem (arg.data));

		showModal ('query-reply-modal');
	}
	else {
		error ("Error executing operation. Maybe user doesn't exists");
	}
});




ipcr.on ('get-latest-content-by-genre-reply', (evt, arg) => {
	hideLoader ('loaderDiv');

	if (arg.result == 'success') {
		$('#query-reply-title').text ('Latest content');
		$('#query-reply-list').empty ();

		if (arg.data == undefined || arg.data == "" )
			$('#query-reply-list').append ("No content published");
		else
			$('#query-reply-list').append (newQueryItem (arg.data));

		showModal ('query-reply-modal');
	}
	else {
		error ("Error executing operation");
	}
});




ipcr.on ('get-most-popular-content-by-author-reply', (evt, arg) => {
	hideLoader ('loaderDiv');

	if (arg.result == 'success') {
		$('#query-reply-title').text ('Most popular content');
		$('#query-reply-list').empty ();

		if (arg.data == undefined || arg.data == "" )
			$('#query-reply-list').append ("No content published");
		else
			$('#query-reply-list').append (newQueryItem (arg.data));

		showModal ('query-reply-modal');
	}
	else {
		error ("Error executing operation. Maybe user doesn't exists");
	}
});




ipcr.on ('get-most-popular-content-by-genre-reply', (evt, arg) => {
	hideLoader ('loaderDiv');

	if (arg.result == 'success') {
		$('#query-reply-title').text ('Most popular content');
		$('#query-reply-list').empty ();

		if (arg.data == undefined || arg.data == "" )
			$('#query-reply-list').append ("No content published");
		else
			$('#query-reply-list').append (newQueryItem (arg.data));

		showModal ('query-reply-modal');
	}
	else {
		error ("Error executing operation.");
	}
});




ipcr.on ('get-most-rated-content-reply', (evt, arg) => {
	hideLoader ('loaderDiv');

	if (arg.result == 'success') {
		$('#query-reply-title').text ('Most rated content');
		$('#query-reply-list').empty ();

		if (arg.data == undefined || arg.data == "" )
			$('#query-reply-list').append ("No content published");
		else
			$('#query-reply-list').append (newQueryItem (arg.data));

		showModal ('query-reply-modal');
	}
	else {
		error ("Error executing operation.");
	}
});




ipcr.on ('get-most-rated-content-by-genre-reply', (evt, arg) => {
	hideLoader ('loaderDiv');

	if (arg.result == 'success') {
		$('#query-reply-title').text ('Most rated content');
		$('#query-reply-list').empty ();

		if (arg.data == undefined || arg.data == "" )
			$('#query-reply-list').append ("No content published");
		else
			$('#query-reply-list').append (newQueryItem (arg.data));

		showModal ('query-reply-modal');
	}
	else {
		error ("Error executing operation.");
	}
});




ipcr.on ('get-most-rated-content-by-author-reply', (evt, arg) => {
	hideLoader ('loaderDiv');

	if (arg.result == 'success') {
		$('#query-reply-title').text ('Most rated content');
		$('#query-reply-list').empty ();

		if (arg.data == undefined || arg.data == "" )
			$('#query-reply-list').append ("No content published");
		else
			$('#query-reply-list').append (newQueryItem (arg.data));

		showModal ('query-reply-modal');
	}
	else {
		error ("Error executing operation. Maybe user doesn't exists");
	}
});




// Event handler fired when a new content is published. If publishing user differs from current user a notification is shown
ipcr.on ('content-published-event', (evt, arg) => {
	var id	= arg.hexTitle;
	$('#available-contents-list').append (newAvailableContent (arg.stringTitle, id));
	$('#more-info-'+id).click ((evt) => {getMoreInfo ($('#'+evt.target.id).prev())});
	console.log ();
	if (arg.author != username)
		newNotification ({name:'The author  "' +arg.author+ '" published  "'+arg.stringTitle+'"'});
});




// Event handler fired when an access to a content is granted
ipcr.on ('granted-access-event', (evt, arg) => {
	newNotification ({name:'You can access to content  "' + arg.title +'"'});
});




// Event handler fired when a premium account is activated
ipcr.on ('granted-premium-event', (evt, arg) => {
	newNotification ({name:'You obtained premium acces'});
});




// Event handler fired when another user gifts to current user a content
ipcr.on ('gifted-content-event', (evt, arg) => {
	$('#consumable-contents-list').append (newBuyedItem (arg.title, arg.hexTitle));
	
	$('#button-'+arg.hexTitle).click ((ev) => {
		var title	= ev.target.id.substring (7);
		ipcr.send ('consume-content-request', {'title':title});
		showLoader ('consume-rate-content-dimmer');
	});

	var notif	= {name:'User  "' + arg.sender + '"  gifted to you content  "'+ arg.title + '"'};
	newNotification (notif);
})




// Event handler fired when another user gifts to current user a premium account
ipcr.on ('gifted-premium-event', (evt, arg) => {
	newNotification ({name:'User "' + arg.sender +'" gifted you a premium account'});
});



//Event handler fired when a feedback activation event is received from catalog
ipcr.on ('feedback-activation-event', (evt, arg) => {
	$('#button-' + arg.hexTitle).removeClass ('disabled');
	showModal ('rating-question-modal');
	currentRating	= arg.hexTitle;
});




/* Event handler fired when the catalog contract is killed. A message is shown with the information and after two seconds and
	half, an event to close the application is fired
*/
ipcr.on ('catalog-died-event', (evt, arg) => {
	error ('Catalo contract is died! Application will be closed', 3000);

	
	setTimeout(() => {
		ipcr.send ('quitDapp', {});
	},  2500);
})


















// ========================================
//					QUERIES
// ========================================

/* Following functions are registered as callback when buttons belonging to "Perform a query" list is clicked.
	A modal window is shown to collect user arguments (e.g. number of contents or type of contents) and
	when "Send" buton is clicked, an event to request informationsto catalog is sent to main electron process
*/

const getViewsCount = (evt) => {
	ipcr.send ('get-views-count-request', {});
	showLoader ('loaderDiv');
}




const prepareNewestContentList	= (evt) => {
	var count	= 0;
	$('#first-item').show ();
	$('#second-item').hide ();
	$('#genre-item').hide ();
	$('#category-item').hide ();
	
	$('#first-input').val('');

	$('#first-label').text ('Number of newest content');

	$('#prepare-query-send-buttton').off ();
	
	$('#prepare-query-send-buttton').click ((evt) => {
		count	= Number ($('#first-input').val ());

		if (count == NaN) {
			error ("Wrong input!");
		}
		else {
			showLoader ('loaderDiv');
			ipcr.send ('get-newest-content-list-request', {count:count});
		}
		
		hideModal ('prepare-query-modal');
	});
	
	showModal ('prepare-query-modal')
};




const prepareLatestContentByAuthor	= (evt) => {
	var author	= 0;
	$('#first-item').show ();
	$('#second-item').hide ();
	$('#genre-item').hide ();
	$('#category-item').hide ();

	$('#first-input').val('');

	$('#first-label').text ('Author');

	$('#prepare-query-send-buttton').off ();
	
	$('#prepare-query-send-buttton').click ((evt) => {
		author	= $('#first-input').val ();
		if (author != undefined && author != '') {
			showLoader ('loaderDiv');
			ipcr.send ('get-latest-content-by-author-request', {author:author});
		}
		
		hideModal ('prepare-query-modal');
	});
	
	showModal ('prepare-query-modal');
};




const prepareLatestContentByGenre	= (evt) => {
	var genre	= 0;

	$('#first-item').hide ();
	$('#second-item').hide ();
	$('#genre-item').show ();
	$('#category-item').hide ();

	$('#prepare-query-send-buttton').off ();

	$('#prepare-query-send-buttton').click ((evt) => {
		genre	= $('#genre-item').dropdown('get value');
		genre	= typeString2Type(genre+' content');
		
		if (genre != undefined) {
			showLoader ('loaderDiv');
			ipcr.send ('get-latest-content-by-genre-request', {genre:genre});
		}
		else {
			error ("Genre not defined");
		}

		hideModal ('prepare-query-modal');
		$('#genre-item').dropdown('restore defaults');
	});
	
	showModal ('prepare-query-modal');
};




const prepareMostPopularContentByAuthor	= (evt) => {
	var author	= 0;
	$('#first-item').show ();
	$('#second-item').hide ();
	$('#genre-item').hide ();
	$('#category-item').hide ();

	$('#first-input').val('');

	$('#first-label').text ('Author');
	
	$('#prepare-query-send-buttton').off ();
	
	$('#prepare-query-send-buttton').click ((evt) => {
		author	= $('#first-input').val ();
		if (author != undefined && author != '') {
			showLoader ('loaderDiv');
			ipcr.send ('get-most-popular-content-by-author-request', {author:author});
		}
		
		hideModal ('prepare-query-modal');
	});
	
	showModal ('prepare-query-modal');
}




const prepareMostPopularContentByGenre	= (evt) => {
	var genre	= 0;

	$('#first-item').hide ();
	$('#second-item').hide ();
	$('#genre-item').show ();
	$('#category-item').hide ();

	$('#prepare-query-send-buttton').off ();

	$('#prepare-query-send-buttton').click ((evt) => {
		genre	= $('#genre-item').dropdown('get value');
		genre	= typeString2Type(genre+' content');
		
		if (genre != undefined) {
			showLoader ('loaderDiv');
			ipcr.send ('get-most-popular-content-by-genre-request', {genre:genre});
		}
		else {
			error ("Genre not defined");
		}

		hideModal ('prepare-query-modal');
		$('#genre-item').dropdown('restore defaults');
	});
	
	showModal ('prepare-query-modal');
};




const prepareGetMostRatedContent	= (evt) => {
	var category	= 0;

	$('#first-item').hide ();
	$('#second-item').hide ();
	$('#genre-item').hide ();
	$('#category-item').show ();

	$('#prepare-query-send-buttton').off ();

	$('#prepare-query-send-buttton').click ((evt) => {
		category	= $('#category-item').dropdown('get value');
		category	= stringCategory2Int (category);
		
		showLoader ('loaderDiv');
		ipcr.send ('get-most-rated-content-request', {category:category});

		hideModal ('prepare-query-modal');
		$('#category-item').dropdown('restore defaults');
	});
	
	showModal ('prepare-query-modal');
};




const prepareGetMostRatedContentByGenre	= (evt, arg) => {
	var category	= 0;
	var genre		= 0;

	$('#first-item').hide ();
	$('#second-item').hide ();
	$('#genre-item').show ();
	$('#category-item').show ();

	$('#prepare-query-send-buttton').off ();

	$('#prepare-query-send-buttton').click ((evt) => {
		category	= $('#category-item').dropdown('get value');
		category	= stringCategory2Int (category);

		genre		= $('#genre-item').dropdown('get value');
		genre		= typeString2Type(genre+' content');
		
		if (genre != undefined) {
			showLoader ('loaderDiv');
			ipcr.send ('get-most-rated-content-by-genre-request', {category:category, genre:genre});
		}
		else {
			error ("Genre not defined");
		}

		hideModal ('prepare-query-modal');
		$('#category-item').dropdown('restore defaults');
	});
	
	showModal ('prepare-query-modal');
};




const prepareGetMostRatedContentByAuthor	= (evt, arg) => {
	var category	= 0;
	var author		= "";

	$('#first-item').show ();
	$('#second-item').hide ();
	$('#genre-item').hide ();
	$('#category-item').show ();

	$('#first-input').val('');

	$('#first-label').text ('Author');

	$('#prepare-query-send-buttton').off ();

	$('#prepare-query-send-buttton').click ((evt) => {
		category	= $('#category-item').dropdown('get value');
		category	= stringCategory2Int (category);

		author	= $('#first-input').val ();

		if (author != undefined && author != '') {
			showLoader ('loaderDiv');
			ipcr.send ('get-most-rated-content-by-author-request', {category:category, author:author});
		}
		else {
			error ("Author not defined");
		}

		hideModal ('prepare-query-modal');
		$('#category-item').dropdown('restore defaults');
	});
	
	showModal ('prepare-query-modal');
};



























// ===============================
// =====  HELPFUL FUNCTIONS  =====

// Helpful functions to interact with the user interface

const showLoader = (loaderId) => {
	$('#' + loaderId).addClass('active')
}




const hideLoader = (loaderId) => {
	$('#' + loaderId).removeClass('active')
}




const showModal	= (modalId) => {
	$('#'+modalId).modal('show');
}




const hideModal	= (modalId) => {
	$('#'+modalId).modal('hide');
}




const error	= (text, time) => {
	$('#error-text').text (text);
	showModal ('error-modal');

	if (time != undefined) {
		var t	= Number (time);
	}
	else {
		var t	= 4000;
	}
	setTimeout(() => {
		hideModal ('error-modal');
	}, t);
}




const newNotification	= (ni) => {
	const blinkAlert = () => {
		$('#notificationsIcon').removeClass('outline')
		$('#notificationsIcon').addClass('red')
		for (var i=1; i<7; i++) {
			setTimeout(() => {
				$('#notificationsIcon').toggleClass('outline');
				$('#notificationsIcon').toggleClass('red');
			}, 200*i);
		}
	}

	$('#noticationsMenu').prepend('<div class="item">' + ni.name + '</div>');
	blinkAlert ();
}




const showAuthorView = () => {
	$("#authorRoleBtn").addClass("active");
	$('#autorView').removeClass('inactive');

	$("#customerRoleBtn").removeClass('active');
	$('#customerView').addClass('inactive');
}




const showCustomerView	= () => {
	$("#authorRoleBtn").removeClass('active');
	$('#autorView').addClass('inactive')

	$("#customerRoleBtn").addClass('active');
	$('#customerView').removeClass('inactive');
}




const typeString2Type	= (typeStr) => {
	console.log('Incoming: ' + typeStr)
	if (typeStr == 'song content')
		return 0;
	if (typeStr == 'video content')
		return 1;
	if (typeStr == 'photo content')
		return 2;
	if (typeStr == 'document content')
		return 3;
}




const stringCategory2Int	= (typeStr) => {
	console.log ('incoming: ' + typeStr);

	if (typeStr == '')
		return 0;
	if (typeStr == 'content appreciation')
		return 1;
	if (typeStr == 'price fairness')
		return 2;
	if (typeStr == 'availability time')
		return 3;
}




const type2TypeString	= (intType) => {
	console.log ("type is -->     " + intType)
	switch (intType) {
		case 0:
			return "song";

		case 1:
			return "video";

		case 2: 
			return "photo";

		case 3:
			return "document";

		default :
			return "";
	}
}



const createContent	= (type, title, price) => {
	ipcr.send('create-content-request', { type: type, title: title, price: price });
	showLoader('create-content-dimmer')
}




const type2iconTag = (type) => {
	switch (type) {
		case 0:
			return '<i class="large music icon"></i>';
		case 1:
			return '<i class="large video icon"></i>';
		case 2:
			return '<i class="large material-icons">image</i>';
		case 3:
			return '<i class="large clipboard icon"></i>';
	}
}




const newContentItem = (itemAddr, type, title) => {
	typeIcon	= type2iconTag(type);

	toRet = "<div class='item'>" +
		typeIcon +
		"<div class='content'>" +
		"<div class='ui grid'>" +
		"<div class='ui fiveteen wide column'>" +
		"<div class='ui header'>" + title +
		"<div class='sub header'>" + itemAddr + "</div>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</div>";

	return toRet;
}




const newAvailableContent	= (title, idx) => {
	return '<div class="item">'																					+
				'<div class="ui middle aligned clearing content">'												+
					'<div class="ui left floated header">'+title+'</div>'										+
					'<button class="ui right floated orange button" id="more-info-'+idx+'">More info</button>'	+
				'</div>'																						+
			'</div>';
};




const getMoreInfo	= (arg) => {
	showLoader ('loaderDiv');

	$('#info-title').text (arg.title);
	$('#info-author').text (arg.author);
	$('#info-price').text (arg.price);
	$('#info-rating').text (arg.rating)

	ipcr.send ('more-info-request', {title: arg.text()})
}




const newBuyedItem	= (title, id) => {
	return  '<div class="item">'															+
				'<div class="ui middle aligned clearing content">'							+
					'<div class="ui left floated header">'									+
						title																+
					'</div>'																+
					'<button class="ui right floated green button" id="button-'+id+'">'	+
						'Consume me'														+
					'</button>'																+
				'</div>'																	+
			'</div>';
}




const newQueryItem	= (text) => {
	return	'<div class="ui item">'						+
				'<div class="middle aligned content">'	+
					'<p>' + text + '</p>'				+
				'</div>'								+
			'</div>';
}















// ==================================================
//					LOGIN VIEW
// ==================================================

// Callbacks related to login form in the user interface

$("#modal_closeButton").click((evt) => {
	ipcRenderer.send("quitDapp", {});
});




$('#modal_submitButton').click((evt) => {
	$('#modal_uiInput').removeClass('error')
	$('#modal_dropdown').removeClass('error')

	username	= $("#modal_usernameInput").val();
	userAddress	= $('#modal_dropdown')[0].outerText;

	if (username != undefined && username.length != 0 && username.indexOf(' ')<0 && userAddress != "Addresses..." && userAddress != "") {
		payload	= { 'user': username, 'addr': userAddress };
		$('#loginModal').modal('hide')
		showLoader('loaderDiv')
		ipcr.send('init-info', payload);
	}
	else {
		if (username == undefined || username.length == 0 || username.indexOf(' ')<0) {
			$('#modal_uiInput').addClass('error')
		}
		if (userAddress == "Addresses..." || userAddress == "" || userAddress == undefined) {
			$('#modal_dropdown').addClass('error')
		}
	}
})















// ==================================================
//					PAGE HEADER
// ==================================================

// Callbacks related to page header in the user interface

$("#authorRoleBtn").click ((evt) => {
	showAuthorView();
});



$("#customerRoleBtn").click ((evt) => {
	showCustomerView();
});




$('#query-reply-close-buttton').click ((evt) => {
	hideModal ('query-reply-modal');
});




$('#interests-button').click ((evt) => {
	showModal ('interests-modal');
})




$('#interests-apply-button').click ((evt) => {
	var authors	= $('#authors-input').val();
	var genres	= $('#genres-input').val();
	
	ipcr.send ('apply-filters', {authors:authors, genres:genres});

	hideModal ('interests-modal');
})




$('#interests-cancel-button').click ((evt) => {
	hideModal ('interests-modal');
})















// ==================================================
//					AUTHOR VIEW
// ==================================================

// Callbacks related to author view in the user interface


// ==================================
// ====  Create content segment  ====
$('#create-content-button').click((evt) => {
	var error = false;
	let type = $('#contentDropdown').dropdown('get value');
	let title = $('#contentTitleInput').val()
	let price = $('#contentPriceInput').val()

	let checkAndError = (val, id) => {
		if (val == undefined || val == '') {
			$('#' + id).addClass('error');
			return true;
		}
		$('#' + id).removeClass('error');
	}

	error = error || checkAndError(type, 'contentDropdown');
	error = error || checkAndError(title, 'conTitleInpContainer');
	error = error || checkAndError(price, 'priceInpContainer');

	if (error) {
		console.log('Error!')
		return;
	}

	$('#contentDropdown').dropdown('restore defaults');
	$('#contentTitleInput').val('')
	$('#contentPriceInput').val('')

	createContent(typeString2Type(type), title, price);


})















// ==================================================
//					CUSTOMER VIEW
// ==================================================

// Callbacks related to customer view in the user interface

$('#refresh-button').click ((evt) => {
	ipcr.send ('contents-list-request');
	showLoader('refresh-contents-dimmer');
});




$('#buy-content-button').click (evt => {
	var title	= $('#buy-gift-title').val();

	if (title == undefined || title == '') {
		$('#buy-gift-title-div').addClass ('error');
		return ;
	}

	$('#buy-gift-title-div').removeClass ('error');

	showLoader ('buy-gift-content-dimmer');
	ipcr.send ('buy-content-request', {title:title});
});




$('#gift-to-content-button').click (evt => {
	var title	= $('#buy-gift-title').val();
	var user	= $('#gift-to-user').val();

	if (title == undefined || title == '') {
		$('#buy-gift-title-div').addClass ('error');
		return ;
	}

	if (user == undefined || user == ''){
		$('#gift-to-div').addClass ('error');
		return ;
	}

	showLoader ('buy-gift-content-dimmer');
	ipcr.send ('gift-content-request', {title:title, user:user});
});




$('#yes-quest-button').click ((evt) => {
	hideModal ('rating-question-modal');
	showModal ('rating-modal');

	$('.ui.rating').rating();
})




$('#no-quest-button').click ((evt) => {
	hideModal ('rating-question-modal');
})




$('#rating-submit-button').click ((evt) => {
	var data	=	{
						'title' : currentRating,
						'1' : $('#rating-1').rating('get rating'),
						'2' : $('#rating-2').rating('get rating'),
						'3' : $('#rating-3').rating('get rating')
					}
	ipcr.send ('rating-request', data);

	hideModal('rating-modal');

	$('#button-'+data.title).addClass ('disabled');
})




$('#rating-cancel-button').click ((evt) => {
	hideModal ('rating-modal');
})




$('#buy-premium-button').click ((evt) => {
	showLoader ('buy-gift-premium-dimmer');

	ipcr.send ('buy-premium-request');
})




$('#gift-premium-button').click ((evt) => {
	var user	= $('#gift-premium-user').val();
	if (user == undefined || user == '') {
		$('#gift-premium-div').addClass ('error');
		return ;
	}

	showLoader ('buy-gift-premium-dimmer');
	ipcr.send ('gift-premium-request', {user:user});
})















// Ignoring escape key!
$("#body").keyup((evt) => {
});



/* Function triggered when the application window is ready to be shown.
	It sets up some Semantic ui lements.
*/
window.onload = () => {
	
	ipcr.setMaxListeners (50);

	$('#error-modal').modal	({closable:false});
	$('#loginModal').modal	({closable:false});
	showModal ('loginModal');
	$('.ui.dropdown').dropdown();

	// Adding listener to dropdown notfication about onHide and onShow events
	$('#notificationsDropdown').dropdown ('setting', 'onShow', () => {
		$('#notificationsIcon').addClass('outline');
		$('#notificationsIcon').removeClass('red');
	});

	$('#notificationsDropdown').dropdown ('setting', 'onHide', () => {
		$('#noticationsMenu').empty ();
		$('#notificationsIcon').removeClass('red');
		$('#notificationsIcon').addClass('outline');
	})

	$('#more-info-modal').modal('hide');

	ipcr.send('getAddresses', {});
}

