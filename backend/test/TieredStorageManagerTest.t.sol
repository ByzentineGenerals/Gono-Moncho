// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/storage/TieredStorageManager.sol";

contract TieredStorageManagerTest is Test {
    TieredStorageManager public storage manager;
    
    address public owner = address(1);
    address public author1 = address(2);
    address public author2 = address(3);
    address public pinner1 = address(4);
    
    function setUp() public {
        vm.prank(owner);
        storageManager = new TieredStorageManager(owner);
        
        // Authorize pinner
        vm.prank(owner);
        storageManager.setAuthorizedPinner(pinner1, true);
    }
    
    function testStoreTextArticle() public {
        vm.prank(author1);
        TieredStorageManager.StorageTier tier = storageManager.storeContent(
            "article-001",
            TieredStorageManager.ContentType.TEXT_ARTICLE,
            "arweave-tx-123",
            5000 // 5KB
        );
        
        assertEq(uint8(tier), uint8(TieredStorageManager.StorageTier.ARWEAVE));
    }
    
    function testStoreVideo() public {
        vm.prank(author1);
        TieredStorageManager.StorageTier tier = storageManager.storeContent(
            "video-001",
            TieredStorageManager.ContentType.VIDEO,
            "QmIPFSHash123",
            50 * 1024 * 1024 // 50MB
        );
        
        assertEq(uint8(tier), uint8(TieredStorageManager.StorageTier.IPFS));
    }
    
    function testIPFSPinning() public {
        // Store IPFS content
        vm.prank(author1);
        storageManager.storeContent(
            "video-001",
            TieredStorageManager.ContentType.VIDEO,
            "QmIPFSHash123",
            50 * 1024 * 1024
        );
        
        // Confirm pinning
        vm.prank(pinner1);
        storageManager.confirmIPFSPinning("video-001");
        
        (,,,,,,bool isPinned) = storageManager.getStorageInfo("video-001");
        assertTrue(isPinned);
    }
    
    function testAddBackupReference() public {
        vm.prank(author1);
        storageManager.storeContent(
            "article-001",
            TieredStorageManager.ContentType.TEXT_ARTICLE,
            "arweave-tx-123",
            5000
        );
        
        vm.prank(owner);
        storageManager.addBackupReference("article-001", "s3://bucket/article-001");
        
        (,,,string memory backupHash,,,) = storageManager.getStorageInfo("article-001");
        assertEq(backupHash, "s3://bucket/article-001");
    }
    
    function testCannotStoreDuplicateContent() public {
        vm.prank(author1);
        storageManager.storeContent(
            "article-001",
            TieredStorageManager.ContentType.TEXT_ARTICLE,
            "arweave-tx-123",
            5000
        );
        
        vm.prank(author1);
        vm.expectRevert("Content already exists");
        storageManager.storeContent(
            "article-001",
            TieredStorageManager.ContentType.TEXT_ARTICLE,
            "arweave-tx-456",
            5000
        );
    }
    
    function testGetStorageMetrics() public {
        vm.prank(author1);
        storageManager.storeContent(
            "article-001",
            TieredStorageManager.ContentType.TEXT_ARTICLE,
            "arweave-tx-123",
            5000
        );
        
        vm.prank(author2);
        storageManager.storeContent(
            "video-001",
            TieredStorageManager.ContentType.VIDEO,
            "QmHash",
            50 * 1024 * 1024
        );
        
        (uint256 arweaveBytes, uint256 ipfsBytes, uint256 totalPieces) = 
            storageManager.getStorageMetrics();
        
        assertEq(arweaveBytes, 5000);
        assertEq(ipfsBytes, 50 * 1024 * 1024);
        assertEq(totalPieces, 2);
    }
}
