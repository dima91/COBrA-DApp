pragma solidity ^0.4.24;

import "./SharedTypes.sol";
import "./CatalogSmartContract.sol";


contract BaseContentManagementContract {

    // Enum that describe type of access which an user has
    enum AccessType {noneAccess, standardAccess, premiumAccess}
    
    // Struct that indentifies a user who was granted to consume current content
    struct GrantedUser {
        address userAddress;
        AccessType accessType;
        bool toBeConsumed;
        bool exists;
        bool[3] givenFeedbacks;        // Stores information about given feedback for each category
    }
    
    /* Variables to store feedbacks from users: each user has a unique position in each array. feedbacksSums stores sum of all given feedbacks
     * and feedbacksCount stores number of given feedbacks for each category (A user may or not rate a content for a category) */
    uint[3] feedbacksSums;      // contentAppreciation, priceFairness, availabilityTime
    uint8[3] feedbacksCount;    // Number of feedbacks given for each category

    address private catalogAddress;                     // Address of catalog to check if determined functions are called only by catalog
    SharedTypes.contentType private typeOfContent;      // Tpe of content which this contract contains
    
    bytes32 private contentTitle;                       // Title which identifies this contract in catalog
    uint private numberOfViews;                         // Number of viwes about content of this contract
    
    mapping (bytes32 => GrantedUser) allowedUsers;      // Map of users that are allowed to access this content

    
    
    constructor (SharedTypes.contentType _conType, bytes32 _conTitle, address _catalogAddr) public {
        typeOfContent   = _conType;
        numberOfViews   = 0;
        contentTitle    = _conTitle;
        catalogAddress  = _catalogAddr;
        
        feedbacksSums[0]    = 0;
        feedbacksSums[1]    = 0;
        feedbacksSums[2]    = 0;
        feedbacksCount[0]   = 0;
        feedbacksCount[1]   = 0;
        feedbacksCount[2]   = 0;
    }
    
    
    
    // *****           ***** //
    // ***** Modifiers ***** //
    
    modifier onlyCatalog () {
        require (msg.sender == catalogAddress);
        _;
    }
    
    modifier isAllowedUser (bytes32 _username, address _senderAddress) {
        bool exists= allowedUsers[_username].exists;
        bool correspondAddress= allowedUsers[_username].userAddress == _senderAddress;
        require (exists && correspondAddress);
        _;
    }
    
    modifier notToBeConsumedBy (bytes32 _username) {
        require (allowedUsers[_username].accessType == AccessType.noneAccess);
        _;
    }
    
    modifier toBeConsumedBy (bytes32 _username) {
        //require (allowedUsers[_username].toBeConsumed == true);
        require (allowedUsers[_username].accessType != AccessType.noneAccess);
        _;
    }
    
    modifier isCorrectRating (uint8 _val) {
        require ((_val <= 5) && (_val>0));
        _;
    }
    
    modifier isCorrectCategory (uint8 _category) {
        require ((_category<=3) && (_category>=1));
        _;
    }
    
    modifier notGivenFeedbackFor (uint8 _category, bytes32 _username) {
        require (allowedUsers[_username].givenFeedbacks[_category] == false);
        _;
    }
    
    
    
    // *****                                   ***** //
    // ***** Helper private/internal functions ***** //
    
    /* This function allows subContracts of this contract to retrieve content if and only if user
     * with addrs _userAddr is into "allowedUsers" map
     */
    function retrieveContent (bytes32 _username) internal isAllowedUser(_username, msg.sender) toBeConsumedBy (_username) {
        bool isStandard= allowedUsers[_username].accessType == AccessType.standardAccess;
        if (isStandard) {
            numberOfViews++;
            (CatalogSmartContract (catalogAddress)).notifyNewView (contentTitle, _username);
        }
    
        allowedUsers[_username].accessType      = AccessType.noneAccess;
        allowedUsers[_username].toBeConsumed    = false;
    }
    
    
    
    // *****                  ***** //
    // ***** Public functions ***** //
    
    // Function used by catalog to check that has the same address of catalogAddress local variable
    function getCatalogAddress () public view returns (address) {
        return catalogAddress;
    }
    
    function getViewsCount () public view returns (uint) {
        return numberOfViews;
    }
    
    function getTitle () public view returns (bytes32) {
        return contentTitle;
    }
    
    function getType () public view returns (SharedTypes.contentType) {
        return typeOfContent;
    }
    
    
    // This function allows (only to catalog) to grant access to a user with address _userAddr.
    function grantAccessToUser (bytes32 _username, address _userAddr, bool isPremium) public onlyCatalog () notToBeConsumedBy (_username) {
        if (allowedUsers[_username].exists == false) {
            allowedUsers[_username].exists              = true;
            allowedUsers[_username].userAddress         = _userAddr;
            allowedUsers[_username].givenFeedbacks[0]   = false;
            allowedUsers[_username].givenFeedbacks[1]   = false;
            allowedUsers[_username].givenFeedbacks[2]   = false;
        }
        
        if (isPremium)
            allowedUsers[_username].accessType= AccessType.premiumAccess;
        else
            allowedUsers[_username].accessType= AccessType.standardAccess;
        
        allowedUsers[_username].toBeConsumed = true;
    }
    
    
    // This function returns true if a user is allowed to view current content
    function isAllowed (bytes32 _username) public view returns (bool) {
        return allowedUsers[_username].accessType != AccessType.noneAccess;
    }
    
    
    
    // *****                    ***** //
    // ***** Feedback functions ***** //
    
    /* This function allows (only to allowed users) to leave a feedback of type 't' and value 'v' (1<=v<=5) for this content
     * _c:1 => first category,  _c:2 => second category,  _c:3 => third category */
    function leaveFeedback (bytes32 _username, uint8 _c, uint8 _v) public isAllowedUser(_username, msg.sender) isCorrectCategory(_c) isCorrectRating(_v) notGivenFeedbackFor(_c-1, _username) notToBeConsumedBy (_username) {
        uint8 c1= _c-1;
        
        feedbacksSums[c1]   += _v;
        feedbacksCount[c1]  +=1;
        allowedUsers[_username].givenFeedbacks[c1]= true;
    }
    
    
    
    function getFeedbacksAverages () public view returns (uint[3]) {
        uint[3] memory feeds;
        uint8 i=0;
        
        for (i=0; i<3; i++) {
            if (feedbacksCount[i] != 0)
                feeds[i] = feedbacksSums[i] / feedbacksCount[i];
            else 
                feeds[i] = 0;
        }
        
        return feeds;
    }
    
    
    function getFeedbacksCount () public view returns (uint[3]) {
        uint[3] memory feedsCount;
        uint i	= 0;
        
        for (i=0; i<3; i++) {
            feedsCount[i] = feedbacksCount[i];
        }
        
        return feedsCount;
    }
    
    
    
    // *****                     ***** //
    // ***** Abastract functions ***** //
    
    function consumeContent (bytes32 _username) public;
}




/* *************************************************************************************************************************************** */
/* *************************************************************************************************************************************** */
/* *************************************************************************************************************************************** */




