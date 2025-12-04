// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TieredStorageManager
 * @notice Manages content routing to appropriate storage layers
 * @dev Implements three-tier storage strategy:
 *      - Text/Metadata → Arweave (permanent, on-chain)
 *      - Heavy Media → IPFS (pinned by NewsDAO nodes)
 *      - Cold Backup → AWS S3 (referenced for redundancy)
 */
contract TieredStorageManager is Ownable {
    
    enum StorageTier {
        ARWEAVE,    // Permanent, immutable (text, metadata)
        IPFS,       // Distributed, pinned (images, videos)
        S3_BACKUP   // Centralized backup (redundancy)
    }
    
    enum ContentType {
        TEXT_ARTICLE,
        METADATA,
        IMAGE,
        VIDEO,
        AUDIO,
        DOCUMENT
    }
    
    struct StorageRecord {
        string contentId;
        ContentType contentType;
        StorageTier primaryTier;
        string primaryHash;      // Arweave TX ID or IPFS CID
        string backupHash;       // S3 reference
        uint256 size;            // Content size in bytes
        address author;
        uint256 timestamp;
        bool isPinned;           // For IPFS content
    }
    
    // Content ID => Storage Record
    mapping(string => StorageRecord) public storageRecords;
    
    // Author => Content IDs
    mapping(address => string[]) public authorContent;
    
    // IPFS content requiring pinning by DAO nodes
    mapping(string => bool) public ipfsPinningQueue;
    
    // DAO node addresses authorized to confirm pinning
    mapping(address => bool) public authorizedPinners;
    
    // Storage tier limits (in bytes)
    uint256 public constant ARWEAVE_MAX_SIZE = 10 * 1024 * 1024; // 10 MB for text
    uint256 public constant IPFS_RECOMMENDED_MAX = 100 * 1024 * 1024; // 100 MB
    
    // Total storage metrics
    uint256 public totalArweaveStored;
    uint256 public totalIPFSStored;
    uint256 public totalContentPieces;
    
    // Events
    event ContentStored(
        string indexed contentId,
        address indexed author,
        ContentType contentType,
        StorageTier tier,
        string primaryHash
    );
    
    event ContentPinned(
        string indexed contentId,
        address indexed pinner,
        string ipfsCID
    );
    
    event BackupCreated(
        string indexed contentId,
        string s3Reference
    );
    
    event PinnerAuthorized(address indexed pinner, bool status);
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @notice Store content with automatic tier routing
     * @param contentId Unique identifier for content
     * @param contentType Type of content being stored
     * @param primaryHash Arweave TX ID or IPFS CID
     * @param size Content size in bytes
     */
    function storeContent(
        string calldata contentId,
        ContentType contentType,
        string calldata primaryHash,
        uint256 size
    ) external returns (StorageTier) {
        require(bytes(contentId).length > 0, "Invalid content ID");
        require(bytes(primaryHash).length > 0, "Invalid hash");
        require(storageRecords[contentId].timestamp == 0, "Content already exists");
        
        // Determine appropriate storage tier
        StorageTier tier = _determineStorageTier(contentType, size);
        
        // Create storage record
        StorageRecord storage record = storageRecords[contentId];
        record.contentId = contentId;
        record.contentType = contentType;
        record.primaryTier = tier;
        record.primaryHash = primaryHash;
        record.size = size;
        record.author = msg.sender;
        record.timestamp = block.timestamp;
        
        // Update metrics
        if (tier == StorageTier.ARWEAVE) {
            totalArweaveStored += size;
        } else if (tier == StorageTier.IPFS) {
            totalIPFSStored += size;
            ipfsPinningQueue[contentId] = true;
            record.isPinned = false;
        }
        
        totalContentPieces++;
        authorContent[msg.sender].push(contentId);
        
        emit ContentStored(contentId, msg.sender, contentType, tier, primaryHash);
        
        return tier;
    }
    
    /**
     * @notice Confirm IPFS content pinning by DAO node
     * @param contentId Content to mark as pinned
     */
    function confirmIPFSPinning(string calldata contentId) external {
        require(authorizedPinners[msg.sender], "Not authorized pinner");
        
        StorageRecord storage record = storageRecords[contentId];
        require(record.timestamp > 0, "Content not found");
        require(record.primaryTier == StorageTier.IPFS, "Not IPFS content");
        require(!record.isPinned, "Already pinned");
        
        record.isPinned = true;
        ipfsPinningQueue[contentId] = false;
        
        emit ContentPinned(contentId, msg.sender, record.primaryHash);
    }
    
    /**
     * @notice Add S3 backup reference for redundancy
     * @param contentId Content to backup
     * @param s3Reference AWS S3 reference
     */
    function addBackupReference(
        string calldata contentId,
        string calldata s3Reference
    ) external onlyOwner {
        StorageRecord storage record = storageRecords[contentId];
        require(record.timestamp > 0, "Content not found");
        
        record.backupHash = s3Reference;
        
        emit BackupCreated(contentId, s3Reference);
    }
    
    /**
     * @notice Authorize/revoke DAO node as IPFS pinner
     * @param pinner Node address
     * @param status Authorization status
     */
    function setAuthorizedPinner(address pinner, bool status) external onlyOwner {
        authorizedPinners[pinner] = status;
        emit PinnerAuthorized(pinner, status);
    }
    
    /**
     * @notice Get content storage information
     * @param contentId Content identifier
     */
    function getStorageInfo(string calldata contentId) 
        external 
        view 
        returns (
            ContentType contentType,
            StorageTier tier,
            string memory primaryHash,
            string memory backupHash,
            uint256 size,
            address author,
            bool isPinned
        ) 
    {
        StorageRecord memory record = storageRecords[contentId];
        return (
            record.contentType,
            record.primaryTier,
            record.primaryHash,
            record.backupHash,
            record.size,
            record.author,
            record.isPinned
        );
    }
    
    /**
     * @notice Get all content by author
     */
    function getAuthorContent(address author) 
        external 
        view 
        returns (string[] memory) 
    {
        return authorContent[author];
    }
    
    /**
     * @notice Get pending IPFS pinning queue
     */
    function getPendingPinningCount() external view returns (uint256 count) {
        // Note: This is a simplified view. In production, maintain separate array.
        // For gas efficiency, track pending items separately.
        return 0; // Placeholder - implement with array tracking if needed
    }
    
    /**
     * @notice Get storage metrics
     */
    function getStorageMetrics() 
        external 
        view 
        returns (
            uint256 arweaveBytes,
            uint256 ipfsBytes,
            uint256 totalPieces
        ) 
    {
        return (totalArweaveStored, totalIPFSStored, totalContentPieces);
    }
    
    /**
     * @dev Determine optimal storage tier based on content type and size
     */
    function _determineStorageTier(
        ContentType contentType,
        uint256 size
    ) internal pure returns (StorageTier) {
        // Text and metadata always go to Arweave for permanence
        if (contentType == ContentType.TEXT_ARTICLE || 
            contentType == ContentType.METADATA) {
            require(size <= ARWEAVE_MAX_SIZE, "Text content too large");
            return StorageTier.ARWEAVE;
        }
        
        // Heavy media (video, large images) go to IPFS
        if (contentType == ContentType.VIDEO || 
            contentType == ContentType.AUDIO ||
            size > ARWEAVE_MAX_SIZE) {
            return StorageTier.IPFS;
        }
        
        // Small images and documents can use Arweave
        if (size <= ARWEAVE_MAX_SIZE) {
            return StorageTier.ARWEAVE;
        }
        
        // Default to IPFS for anything else
        return StorageTier.IPFS;
    }
    
    /**
     * @notice Emergency function to migrate content tier if needed
     */
    function migrateContentTier(
        string calldata contentId,
        StorageTier newTier,
        string calldata newHash
    ) external onlyOwner {
        StorageRecord storage record = storageRecords[contentId];
        require(record.timestamp > 0, "Content not found");
        
        // Update tier and hash
        record.primaryTier = newTier;
        record.primaryHash = newHash;
        
        // Reset pinning status if moving to IPFS
        if (newTier == StorageTier.IPFS) {
            record.isPinned = false;
            ipfsPinningQueue[contentId] = true;
        }
    }
}
