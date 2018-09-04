
'use stict';


const { ipcRenderer } = require('electron');
const ipcr = ipcRenderer;

var username;
var userAddress;
var ADDRESSES			= [];
var currentRating		= "";


const ___TEST___	= true;















// ============================
// ===== ELECTRON EVENTS  =====

// Event handler for incoming addresses
ipcr.on('addresses', (event, arg) => {
	jsonP = JSON.parse(arg);
	var idx = 0;
	ADDRESSES = jsonP;
	jsonP.forEach(el => {
		var tmpid = "dropel" + idx;
		$("#dropdownElements").append('<li class="item" id="' + tmpid + '" data-val="' + tmpid + '">' + el + '</li>');
		console.log($("#" + tmpid))
		idx++;
	});

	showCustomerView ();
})




// Event handler for balance information
ipcr.on('newBalance', (event, arg) => {
	jsonP = JSON.parse(arg);
	$('#balanceContainer').html(jsonP['balance'] + " (ether)");
})




ipcr.on ('user-info', (evt, arg) => {
	jsonP = JSON.parse(arg);
	console.log(jsonP);

	console.log ('Received new user infos..');
	console.log (arg.balance);

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
				console.log ('Address: ' + el.address);
				htmlText	= newContentItem (el.address, Number(el.type), el.title);
				$('#published-contents-list').append(htmlText);
			});
		}
	}
})




// Event handler for incoming user information
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
			console.log ('Address: ' + el.address);
			htmlText	= newContentItem (el.address, Number(el.type), el.title);
			$('#published-contents-list').append(htmlText);
		});


		$('#childContainer').removeClass('inactive');
		hideLoader('loaderDiv');
	}
})




ipcr.on('create-content-reply', ((evt, arg) => {
	// FIXME Handle errors!
	console.log(arg);

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




ipcr.on ('more-info-reply', ((evt, arg) => {
	$('#info-title').text (arg.title);
	$('#info-author').text (arg.author);
	$('#info-price').text (arg.price + ' (milliether)');
	$('#info-rating').text (arg.rating);
	$('#info-type').text (type2TypeString (arg.type));


	hideLoader ('loaderDiv');
	$('#more-info-modal').modal('show');
	console.log (arg);
}))




ipcr.on ('buy-content-reply', (evt, arg) => {
	console.log ('Received reply');
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
			console.log ('clicked for rate');
			showModal ('rating-modal');
			var title		= ev.target.id.substring (7);
			currentRating	= title;
			// Cleaning values
			$('.ui.rating').rating();
		})
	}
	hideLoader ('consume-rate-content-dimmer');
})




ipcr.on ('gift-content-reply', (ev, arg) => {
	hideLoader ('buy-gift-content-dimmer');

	if (arg.result == 'success') {
		// Do nothing
	}
	else {
		console.log ("Error gifting a content to someone!\n" + arg.cause);
		if (arg.cause != undefined && arg.cause != '')
			error ('Error gifting content: ' + arg.cause);
		else
			error ('Error gifting content. Have you enough money?');
	}
})




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




ipcr.on ('gift-premium-reply', (evt, arg) => {
	hideLoader ('buy-gift-premium-dimmer');
	
	if (arg.result == 'failure') {
		if (arg.cause != undefined && arg.cause != '')
			error ('Error buying content: ' + arg.cause);
		else
			error ('Error buying content. Have you enough money?');
	}
})










ipcr.on ('get-views-count-reply', (evt, arg) => {
	//console.log (arg);
	hideLoader ('loaderDiv');

	if (arg.result == 'success') {

		$('#query-reply-title').text ('Count of contents views');
		$('#query-reply-list').empty ();

		arg.data.forEach(el => {
			//console.log (el);
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

		$('#query-reply-list').append (newQueryItem (arg.data));

		showModal ('query-reply-modal');
	}
	else {
		error ("Error executing operation. Maybe user doesn't exists");
	}
});










ipcr.on ('content-published-event', (evt, arg) => {
	// TODO Type of content is present
	var id	= arg.hexTitle;
	$('#available-contents-list').append (newAvailableContent (arg.stringTitle, id));
	$('#more-info-'+id).click ((evt) => {console.log ('getting more info'); getMoreInfo ($('#'+evt.target.id).prev())});
	console.log ();
	if (arg.author != username)
		newNotification ({name:'The author  "' +arg.author+ '" published  "'+arg.stringTitle+'"'});
});




ipcr.on ('granted-access-event', (evt, arg) => {
	newNotification ({name:'You can access to content  "' + arg.title +'"'});
});




ipcr.on ('granted-premium-event', (evt, arg) => {
	newNotification ({name:'You obtained premium acces'});
});




ipcr.on ('gifted-content-event', (evt, arg) => {
	$('#consumable-contents-list').append (newBuyedItem (arg.title, arg.hexTitle));
	
	$('#button-'+arg.hexTitle).click ((ev) => {
		console.log ('Clicked for consume');
		var title	= ev.target.id.substring (7);
		ipcr.send ('consume-content-request', {'title':title});
		showLoader ('consume-rate-content-dimmer');
		console.log ('Done');
	});

	var notif	= {name:'User  "' + arg.sender + '"  gifted to you content  "'+ arg.title + '"'};
	newNotification (notif);
})




ipcr.on ('gifted-premium-event', (evt, arg) => {
	newNotification ({name:'User "' + arg.sender +'" gifted you a premium account'});
});




ipcr.on ('feedback-activation-event', (evt, arg) => {
	console.log ("Received new feedback activation");
	console.log (arg);

	$('#button-' + arg.hexTitle).removeClass ('disabled');
	showModal ('rating-question-modal');
	currentRating	= arg.hexTitle;
});




ipcr.on ('catalog-died-event', (evt, arg) => {
	error ('Catalo contract is died! Application will be closed', 3000);

	
	setTimeout(() => {
		ipcr.send ('quitDapp', {});
	},  2500);
})


















// ========================================
//					QUERIES
// ========================================

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
		if (count != 0 && count != NaN ) {
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

		hideModal ('prepare-query-modal');
		$('#category-item').dropdown('restore defaults');
	});
	
	showModal ('prepare-query-modal');
};



























// ===============================
// =====  HELPFUL FUNCTIONS  =====

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

/*$("#headerCloseButton").click ((evt) => {
	ipcRenderer.send('quitDapp', {});
})*/



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

	console.log(type + '  ' + title + '  ' + price)

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

/* Kind of feedback
 * contentAppreciation  : how much the customer enjoyed the content
 * priceFairness        : how fair the requested price is considered compared to the content
 * availabilityTime     : how fair the availability of content is considered compating to the price
 */

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
	// gift-to-user
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

	// Cleaning values
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
	console.log ('sengin..');
	console.log (data);

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

	console.log ('Gifting premium')

	showLoader ('buy-gift-premium-dimmer');
	ipcr.send ('gift-premium-request', {user:user});
})















// Ignoring escape key!
$("#body").keyup((evt) => {
});

// Getting addresses
window.onload = () => {
	ipcr.send('getAddresses', {})

	$('#error-modal').modal	({closable:false});
	$('#loginModal').modal	({closable:false});
	showModal ('loginModal');
	$('.ui.dropdown').dropdown();
	//$('.ui.rating').rating();

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

	if (___TEST___) {

		// Timeout to automatically access with first address of array
		setTimeout(() => {
			console.log('Helo user: ' + ___TEST___)
			userAddress = ADDRESSES[9]
			username = 'luca'
			payload = { 'user': username, 'addr': userAddress };
			$('#loginModal').modal('hide')
			showLoader('loaderDiv')
			ipcr.send('init-info', payload);
		}, 100);

		
		// Timeout to create new notification
		setTimeout(() => {
			newNotification({ name: "notifica di test" });

			//error ('Errore di prova', 3000);

			// =========================  Test requests  =========================
			//ipcr.send ('create-content-request', {type:0, title:'a beautiful song', price:10000});
			//showModal ('rating-modal');
			//showModal ('rating-question-modal');
			//ipcr.send ('rating-request', { '0': 5, '1': 3, '2': 2, title: '44' });
			//ipcr.send ('get-views-count-request', {});
			//ipcr.send ('rating-request', {'1': 5, '2': 4, '3': 3, title: 'a1' });
			//ipcr.send ('apply-filters' , {authors:'andre, b', genres:'photo'});
			//ipcr.send ('buy-content-request', {title:'hello'})

		}, 5000);
	}
}

