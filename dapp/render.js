const {ipcRenderer} = require('electron')
const ipcr= ipcRenderer;

var username;
var address;
var ADDRESSES		= []
var notifications	= []

const ___TEST___	= false;




// ==============================
// =====  HELPER FUNCTIONS  =====

const showLoader= () => {
	$('#loaderDiv').addClass ('active')
}

const hideLoader= () => {
	$('#loaderDiv').removeClass ('active')
}

const newNotification= (ni) => {
	notifications.push (ni)
	/*$('#notificationsNumber').html (notifications.length)
	$('#notificationsNumber').removeClass ('hidden')*/
	$('#notificationsIcon').removeClass ('outline')
	$('#notificationsIcon').addClass ('blue')
	
	// Adding new element to html!
	$('#noticationsMenu').append('<div class="item">' + ni.name + '</div>');
}

const readNotification= (ith) => {
	// TODO Deelte element from html. If (notifications.length == 0) then remove 'notificationsNumber' element.
	// TODO remove class 'blue' from 'notificationsIcon' and insert 'outline'
}




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

	showAuthorView ();
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
		hideLoader ()

		$('#usernameContainer').html (username);
		$('#balanceContainer').html (jsonP['balance'] + " (ether)");
		if (jsonP['isPremium'] == true)
			$('#premium').removeClass ('inactive');
		else
			$('#premium').addClass ('inactive');
	}
})








// ==============================
// =====  HELPER FUNCTIONS  =====

let showAuthorView = () => {
	$("#authorRoleBtn").addClass ("active");
	$('#autorView').removeClass ('inactive');

	$("#customerRoleBtn").removeClass ('active');
	$('#customerView').addClass ('inactive');
}


let showCustomerView = () => {
	$("#authorRoleBtn").removeClass ('active');
	$('#autorView').addClass ('inactive')

	$("#customerRoleBtn").addClass ('active');
	$('#customerView').removeClass ('inactive');
}










// Ignoring escape key!
$("#body").keyup ((evt) => {
});




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
		showLoader ()
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




// Getting addresses
window.onload = () => {
	ipcr.send('getAddresses', {})

	$('#loginModal').modal ('show')
	$('.ui.dropdown').dropdown();

	if (___TEST___) {

		// Timeout to automatically access with first address of array
		setTimeout(() => {
			console.log ('Helo user: ' + ___TEST___)
			address= ADDRESSES[0]
			username= 'luca'
			payload= {'user': username, 'addr': address};
			$('#loginModal').modal ('hide')
			showLoader ()
			ipcr.send ('userInfo', payload);
		}, 1000);

		// Timeout to create new notification
		setTimeout(() => {
			newNotification ({name: "testNotification"})
		}, 20000)
	}
}

