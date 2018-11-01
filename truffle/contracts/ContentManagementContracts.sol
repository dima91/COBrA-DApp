pragma solidity ^0.4.24;

import "./BaseContentManagementContract.sol";
import "./CatalogSmartContract.sol";




contract SongManagementContract is BaseContentManagementContract {
    
    constructor (bytes32 _title, address _catAddr)
		BaseContentManagementContract(SharedTypes.contentType.song, _title, _catAddr) public {
    }
    
    function getGenre () public view returns (bytes32) {
		return 'song';
    }
}




/* ********************************************* */
/* ********************************************* */
/* ********************************************* */




contract VideoManagementContract is BaseContentManagementContract {
    constructor (bytes32 _title, address _catAddr)
		BaseContentManagementContract(SharedTypes.contentType.video, _title, _catAddr) public {
    }
    
    function getGenre () public view returns (bytes32) {
		return 'video';
    }
}




/* ********************************************* */
/* ********************************************* */
/* ********************************************* */




contract PhotoManagementContract is BaseContentManagementContract {
    constructor (bytes32 _title, address _catAddr)
        BaseContentManagementContract(SharedTypes.contentType.photo, _title, _catAddr) public {
    }
    
    function getGenre () public view returns (bytes32) {
		return 'photo';
    }
}




/* ********************************************* */
/* ********************************************* */
/* ********************************************* */




contract DocumentManagementContract is BaseContentManagementContract {
    constructor (bytes32 _title, address _catAddr)
        BaseContentManagementContract(SharedTypes.contentType.document, _title, _catAddr) public {
    }
    
    function getGenre () public view returns (bytes32) {
		return 'document';
    }
}


