pragma solidity ^0.4.24;


// Library Containing types definitions
library SharedTypes {
    
    // Kind of content
    enum contentType {song, video, photo, document}
    
    // Kind of account
    enum accountType {standard, premium}
    
    /* Kind of feedback
     * contentAppreciation  : how much the customer enjoyed the content
     * priceFairness        : how fair the requested price is considered compared to the content
     * suitableForChildren  : how much the content is suitable for guys
     */
    enum feedbackType {contentAppreciation, priceFairness, suitableForChildren}
    
    // Type for registered users, both authors or customers. This struct is stored in the catalog
    // Username is the identifier of content
    struct User {
        address userAddress;                    // Address of user (key value is the name)
        bool exists;                            // To check if an user exists in the system
        accountType accType;                    // Type of current account (default standard)
        uint expirationTime;                    // Expiration time (calculated in block.size). Valid only for premium account
        bytes32 latestContent;                  // Title of latest content published by current user
		uint publishedContentsCount;			// Number of contents published by this user
		uint totalViews;						// Number of views reached by its contents (used at catalog destroy)
    }
    
    // Struct to hold reference of BaseContentManagementContracts with its author
    // Title of content (a bytes32) is the identifier of content
    struct ExtendedContent {
        uint contentPrice;                      // Price of conent, defined by the author
        bool exists;                            // To check if a content exists in the system
        address contractAddress;                // Contract's address associated to current content
        bytes32 author;                         // Name of owner of content

        // Others informations, about views and users which are granted to access to current content, are stored in BaseContentManagementContracts
    }
}