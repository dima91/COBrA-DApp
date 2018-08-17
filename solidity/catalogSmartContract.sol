pragma solidity ^0.4.24;

import "./sharedTypes.sol";
import "./ownable.sol";
import "./baseContentManagementContract.sol";


contract CatalogSmartContract is Ownable {
    
    // Event list
    event NewUser (bytes32 username, address userAddress);
    event ContentPublished (bytes32 username, bytes32 contentTitle, address contentAddress);
    event GrantedAccess (bytes32 username, address userAddress, bytes32 contentTitle, address contentAddress);
    event GrantedPremium (bytes32 username, address userAddress);
    event CatalogDied ();
    
    

    // Duration of premium account (in block height)
    uint constant PREMIUM_ACCOUNT_DURATION = 256; // ~240 blocks/hour
    
    // Cost of premium account
    uint constant PREMIUM_ACCOUNT_COST= 44000 szabo;    // ~ 20 €
    
    // Cost of each single content
    //uint constant CONTENT_COST= 6300 szabo;             // ~ 3 €
    
    // Payout for author for each content access (this value have to be minor than CONTENT_COST)
    uint constant PAYOUT_FOR_AUTHOR= 4200 szabo;        // ~ 2 €
    
    // Maximum number of views before sending payment
    uint constant MAX_VIEWS_LIMIT= 5;
    
    
    // Array of users which have are registered to service
    bytes32[] usersArray;
    // Number of users
    uint usersCount;
    // Mapping which contains a User struct for each user that hav published or have requeested a content
    mapping (bytes32 => SharedTypes.User) usersMapping;
    // Mapping which link address to user: needed for functions like getContent
    mapping (address => bytes32) addr2User;
    
    // Mapping which contains an ExtendedContent struct for each content published on the platform (identified by a string)
    mapping (bytes32 => SharedTypes.ExtendedContent) contentsMapping;
    // Array containing addresses of contents published on the system (for loop functions)
    bytes32[] contentsArray;
    // Number of contents (also index of next content in the array)
    uint contentsCount;
    
    
    constructor () public payable {
        contentsCount= 0;
        usersCount= 0;
    }
    
    
    
    // ************************************************************************************************************** //
    // ************************************************************************************************************** //
    // Modifiers
    
    // To check if the content "_contentTitle" is already published on catalog
    modifier alreadyPublishedM (bytes32 _contentTitle) {
        require (alreadyPublished(_contentTitle) == true);
        _;
    }
    
    // To check if the content "_contentTitle" is NOT already published on catalog
    modifier notPublished (bytes32 _contentTitle) {
        require (alreadyPublished(_contentTitle) == false);
        _;
    }
    
    // To check if no user with address "_address" was already registered
    modifier addressNotRegistered (address _address) {
        require (addr2User[_address] == "");      // Sembra funzionare
        _;
    }
    
    // To check if the user "_username" is NOT already registered on catalog
    modifier userDoesntExist (bytes32 _username) {
        require (userExists (_username) == false);
        _;
    }
    
    // To check if the user "_username" is already registered on catalog
    modifier userExistsM (bytes32 _username) {
        require (userExists(_username) == true);
        _;
    }
    
    // To check if the user "_username" has a premim account
    modifier isPremiumM (bytes32 _username) {
        require (isPremium(_username) == true);
        _;
    }
    
    // To check if "_msgValue" is equal to "_price"
    modifier equalTo (uint _msgValue, uint _price) {
        require (_msgValue == _price);
        _;
    }
    
    // To check if the user "_username" is already allowed to retreive content "_contentTitle". This function calls the "isAllowed" function on BaseContentManagementContract
    modifier userAllowed (bytes32 _username, bytes32 _contentTitle) {
        BaseContentManagementContract remoteContract= BaseContentManagementContract (contentsMapping[_contentTitle].contractAddress);
        require (remoteContract.isAllowed(_username) == true);
        _;
    }
    
    // To check corectness of category value.
    modifier isCorrectCategory (uint8 _category) {
        require ((_category<=3) && (_category>=1));
        _;
    }
    
    // To check corectness of category value. Admits also value 0 because is the value for "all categories"
    modifier isCorrectCategoryForGetRating (uint8 _category) {
        require ((_category<=3) && (_category>=0));
        _;
    }
    
    
    
    // ************************************************************************************************************** //
    // ************************************************************************************************************** //
    // Helper private functions
    
    // Function to check if a user exists or not in usersMapping
    function userExists (bytes32 _username) private view returns (bool){
		return (usersMapping[_username].exists == true);
    }

    // Function which returns wether a content is already published on the platform
    function alreadyPublished (bytes32 _conTitle) private view returns (bool) {
        return (contentsMapping[_conTitle].exists == true);
    }
    
    // Function to register a user to system ~ 125 k, ~95 k, ~95 k....
    function addUser (bytes32 _username, address _userAddr) userDoesntExist(_username) addressNotRegistered(_userAddr) userDoesntExist (_username) private {
        addr2User[_userAddr]= _username; // 20 k
        
        usersMapping[_username].userAddress= _userAddr;                         // 20 k
        usersMapping[_username].exists= true;                                   // 22 k
        
        // Following field have already correct values
        //usersMapping[_username].accType= SharedTypes.accountType.standard;
        //usersMapping[_username].expirationTime= 0;
        //usersMapping[_username].latestContent = 0x0;

        usersCount++;                                                           // 20 la prima volta, 5 poi
        usersArray.push (_username);                                            // 40 k
        
        emit NewUser (_username, _userAddr);                                    // 3 k
    }
    
    // Function to add new content with address 'contAddr' registered by user with address 'userAddr'
    function addContent (bytes32 _contentTitle, address _contentAddr, bytes32 _username, uint _price) notPublished(_contentTitle) private {
        contentsCount++;
        contentsArray.push (_contentTitle);
        
        contentsMapping[_contentTitle].exists           = true;
        contentsMapping[_contentTitle].author           = _username;
        contentsMapping[_contentTitle].contractAddress  = _contentAddr;
        contentsMapping[_contentTitle].contentPrice     = _price;
        
        usersMapping[_username].latestContent= _contentTitle;
    }
    
    // Return true if current premium account is valid
    function isPremiumValid (bytes32 _username, uint _currentBlockNumber) userExistsM(_username) private view returns (bool) {
        return (usersMapping[_username].expirationTime > _currentBlockNumber);
    }
    
    // Return the average value of feedbacks, given as parameter
    function feedbacksAverage (uint[3] feeds, uint[3] feedsCount) private pure returns (uint) {
        uint feedsSum=0;
        uint feedsCnt=0;
        uint i=0;
        
        for (i=0; i<3; i++) {
            if (feeds[i] != 0) {
                feedsSum += feeds[i];
                feedsCnt += feedsCount[i];
            }
        }
        
        if (feedsCnt != 0)
            return feedsSum / feedsCnt;
        else
            return 0;
    }
    
    // This function generalize getMostRated* operations
    function genericGetMostRated (bool _filterByAuthor, bytes32 _author, bool _filterByGenre, SharedTypes.contentType _type, uint8 _category)
                                private view isCorrectCategoryForGetRating(_category) returns (bytes32) {
        require (contentsCount > 0);
        
        uint i                  = 0;
        uint mostRatedIdx       = 0;
        uint mostRateValue      = 0;
        uint inspectedElements  = 0;
        
        for (i=0; i<contentsCount; i++) {
            BaseContentManagementContract _content  = BaseContentManagementContract (contentsMapping[contentsArray[i]].contractAddress);
            bytes32 currentAuthor                   = contentsMapping[contentsArray[i]].author;
            
            if (_filterByGenre && _content.getType() != _type)
                continue;
            if (_filterByAuthor && currentAuthor != _author)
                continue;
                
            uint[3] memory feeds        = (BaseContentManagementContract(contentsMapping[contentsArray[i]].contractAddress)).getFeedbacksAverages();
            uint[3] memory feedsCount   = (BaseContentManagementContract(contentsMapping[contentsArray[i]].contractAddress)).getFeedbacksCount();
            if (_category == 0) {
                // Calculating average and compare to temporary most rated
                // FIXME Add check on feedsCount > 0
                uint tmpRating  = feedbacksAverage (feeds, feedsCount);
                if (tmpRating > mostRateValue) {
                    mostRatedIdx    = i;
                    mostRateValue   = tmpRating;
                }
            }
            else {
                // FIXME Add check on feedsCount > 0
                if (feeds[_category-1] > mostRateValue) {
                    mostRatedIdx    = i;
                    mostRateValue   = feeds[_category-1];
                }
            }
            
            inspectedElements++;
        }
        
        // This instruction
        require (inspectedElements > 0);
        
        return contentsArray[mostRatedIdx];
    }
    
    
    
    // ************************************************************************************************************** //
    // ************************************************************************************************************** //
    // Public functions
    
    // Function which kills current contract. It is callable only from contract's owner
    // FIXME
    function killMe () public onlyOwner() {
        
        // First of all, it distrubutes payments amog authors
        uint i=0;
        uint sumViews= 0;
        for (i=0; i<usersCount; i++) {
            BaseContentManagementContract remoteContract= BaseContentManagementContract (usersMapping[usersArray[i]].userAddress);
            uint count= remoteContract.getViewsCount();
            
            if ((count % MAX_VIEWS_LIMIT) != 0) {
                address(remoteContract).transfer ((count % MAX_VIEWS_LIMIT) * PAYOUT_FOR_AUTHOR);
            }
            sumViews += count;
        }
        
        uint unit= address(this).balance / sumViews;
        
        // Second, equally distribute current balance to among authors
        for (i=0; i<usersCount; i++) {
            uint payment= unit * BaseContentManagementContract (usersMapping[usersArray[i]].userAddress).getViewsCount ();
            address (usersMapping[usersArray[i]].userAddress).transfer (payment);
        }
        
        emit CatalogDied ();
        
        selfdestruct (owner);
    }
    
    
    // Function that allows users to registrate themselves into service
    function registerMe (bytes32 _username) public userDoesntExist (_username) addressNotRegistered (msg.sender) {
        addUser (_username, msg.sender);
    }
    
    
    // Function to link a content with the system
    function publishContent (bytes32 _username, bytes32 _contentTitle, uint _price, address _contentAddr) notPublished (_contentTitle) public {
        if (!userExists(_username)) {
            // Registering new user
            addUser (_username, msg.sender);
        }
        
        // Checking wether content's catalogAddress and contentTitle are correct
        BaseContentManagementContract remoteContract= BaseContentManagementContract (_contentAddr);
        require (remoteContract.getCatalogAddress() == address (this));
        require (remoteContract.getTitle() == _contentTitle);
        
        addContent (_contentTitle, _contentAddr, _username, _price);
        
        emit ContentPublished (_username, _contentTitle, _contentAddr);
    }
    
    
    // Function to notify new view from another content manager
    // FIXME Update payment to author
    // FIXME Check correspondance between msg.sender and saved contentAddress
    function notifyNewView (bytes32 _contentTitle, bytes32 _username) alreadyPublishedM (_contentTitle) userExistsM (_username) userAllowed (_username, _contentTitle) public {
        bytes32 author= contentsMapping[_contentTitle].author;
        uint count= BaseContentManagementContract (msg.sender).getViewsCount ();
        //feedbacksAverage
        
        if ((count % MAX_VIEWS_LIMIT) == 0) {
            address rcvAddr= usersMapping[author].userAddress;
            rcvAddr.transfer (MAX_VIEWS_LIMIT * PAYOUT_FOR_AUTHOR);
        }
    }
    
    
    // Function to get a content's address
    function getAddressOf (bytes32 _contentTitle) alreadyPublishedM (_contentTitle) public view returns (address) {
        return contentsMapping[_contentTitle].contractAddress;
    }
    
    
    
    // ************************************************************************************************************** //
    // ************************************************************************************************************** //
    // Required functions
    
    // Returns the number of views for each content
    function getStatistics () public view returns (uint[], bytes32[]) {
        uint[] memory stats= new uint[] (contentsCount);
        bytes32[] memory strs= new bytes32[] (contentsCount);
        uint i= 0;
        bytes32 tmpCnt;
        
        for (i=0;i<contentsCount; i++) {
            tmpCnt= contentsArray[i];
            stats[i]= (BaseContentManagementContract (contentsMapping[tmpCnt].contractAddress)).getViewsCount();
            strs[i]= tmpCnt;
        }
        
        return (stats, strs);
    }
    
    
    // Returns the list of contents without the number of views
    function getContentList () public view returns (bytes32[]) {
        bytes32[] memory conList= new bytes32[] (contentsCount);
        uint i=0;
        
        for (i=0; i<contentsCount; i++) {
            conList[i]= contentsArray[i];
        }
        
        return conList;
    }
    
    
    // Returns the list of x newest contents
	function getNewContentList (uint _n) public view returns (bytes32[]) {
        uint count=0;
        uint i=0;
        uint j=0;
        
        if (_n>contentsCount)
            count=contentsCount;
        else
            count=_n;
            
        bytes32[] memory newest = new bytes32[] (count);
            
        while (count!=0) {
            j=i;
            i++;
            newest[j]= contentsArray[contentsCount-(i)];
            count--;
        }
        
        return newest;
    }
    
    
    
    // Returns the most recent content with genre x
    function getLatestByGenre (SharedTypes.contentType _ct) public view returns (bytes32) {
        uint i= contentsCount;
        bool found= false;
        bytes32 reqStr;
        
        if (contentsCount == 0) {
            return "";
        }
        
        while (i != 0 && !found ) {
            i--;
            if ((BaseContentManagementContract(contentsMapping[contentsArray[i]].contractAddress)).getType() == _ct) {
                found = true;
                reqStr= (BaseContentManagementContract(contentsMapping[contentsArray[i]].contractAddress)).getTitle();
            }
        }
        
        return reqStr;
    }
    
    
    
    // Returns the content with genre x, which has received the maximum number of views
    function getMostPopularByGenre (SharedTypes.contentType _ct) public view returns (bytes32) {
        bytes32 reqStr= "";
        uint maximum=0;
        uint i= contentsCount;
        
        if (contentsCount == 0) {
            return "";
        }
        
        while (i != 0) {
            i--;
            BaseContentManagementContract remoteContract= BaseContentManagementContract(contentsMapping[contentsArray[i]].contractAddress);
            if (remoteContract.getType() == _ct) {
                if (remoteContract.getViewsCount() > maximum)
                    reqStr= remoteContract.getTitle();
            }
        }
        
        return reqStr;
    }
    
    
    
    // Returns the most recent content of the author x
    function getLatestByAuthor (bytes32 _author) userExistsM (_author) public view returns (bytes32) {
        bytes32 reqStr;
        bool found= false;
        uint i= contentsCount;
        
        if (contentsCount == 0) {
            return "";
        }
        
        while (i != 0 && !found) {
            i--;
            bytes32 author= contentsMapping[contentsArray[i]].author;
            if (author == _author) {
                found = true;
                reqStr= (BaseContentManagementContract(contentsMapping[contentsArray[i]].contractAddress)).getTitle();
            }
        }
        
        return reqStr;
    }
    
    
    
    // FIXME Returns the content with most views of the author x
    function getMostPopularByAuthor (bytes32 _author) userExistsM (_author) public view returns (bytes32) {
        bytes32 reqStr= "";
        uint maximum=0;
        uint i= contentsCount;
        
        if (contentsCount == 0) {
            return "";
        }
        
        while (i != 0) {
            i--;
            BaseContentManagementContract remoteContract= BaseContentManagementContract(contentsMapping[contentsArray[i]].contractAddress);
            if (contentsMapping[contentsArray[i]].author == _author) {
                if (remoteContract.getViewsCount() > maximum)
                    reqStr= remoteContract.getTitle();
            }
        }
        
        return reqStr;
    }
    
    
    
    // Returns true if x holds a still valid premium account, false otherwise
    function isPremium (bytes32 _username)  userExistsM (_username) public view returns (bool) {
        return (usersMapping[_username].accType == SharedTypes.accountType.premium);
    }
    
    
    
    // Returns the content with highest rating for feedback category y (or highest average of all ratings if y is not specified)
    // TEST ME
    function getMostRated (uint8 _category) public view isCorrectCategoryForGetRating(_category) returns (bytes32) {
        return genericGetMostRated (false, 0, false, SharedTypes.contentType.song, _category);
    }
    
    
    
    /* Returns the content with highest rating for feedback gategory _category
     * (or highest average of all ratings if _category is not specified) with genre _genre */
    function getMostRatedByGenre (SharedTypes.contentType _genre, uint8 _category) public view returns (bytes32) {
        return genericGetMostRated (false, 0, true, _genre, _category);
    }
    
    
    
    /* Returns the content with highest rating for feedback category _category
     * (or highest average of all ratings it _category is not specified) with author _author */
	function getMostRatedByAuthor (bytes32 _author, uint8 _category) public view returns (bytes32) {
         return genericGetMostRated (true, _author, false, SharedTypes.contentType.song, _category);
     }
    
    
    // ************************************************************************************************************** //
    // ************************************************************************************************************** //
    
    // Pays for access to content x (NOT ACCESS TO CONTENT!)
    function getContent (bytes32 _contentTitle) userExistsM(addr2User[msg.sender]) alreadyPublishedM (_contentTitle)
                                                equalTo (msg.value, contentsMapping[_contentTitle].contentPrice) public payable {
        // ******* --> Check preconditions (enough value..) + handle payments <-- *******
        bytes32 senderUser= addr2User[msg.sender];
        (BaseContentManagementContract (contentsMapping[_contentTitle].contractAddress)).grantAccessToUser (senderUser, msg.sender, false);
        emit GrantedAccess (senderUser, msg.sender, _contentTitle, contentsMapping[_contentTitle].contractAddress);
    }
    
    
    
    // Requests access to content x without paying, premium accounts only
    function getContentPremium (bytes32 _contentTitle) isPremiumM (addr2User[msg.sender]) alreadyPublishedM (_contentTitle) public {
        bytes32 senderUser= addr2User[msg.sender];
        if (!isPremiumValid (senderUser, block.number)) {
            usersMapping[senderUser].accType= SharedTypes.accountType.standard;
            usersMapping[senderUser].expirationTime= 0;
            revert ();
        }
        
        (BaseContentManagementContract (contentsMapping[_contentTitle].contractAddress)).grantAccessToUser (senderUser, msg.sender, true);
        emit GrantedAccess (senderUser, msg.sender, _contentTitle, contentsMapping[_contentTitle].contractAddress);
    }
    
    
    
    // Pays for granting access for content x to the user u
    function giftContent (bytes32 _contentTitle, bytes32 _receivingUser)
    userExistsM(_receivingUser) alreadyPublishedM (_contentTitle) equalTo (msg.value, contentsMapping[_contentTitle].contentPrice) public payable {
        // ******* --> Check preconditions (enough value..) + handle payments <-- *******
        (BaseContentManagementContract (contentsMapping[_contentTitle].contractAddress)).grantAccessToUser (_receivingUser, usersMapping[_receivingUser].userAddress, false);
        
        emit GrantedAccess (_receivingUser, usersMapping[_receivingUser].userAddress, _contentTitle, contentsMapping[_contentTitle].contractAddress);
    }
    
    
    
    // Pays for granting a Premium Account to the user u
    function giftPremium (bytes32 _receivingUser)  userExistsM(_receivingUser) equalTo (msg.value, PREMIUM_ACCOUNT_COST) public payable {
        // ******* --> check preconditions + handle payments <-- *******
        usersMapping[_receivingUser].accType= SharedTypes.accountType.premium;
        usersMapping[_receivingUser].expirationTime= block.number + PREMIUM_ACCOUNT_DURATION;
        
        emit GrantedPremium (_receivingUser,  usersMapping[_receivingUser].userAddress);
	}
    
    
    
    // Starts a new premium subscription
    function buyPremium () userExistsM(addr2User[msg.sender]) equalTo (msg.value, PREMIUM_ACCOUNT_COST) public payable {
        // ******* --> check preconditions + handle payments <-- *******
        bytes32 senderUser						= addr2User[msg.sender];
        usersMapping[senderUser].accType		= SharedTypes.accountType.premium;
        usersMapping[senderUser].expirationTime	= block.number + PREMIUM_ACCOUNT_DURATION;
        
        emit GrantedPremium (addr2User[msg.sender],  usersMapping[addr2User[msg.sender]].userAddress);
    }
}