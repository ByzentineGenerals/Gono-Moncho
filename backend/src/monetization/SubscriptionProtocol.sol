// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SubscriptionProtocol
 * @notice Decentralized subscription system for premium content (magazines, newsletters)
 * @dev Enables authors/outlets to monetize premium content with recurring subscriptions
 *      Revenue model: Platform takes small commission, rest goes to author
 */
contract SubscriptionProtocol is Ownable, ReentrancyGuard {
    enum SubscriptionTier {
        FREE,
        BASIC, // Monthly access to premium articles
        PREMIUM, // All content + exclusive features
        SUPPORTER // Premium + support independent journalism
    }

    struct ContentCreator {
        address payable wallet;
        string name;
        string description;
        uint256 totalSubscribers;
        uint256 totalRevenue;
        bool isActive;
        uint256 registeredAt;
    }

    struct SubscriptionPlan {
        SubscriptionTier tier;
        uint256 monthlyPrice; // in wei
        uint256 annualPrice; // Annual subscription (usually discounted)
        string benefits;
        bool isActive;
    }

    struct Subscription {
        address subscriber;
        address creator;
        SubscriptionTier tier;
        uint256 startDate;
        uint256 expiryDate;
        bool isActive;
        bool isAnnual;
    }

    struct PremiumContent {
        string contentId;
        address creator;
        SubscriptionTier minimumTier;
        uint256 publishedAt;
        bool isActive;
    }

    // Creator => Content Creator info
    mapping(address => ContentCreator) public creators;

    // Creator => Tier => Plan details
    mapping(address => mapping(SubscriptionTier => SubscriptionPlan))
        public plans;

    // Subscriber => Creator => Subscription
    mapping(address => mapping(address => Subscription)) public subscriptions;

    // Content ID => Premium Content info
    mapping(string => PremiumContent) public premiumContent;

    // Platform commission (e.g., 5% = 500)
    uint256 public platformCommission = 500; // 5%
    uint256 public constant COMMISSION_DENOMINATOR = 10000;

    // Platform revenue treasury
    address payable public platformTreasury;

    // Creator revenue balances
    mapping(address => uint256) public creatorBalances;

    // Events
    event CreatorRegistered(address indexed creator, string name);
    event SubscriptionPlanCreated(
        address indexed creator,
        SubscriptionTier tier,
        uint256 monthlyPrice,
        uint256 annualPrice
    );
    event Subscribed(
        address indexed subscriber,
        address indexed creator,
        SubscriptionTier tier,
        uint256 expiryDate,
        bool isAnnual
    );
    event SubscriptionRenewed(
        address indexed subscriber,
        address indexed creator,
        uint256 newExpiryDate
    );
    event SubscriptionCancelled(
        address indexed subscriber,
        address indexed creator
    );
    event PremiumContentPublished(
        string indexed contentId,
        address indexed creator,
        SubscriptionTier minimumTier
    );
    event RevenueWithdrawn(address indexed creator, uint256 amount);
    event DonationReceived(
        address indexed supporter,
        address indexed creator,
        uint256 amount
    );

    constructor(
        address payable _platformTreasury,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_platformTreasury != address(0), "Invalid treasury");
        platformTreasury = _platformTreasury;
    }

    /**
     * @notice Register as content creator
     */
    function registerCreator(
        string calldata name,
        string calldata description
    ) external {
        require(!creators[msg.sender].isActive, "Already registered");
        require(bytes(name).length > 0, "Name required");

        creators[msg.sender] = ContentCreator({
            wallet: payable(msg.sender),
            name: name,
            description: description,
            totalSubscribers: 0,
            totalRevenue: 0,
            isActive: true,
            registeredAt: block.timestamp
        });

        emit CreatorRegistered(msg.sender, name);
    }

    /**
     * @notice Create subscription plan
     */
    function createSubscriptionPlan(
        SubscriptionTier tier,
        uint256 monthlyPrice,
        uint256 annualPrice,
        string calldata benefits
    ) external {
        require(creators[msg.sender].isActive, "Not registered creator");
        require(tier != SubscriptionTier.FREE, "Cannot price free tier");
        require(monthlyPrice > 0, "Price must be positive");
        require(annualPrice > 0, "Annual price required");
        require(annualPrice < monthlyPrice * 12, "Annual should be discounted");

        plans[msg.sender][tier] = SubscriptionPlan({
            tier: tier,
            monthlyPrice: monthlyPrice,
            annualPrice: annualPrice,
            benefits: benefits,
            isActive: true
        });

        emit SubscriptionPlanCreated(
            msg.sender,
            tier,
            monthlyPrice,
            annualPrice
        );
    }

    /**
     * @notice Subscribe to creator (monthly or annual)
     */
    function subscribe(
        address creator,
        SubscriptionTier tier,
        bool isAnnual
    ) external payable nonReentrant {
        require(creators[creator].isActive, "Creator not active");
        require(tier != SubscriptionTier.FREE, "Use free tier directly");

        SubscriptionPlan memory plan = plans[creator][tier];
        require(plan.isActive, "Plan not available");

        uint256 price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
        require(msg.value >= price, "Insufficient payment");

        // Calculate platform commission
        uint256 commission = (price * platformCommission) /
            COMMISSION_DENOMINATOR;
        uint256 creatorRevenue = price - commission;

        // Update balances
        creatorBalances[creator] += creatorRevenue;
        creators[creator].totalRevenue += price;

        // Transfer commission to treasury
        (bool success, ) = platformTreasury.call{value: commission}("");
        require(success, "Commission transfer failed");

        // Calculate expiry date
        uint256 duration = isAnnual ? 365 days : 30 days;
        uint256 expiryDate = block.timestamp + duration;

        // Check if existing subscription
        Subscription storage sub = subscriptions[msg.sender][creator];
        if (sub.isActive && sub.expiryDate > block.timestamp) {
            // Extend existing subscription
            sub.expiryDate += duration;
            emit SubscriptionRenewed(msg.sender, creator, sub.expiryDate);
        } else {
            // New subscription
            subscriptions[msg.sender][creator] = Subscription({
                subscriber: msg.sender,
                creator: creator,
                tier: tier,
                startDate: block.timestamp,
                expiryDate: expiryDate,
                isActive: true,
                isAnnual: isAnnual
            });

            creators[creator].totalSubscribers++;
            emit Subscribed(msg.sender, creator, tier, expiryDate, isAnnual);
        }

        // Refund excess payment
        if (msg.value > price) {
            (bool refundSuccess, ) = payable(msg.sender).call{
                value: msg.value - price
            }("");
            require(refundSuccess, "Refund failed");
        }
    }

    /**
     * @notice Cancel subscription (stops auto-renewal, access until expiry)
     */
    function cancelSubscription(address creator) external {
        Subscription storage sub = subscriptions[msg.sender][creator];
        require(sub.isActive, "No active subscription");

        sub.isActive = false;
        creators[creator].totalSubscribers--;

        emit SubscriptionCancelled(msg.sender, creator);
    }

    /**
     * @notice Publish premium content
     */
    function publishPremiumContent(
        string calldata contentId,
        SubscriptionTier minimumTier
    ) external {
        require(creators[msg.sender].isActive, "Not registered creator");
        require(bytes(contentId).length > 0, "Invalid content ID");
        require(premiumContent[contentId].publishedAt == 0, "Content exists");

        premiumContent[contentId] = PremiumContent({
            contentId: contentId,
            creator: msg.sender,
            minimumTier: minimumTier,
            publishedAt: block.timestamp,
            isActive: true
        });

        emit PremiumContentPublished(contentId, msg.sender, minimumTier);
    }

    /**
     * @notice Check if subscriber has access to content
     */
    function hasAccess(
        address subscriber,
        string calldata contentId
    ) external view returns (bool) {
        PremiumContent memory content = premiumContent[contentId];
        if (!content.isActive) return false;

        // Free tier content is accessible to all
        if (content.minimumTier == SubscriptionTier.FREE) return true;

        Subscription memory sub = subscriptions[subscriber][content.creator];

        // Check if subscription is active and not expired
        if (!sub.isActive || sub.expiryDate < block.timestamp) {
            return false;
        }

        // Check if tier is sufficient
        return sub.tier >= content.minimumTier;
    }

    /**
     * @notice Creator withdraws revenue
     */
    function withdrawRevenue() external nonReentrant {
        uint256 balance = creatorBalances[msg.sender];
        require(balance > 0, "No balance to withdraw");

        creatorBalances[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit RevenueWithdrawn(msg.sender, balance);
    }

    /**
     * @notice Direct donation to creator (Patreon-style)
     */
    function donateToCreator(address creator) external payable nonReentrant {
        require(creators[creator].isActive, "Creator not active");
        require(msg.value > 0, "Donation must be positive");

        // Platform commission on donations
        uint256 commission = (msg.value * platformCommission) /
            COMMISSION_DENOMINATOR;
        uint256 creatorAmount = msg.value - commission;

        creatorBalances[creator] += creatorAmount;
        creators[creator].totalRevenue += msg.value;

        // Transfer commission
        (bool success, ) = platformTreasury.call{value: commission}("");
        require(success, "Commission transfer failed");

        emit DonationReceived(msg.sender, creator, msg.value);
    }

    /**
     * @notice Get subscription status
     */
    function getSubscriptionStatus(
        address subscriber,
        address creator
    )
        external
        view
        returns (
            bool isActive,
            SubscriptionTier tier,
            uint256 expiryDate,
            bool isExpired
        )
    {
        Subscription memory sub = subscriptions[subscriber][creator];
        return (
            sub.isActive,
            sub.tier,
            sub.expiryDate,
            sub.expiryDate < block.timestamp
        );
    }

    /**
     * @notice Get creator stats
     */
    function getCreatorStats(
        address creator
    )
        external
        view
        returns (
            string memory name,
            uint256 subscribers,
            uint256 totalRevenue,
            uint256 pendingBalance
        )
    {
        ContentCreator memory c = creators[creator];
        return (
            c.name,
            c.totalSubscribers,
            c.totalRevenue,
            creatorBalances[creator]
        );
    }

    /**
     * @notice Update platform commission (DAO governance)
     */
    function setPlatformCommission(uint256 newCommission) external onlyOwner {
        require(newCommission <= 1000, "Commission too high (max 10%)");
        platformCommission = newCommission;
    }

    /**
     * @notice Update platform treasury address
     */
    function setPlatformTreasury(
        address payable newTreasury
    ) external onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        platformTreasury = newTreasury;
    }
}
