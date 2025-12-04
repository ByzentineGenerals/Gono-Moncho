// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../tokens/NEWS.sol";

/**
 * @title OrganizationStaking
 * @notice Enables news organizations to stake on behalf of their affiliated journalists
 * @dev Organizations stake to signal credibility and backing for journalists
 *
 * Organizations can:
 * - Stake NEWS tokens to support and vouch for their journalists
 * - Amplify journalist credibility through organizational backing
 * - Signal long-term commitment to quality journalism
 *
 * Note: Staking provides credibility signal, not APY rewards
 * Revenue comes from B2B integrations, syndication, subscriptions
 */
contract OrganizationStaking is Ownable {
    NEWS public newsToken;

    // Minimum stake per journalist
    uint256 public constant MIN_STAKE_PER_JOURNALIST = 100 * 1e18; // 100 NEWS

    struct OrganizationStake {
        uint256 totalStaked;
        uint256 activeJournalists;
        uint256 lastUpdateTime;
        bool active;
    }

    struct JournalistAllocation {
        uint256 stakedAmount;
        uint256 allocationDate;
        bool active;
    }

    // Organization => stake data
    mapping(address => OrganizationStake) public organizationStakes;

    // Organization => journalist => allocation
    mapping(address => mapping(address => JournalistAllocation))
        public allocations;

    // Organization => journalist list
    mapping(address => address[]) public organizationJournalists;

    // Journalist => organization list (journalists can be backed by multiple orgs)
    mapping(address => address[]) public journalistOrganizations;

    // Track total staked across all organizations
    uint256 public totalOrganizationStake;

    // Events
    event OrganizationStakeDeposited(
        address indexed organization,
        uint256 amount,
        uint256 totalStaked
    );

    event StakeAllocatedToJournalist(
        address indexed organization,
        address indexed journalist,
        uint256 amount
    );

    event StakeDeallocated(
        address indexed organization,
        address indexed journalist,
        uint256 amount
    );

    event OrganizationStakeWithdrawn(
        address indexed organization,
        uint256 amount
    );

    event CredibilityBoosted(
        address indexed journalist,
        address indexed organization,
        uint256 totalBacking
    );

    constructor(
        address _newsToken,
        address initialOwner
    ) Ownable(initialOwner) {
        newsToken = NEWS(_newsToken);
    }

    /**
     * @notice Deposit stake for organization
     * @param amount Amount of NEWS tokens to stake
     */
    function depositOrganizationStake(uint256 amount) external {
        require(amount > 0, "Amount must be positive");

        // Transfer tokens from organization to contract
        require(
            newsToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Update organization stake
        OrganizationStake storage stake = organizationStakes[msg.sender];

        stake.totalStaked += amount;
        stake.active = true;
        stake.lastUpdateTime = block.timestamp;

        totalOrganizationStake += amount;

        emit OrganizationStakeDeposited(msg.sender, amount, stake.totalStaked);
    }

    /**
     * @notice Allocate stake to a journalist
     * @param journalist Address of journalist to back
     * @param amount Amount to allocate
     */
    function allocateToJournalist(address journalist, uint256 amount) external {
        require(journalist != address(0), "Invalid journalist");
        require(amount >= MIN_STAKE_PER_JOURNALIST, "Insufficient allocation");

        OrganizationStake storage orgStake = organizationStakes[msg.sender];
        require(orgStake.active, "Organization not staking");

        // Calculate available stake
        uint256 allocatedStake = _getTotalAllocated(msg.sender);
        uint256 availableStake = orgStake.totalStaked - allocatedStake;

        require(availableStake >= amount, "Insufficient unallocated stake");

        JournalistAllocation storage allocation = allocations[msg.sender][
            journalist
        ];

        if (!allocation.active) {
            // New allocation
            allocation.stakedAmount = amount;
            allocation.allocationDate = block.timestamp;
            allocation.active = true;

            organizationJournalists[msg.sender].push(journalist);
            journalistOrganizations[journalist].push(msg.sender);

            orgStake.activeJournalists++;
        } else {
            // Increase existing allocation
            allocation.stakedAmount += amount;
        }

        // Calculate total backing for credibility boost
        uint256 totalBacking = getTotalJournalistBacking(journalist);

        emit StakeAllocatedToJournalist(msg.sender, journalist, amount);
        emit CredibilityBoosted(journalist, msg.sender, totalBacking);
    }

    /**
     * @notice Deallocate stake from journalist
     * @param journalist Journalist to remove stake from
     * @param amount Amount to deallocate
     */
    function deallocateFromJournalist(
        address journalist,
        uint256 amount
    ) external {
        JournalistAllocation storage allocation = allocations[msg.sender][
            journalist
        ];
        require(allocation.active, "No allocation found");
        require(
            allocation.stakedAmount >= amount,
            "Insufficient allocated amount"
        );

        allocation.stakedAmount -= amount;

        // If fully deallocated, mark as inactive
        if (allocation.stakedAmount == 0) {
            allocation.active = false;
            organizationStakes[msg.sender].activeJournalists--;
        }

        emit StakeDeallocated(msg.sender, journalist, amount);
    }

    /**
     * @notice Withdraw unallocated organization stake
     * @param amount Amount to withdraw
     */
    function withdrawOrganizationStake(uint256 amount) external {
        OrganizationStake storage orgStake = organizationStakes[msg.sender];
        require(orgStake.active, "No active stake");

        uint256 allocatedStake = _getTotalAllocated(msg.sender);
        uint256 availableToWithdraw = orgStake.totalStaked - allocatedStake;

        require(
            availableToWithdraw >= amount,
            "Insufficient unallocated stake"
        );

        orgStake.totalStaked -= amount;
        totalOrganizationStake -= amount;

        // Transfer tokens back to organization
        require(newsToken.transfer(msg.sender, amount), "Transfer failed");

        emit OrganizationStakeWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Get journalist's stake backing from organization
     */
    function getJournalistStake(
        address organization,
        address journalist
    ) external view returns (uint256) {
        return allocations[organization][journalist].stakedAmount;
    }

    /**
     * @notice Get total stake backing a journalist across all organizations
     */
    function getTotalJournalistBacking(
        address journalist
    ) external view returns (uint256 total) {
        address[] memory orgs = journalistOrganizations[journalist];
        for (uint256 i = 0; i < orgs.length; i++) {
            if (allocations[orgs[i]][journalist].active) {
                total += allocations[orgs[i]][journalist].stakedAmount;
            }
        }
    }

    /**
     * @notice Get organization's journalists
     */
    function getOrganizationJournalists(
        address organization
    ) external view returns (address[] memory) {
        return organizationJournalists[organization];
    }

    /**
     * @notice Internal: Get total allocated stake for organization
     */
    function _getTotalAllocated(
        address organization
    ) internal view returns (uint256 total) {
        address[] memory journalists = organizationJournalists[organization];
        for (uint256 i = 0; i < journalists.length; i++) {
            JournalistAllocation storage allocation = allocations[organization][
                journalists[i]
            ];
            if (allocation.active) {
                total += allocation.stakedAmount;
            }
        }
    }
}
