const {ipcRenderer} = require('electron')
const ipcr= ipcRenderer;

var username;
var address;
var ADDRESSES			= []
var notifications		= []


const ___TEST___	= true;




// ============================
// ===== ELECTRON EVENTS  =====

// Event handler for incoming addresses
ipcr.on ('addresses', (event, arg) => {
	jsonP= JSON.parse (arg);
	//console.log (jsonP);
	var idx=0;
	ADDRESSES= jsonP;
	jsonP.forEach (el => {
		var tmpid= "dropel" + idx;
		//console.log (tmpid + '\t\t' + el);
		$("#dropdownElements").append('<li class="item" id="'+ tmpid + '" data-val="' + tmpid + '">' + el + '</li>');
		console.log ($("#"+tmpid))
		idx++;
	});

	showCustomerView ();
})


// Event handler for balance information --> {'balance':..}
ipcr.on ('newBalance', (event, arg) => {
	jsonP= JSON.parse (arg);
	console.log (jsonP['balance'])
})


// Event handler for incoming user information
ipcr.on ('userInfo', (event, arg) => {
	jsonP= JSON.parse (arg);

	if (jsonP['status'] == 'error') {
		// TODO Handle this error
	}
	else {
		$('#childContainer').removeClass ('inactive')
		hideLoader ('loaderDiv');

		$('#usernameContainer').html (username);
		$('#balanceContainer').html (jsonP['balance'] + " (ether)");
		if (jsonP['isPremium'] == true)
			$('#premium').removeClass ('inactive');
		else
			$('#premium').addClass ('inactive');
	}
})




ipcr.on ('create-content-reply', ((evt, arg) => {
	// FIXME Handle errors!
	console.log (arg);

	if (arg.result == 'success') {
		htmlText	= newContentItem (arg.address, arg.type, arg.title);
		$('#published-contents-list').append (htmlText);
	}
	else {
		// FIXME Notify this
		console.log ('Error on publish content!');
	}

	hideLoader ('create-content-dimmer');
}));








// ==============================
// =====  HELPER FUNCTIONS  =====

const showLoader= (loaderId) => {
	$('#'+loaderId).addClass ('active')
}




const hideLoader= (loaderId) => {
	$('#'+loaderId).removeClass ('active')
}




const newNotification= (ni) => {
	notifications.push (ni)
	/*$('#notificationsNumber').html (notifications.length)
	$('#notificationsNumber').removeClass ('hidden')*/
	$('#notificationsIcon').removeClass ('outline')
	$('#notificationsIcon').addClass ('red')
	
	// Adding new element to html!
	$('#noticationsMenu').append('<div class="item">' + ni.name + '</div>');
}




const readNotification= (ith) => {
	// TODO Deelte element from html. If (notifications.length == 0) then remove 'notificationsNumber' element.
	// TODO remove class 'blue' from 'notificationsIcon' and insert 'outline'
}




const showAuthorView = () => {
	$("#authorRoleBtn").addClass ("active");
	$('#autorView').removeClass ('inactive');

	$("#customerRoleBtn").removeClass ('active');
	$('#customerView').addClass ('inactive');
}




const showCustomerView = () => {
	$("#authorRoleBtn").removeClass ('active');
	$('#autorView').addClass ('inactive')

	$("#customerRoleBtn").addClass ('active');
	$('#customerView').removeClass ('inactive');
}




const typeString2Type	= (typeStr) => {
	console.log ('Incoming: ' + typeStr)
	if (typeStr == 'song content')
		return 0;
	if (typeStr == 'video content')
		return 1;
	if (typeStr == 'photo content')
		return 2;
	if (typeStr == 'document content')
		return 3;
}



const createContent	= (type, title, price) => {
	ipcr.send ('create-content-request', {type: type, title:title, price:price});
	showLoader ('create-content-dimmer')
}




const type2iconTag	= (type) => {
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




const newContentItem	= (address, type, title) => {
	typeIcon	= type2iconTag (type);

	toRet	= 	"<div class='item'>";
	toRet	+= 		typeIcon;
	toRet	+=		"<div class='content'>";
	toRet	+=			"<div class='header'>"+ title +"</div>";
	toRet	+=			"<div class='description'>Address: "+ address +"</div>";
	toRet	+=		"</div></div>";

	console.log (toRet);

	return toRet;
}















// *************************
// *****  Login Modal  *****
$("#modal_closeButton").click ((evt) => {
	ipcRenderer.send("quitDapp", {});
});

$('#modal_submitButton').click ((evt) => {
	$('#modal_uiInput').removeClass('error')
	$('#modal_dropdown').removeClass('error')

	// Handle submit button click
	// TODO Check iput username
	username= $("#modal_usernameInput").val()
	address= $('#modal_dropdown')[0].outerText

	if (username != undefined && username.length != 0 && address != "Addresses..." && address != "") {
		payload= {'user': username, 'addr': address};
		$('#loginModal').modal ('hide')
		showLoader ('loaderDiv')
		ipcr.send ('userInfo', payload);
	}
	else {
		if (username == undefined || username.length == 0) {
			$('#modal_uiInput').addClass('error')
		}
		if (address == "Addresses..." || address == "" || address == undefined) {
			$('#modal_dropdown').addClass('error')
		}
	}
})



// ********************
// *****  Header  *****

/*$("#headerCloseButton").click ((evt) => {
	ipcRenderer.send('quitDapp', {});
})*/



$("#authorRoleBtn").click ((evt) => {
	showAuthorView ();
})



$("#customerRoleBtn").click ((evt) => {
	showCustomerView ();
})








// ==================================
// ====  Create content segment  ====
$('#create-content-button').click ((evt) => {
	var error	= false;
	let type	= $('#contentDropdown').dropdown('get value');
	let title	= $('#contentTitleInput').val ()
	let price	= $('#contentPriceInput').val ()

	let checkAndError	= (val, id) => {
		if (val == undefined || val == '') {
			$('#'+id).addClass ('error');
			return true;
		}
		$('#'+id).removeClass ('error');
	}

	console.log (type + '  ' + title + '  ' + price)

	error	= error || checkAndError (type, 'contentDropdown');
	error	= error || checkAndError (title, 'conTitleInpContainer');	// FIXME
	error	= error || checkAndError (price, 'priceInpContainer');		// FIXME

	if (error) {
		console.log ('Error!')
		return ;
	}

	$('#contentDropdown').dropdown('restore defaults');
	$('#contentTitleInput').val ('')
	$('#contentPriceInput').val ('')

	createContent (typeString2Type(type), title, price);


})




// Ignoring escape key!
$("#body").keyup ((evt) => {
});

// Getting addresses
window.onload = () => {
	ipcr.send('getAddresses', {})

	$('#loginModal').modal ('show')
	$('.ui.dropdown').dropdown();

	if (___TEST___) {

		// Timeout to automatically access with first address of array
		setTimeout(() => {
			console.log ('Helo user: ' + ___TEST___)
			address= ADDRESSES[9]
			username= 'luca'
			payload= {'user': username, 'addr': address};
			$('#loginModal').modal ('hide')
			showLoader ('loaderDiv')
			ipcr.send ('userInfo', payload);
		}, 100);

		// Timeout to create new notification
		setTimeout(() => {
			newNotification ({name: "testNotification"})
		}, 20000)
	}
}

