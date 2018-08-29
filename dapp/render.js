
'use stict';


const { ipcRenderer } = require('electron')
const ipcr = ipcRenderer;

var username;
var userAddress;
var ADDRESSES		= [];
var notifications	= [];
var currentRating	= "";


const ___TEST___	= true;















// ============================
// ===== ELECTRON EVENTS  =====

// Event handler for incoming addresses
ipcr.on('addresses', (event, arg) => {
	jsonP = JSON.parse(arg);
	//console.log (jsonP);
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




// Event handler for balance information --> {'balance':..}
ipcr.on('newBalance', (event, arg) => {
	jsonP = JSON.parse(arg);
	$('#balanceContainer').html(jsonP['balance'] + " (ether)");
})




// Event handler for incoming user information
ipcr.on('init-info', (event, arg) => {
	jsonP = JSON.parse(arg);
	console.log(jsonP);

	if (jsonP['status'] == 'error') {
		// TODO Handle this error
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
				$('#delete-' + el.address).click(deleteItem);
			});


		$('#childContainer').removeClass('inactive')
		hideLoader('loaderDiv');

		// =========================  Test requests  =========================
		// ipcr.send ('create-content-request', {type:0, title:'a beautiful song', price:10000});
		//showModal ('rating-modal');
		//showModal ('rating-question-modal');
		//ipcr.send ('rating-request', { '0': 5, '1': 3, '2': 2, title: '44' });
	}
})




ipcr.on('create-content-reply', ((evt, arg) => {
	// FIXME Handle errors!
	console.log(arg);

	if (arg.result == 'success') {
		htmlText = newContentItem (arg.address, arg.type, arg.title);
		$('#published-contents-list').append (htmlText);
		$('#delete-' + arg.address).click (deleteItem);
	}
	else {
		// FIXME Notify this
		console.log('Error on publish content!');
	}

	hideLoader('create-content-dimmer');
}));




ipcr.on ('contents-list-reply', ((evt, arg) => {
	i	= 0;
	$('#last-sync').text (arg.time);
	$('#available-contents-list').empty ();
	arg.list.forEach ((el) => {
		$('#available-contents-list').append (newAvailableContent (el, i));
		$('#more-info-'+i).click ((evt) => {getMoreInfo ($('#'+evt.target.id).prev())});
		i++;
	})
	hideLoader ('refresh-contents-dimmer');
}));




ipcr.on ('more-info-reply', ((evt, arg) => {
	// TODO Insert values of content into modal div    -->  arg.text()  --> titolo in alfanumerico

	$('#info-title').text (arg.title);
	$('#info-author').text (arg.author);
	$('#info-price').text (arg.price + ' (milliether)');
	$('#info-rating').text (arg.rating)


	hideLoader ('loaderDiv');
	$('#more-info-modal').modal('show');
	console.log (arg);
}))




ipcr.on ('buy-content-reply', (evt, arg) => {
	if (arg.result == 'error') {
		// TODO Handle error
		return;
	}

	hideLoader ('buy-gift-content-dimmer');
	$('#consumable-contents-list').append (newBuyedItem (arg.title));
	
	$('#button-'+arg.title).click ((ev) => {
		console.log ('Clicked for consume');
		var title	= ev.target.id.substring (7);
		ipcr.send ('consume-content-request', {'title':title});
		showLoader ('consume-rate-content-dimmer');
	});
})




ipcr.on ('consume-content-reply', (evt, arg) => {
	if (arg.result == 'error') {
		// TODO Handle error
		return;
	}
	hideLoader ('consume-rate-content-dimmer');
	
	$('#button-' + arg.title).text	('Rate me');
	$('#button-' + arg.title).off	('click');
	
	$('#button-' + arg.title).click	((ev) => {
		console.log ('clicked for rate');
		showModal ('rating-modal');
		var title		= ev.target.id.substring (7);
		currentRating	= title;
		// Cleaning values
		$('.ui.rating').rating();
	})

	currentRating	= arg.title;

	showModal ('rating-question-modal');
})




ipcr.on ('gift-content-reply', (ev, arg) => {
	hideLoader ('buy-gift-content-dimmer');
	// TODO Check result!
})


















// ===============================
// =====  HELPFUL FUNCTIONS  =====

const showLoader = (loaderId) => {
	$('#' + loaderId).addClass('active')
}




const hideLoader = (loaderId) => {
	$('#' + loaderId).removeClass('active')
}




const showModal	= (modalId) => {		// TODO Use me!
	$('#'+modalId).modal('show');
}




const hideModal	= (modalId) => {		// TODO Use me!
	$('#'+modalId).modal('hide');
}




const newNotification = (ni) => {
	notifications.push(ni)
	/*$('#notificationsNumber').html (notifications.length)
	$('#notificationsNumber').removeClass ('hidden')*/
	$('#notificationsIcon').removeClass('outline')
	$('#notificationsIcon').addClass('red')

	// Adding new element to html!
	$('#noticationsMenu').append('<div class="item">' + ni.name + '</div>');
}




const readNotification = (ith) => {
	// TODO Deelte element from html. If (notifications.length == 0) then remove 'notificationsNumber' element.
	// TODO remove class 'blue' from 'notificationsIcon' and insert 'outline'
}




const showAuthorView = () => {
	$("#authorRoleBtn").addClass("active");
	$('#autorView').removeClass('inactive');

	$("#customerRoleBtn").removeClass('active');
	$('#customerView').addClass('inactive');
}




const showCustomerView = () => {
	$("#authorRoleBtn").removeClass('active');
	$('#autorView').addClass('inactive')

	$("#customerRoleBtn").addClass('active');
	$('#customerView').removeClass('inactive');
}




const typeString2Type = (typeStr) => {
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



const createContent = (type, title, price) => {
	ipcr.send('create-content-request', { type: type, title: title, price: price });
	showLoader('create-content-dimmer')
}




const deleteItem = (evt) => {
	console.log(evt)
	// TODO Remove me from UI and send deletion to blockchain!
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
	showLoader('loaderDiv');

	$('#info-title').text (arg.title);
	$('#info-author').text (arg.author);
	$('#info-price').text (arg.price);
	$('#info-rating').text (arg.rating)

	ipcr.send ('more-info-request', {title: arg.text()})
}




const newBuyedItem	= (title) => {
	return  '<div class="item">'															+
				'<div class="ui middle aligned clearing content">'							+
					'<div class="ui left floated header">'									+
						title																+
					'</div>'																+
					'<button class="ui right floated green button" id="button-'+title+'">'	+
						'Consume me'														+
					'</button>'																+
				'</div>'																	+
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

	// Handle submit button click
	// TODO Check iput username
	username = $("#modal_usernameInput").val()
	userAddress = $('#modal_dropdown')[0].outerText

	if (username != undefined && username.length != 0 && userAddress != "Addresses..." && userAddress != "") {
		payload = { 'user': username, 'addr': userAddress };
		$('#loginModal').modal('hide')
		showLoader('loaderDiv')
		ipcr.send('init-info', payload);
	}
	else {
		if (username == undefined || username.length == 0) {
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



$("#authorRoleBtn").click((evt) => {
	showAuthorView();
})



$("#customerRoleBtn").click((evt) => {
	showCustomerView();
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
	error = error || checkAndError(title, 'conTitleInpContainer');	// FIXME
	error = error || checkAndError(price, 'priceInpContainer');		// FIXME

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



























// Ignoring escape key!
$("#body").keyup((evt) => {
});

// Getting addresses
window.onload = () => {
	ipcr.send('getAddresses', {})

	$('#loginModal').modal('show')
	$('.ui.dropdown').dropdown();
	//$('.ui.rating').rating();

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
			newNotification({ name: "testNotification" })
		}, 10000);
	}
}

