pragma solidity ^0.4.24;

import "./BaseContentManagementContract.sol";
import "./CatalogSmartContract.sol";        // FIXME Remove me!!!!!




contract SongManagementContract is BaseContentManagementContract {
    
    constructor (bytes32 _title, address _catAddr)
            BaseContentManagementContract(SharedTypes.contentType.song, _title, _catAddr) public {
    }
    
    function consumeContent (bytes32 _username) public {
        retrieveContent (_username);
    }
}




/* ********************************************* */
/* ********************************************* */
/* ********************************************* */




contract VideoManagementContract is BaseContentManagementContract {
    constructor (bytes32 _title, address _catAddr)
            BaseContentManagementContract(SharedTypes.contentType.video, _title, _catAddr) public {
    }
    
    function consumeContent (bytes32 _username) public {
        retrieveContent (_username);
    }
}




/* ********************************************* */
/* ********************************************* */
/* ********************************************* */




contract PhotoManagementContract is BaseContentManagementContract {
    constructor (bytes32 _title, address _catAddr)
            BaseContentManagementContract(SharedTypes.contentType.photo, _title, _catAddr) public {
    }
    
    function consumeContent (bytes32 _username) public {
        retrieveContent (_username);
    }
}




/* ********************************************* */
/* ********************************************* */
/* ********************************************* */




contract DocumentManagementContract is BaseContentManagementContract {
    constructor (bytes32 _title, address _catAddr)
            BaseContentManagementContract(SharedTypes.contentType.document, _title, _catAddr) public {
    }
    
    function consumeContent (bytes32 _username) public {
        retrieveContent (_username);
    }
}


