// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/monetization/SubscriptionProtocol.sol";

contract SubscriptionProtocolTest is Test {
    SubscriptionProtocol public protocol;
    
    address public owner = address(1);
    address payable public treasury = payable(address(2));
    address public creator1 = payable(address(3));
    address public creator2 = payable(address(4));
    address public subscriber1 = address(5);
    address public subscriber2 = address(6);
    
    function setUp() public {
        vm.prank(owner);
        protocol = new SubscriptionProtocol(treasury, owner);
        
        // Fund subscribers
        vm.deal(subscriber1, 100 ether);
        vm.deal(subscriber2, 100 ether);
    }
    
    function testRegisterCreator() public {
        vm.prank(creator1);
        protocol.registerCreator("Investigative Reporter", "Daily investigative journalism");
        
        (,string memory name,,,bool isActive,) = protocol.creators(creator1);
        assertEq(name, "Investigative Reporter");
        assertTrue(isActive);
    }
    
    function testCreateSubscriptionPlan() public {
        vm.prank(creator1);
        protocol.registerCreator("Reporter", "News");
        
        vm.prank(creator1);
        protocol.createSubscriptionPlan(
            SubscriptionProtocol.SubscriptionTier.BASIC,
            0.01 ether, // Monthly
            0.1 ether,  // Annual (discounted)
            "Access to premium articles"
        );
        
        (,,uint256 monthlyPrice, uint256 annualPrice,) = 
            protocol.plans(creator1, SubscriptionProtocol.SubscriptionTier.BASIC);
        
        assertEq(monthlyPrice, 0.01 ether);
        assertEq(annualPrice, 0.1 ether);
    }
    
    function testSubscribeMonthly() public {
        // Setup
        vm.prank(creator1);
        protocol.registerCreator("Reporter", "News");
        
        vm.prank(creator1);
        protocol.createSubscriptionPlan(
            SubscriptionProtocol.SubscriptionTier.BASIC,
            0.01 ether,
            0.1 ether,
            "Premium access"
        );
        
        // Subscribe
        vm.prank(subscriber1);
        protocol.subscribe{value: 0.01 ether}(
            creator1,
            SubscriptionProtocol.SubscriptionTier.BASIC,
            false // Monthly
        );
        
        (bool isActive,,,) = protocol.getSubscriptionStatus(subscriber1, creator1);
        assertTrue(isActive);
    }
    
    function testSubscribeAnnual() public {
        vm.prank(creator1);
        protocol.registerCreator("Reporter", "News");
        
        vm.prank(creator1);
        protocol.createSubscriptionPlan(
            SubscriptionProtocol.SubscriptionTier.PREMIUM,
            0.02 ether,
            0.2 ether,
            "All access"
        );
        
        vm.prank(subscriber1);
        protocol.subscribe{value: 0.2 ether}(
            creator1,
            SubscriptionProtocol.SubscriptionTier.PREMIUM,
            true // Annual
        );
        
        (,, uint256 expiryDate,) = protocol.getSubscriptionStatus(subscriber1, creator1);
        assertGt(expiryDate, block.timestamp + 364 days);
    }
    
    function testPlatformCommission() public {
        vm.prank(creator1);
        protocol.registerCreator("Reporter", "News");
        
        vm.prank(creator1);
        protocol.createSubscriptionPlan(
            SubscriptionProtocol.SubscriptionTier.BASIC,
            1 ether,
            10 ether,
            "Premium"
        );
        
        uint256 treasuryBefore = treasury.balance;
        
        vm.prank(subscriber1);
        protocol.subscribe{value: 1 ether}(
            creator1,
            SubscriptionProtocol.SubscriptionTier.BASIC,
            false
        );
        
        // 5% commission = 0.05 ether
        assertEq(treasury.balance - treasuryBefore, 0.05 ether);
    }
    
    function testCreatorWithdrawRevenue() public {
        vm.prank(creator1);
        protocol.registerCreator("Reporter", "News");
        
        vm.prank(creator1);
        protocol.createSubscriptionPlan(
            SubscriptionProtocol.SubscriptionTier.BASIC,
            1 ether,
            10 ether,
            "Premium"
        );
        
        vm.prank(subscriber1);
        protocol.subscribe{value: 1 ether}(
            creator1,
            SubscriptionProtocol.SubscriptionTier.BASIC,
            false
        );
        
        uint256 balanceBefore = creator1.balance;
        
        vm.prank(creator1);
        protocol.withdrawRevenue();
        
        // Creator gets 95% (1 - 5% commission) = 0.95 ether
        assertEq(creator1.balance - balanceBefore, 0.95 ether);
    }
    
    function testPublishPremiumContent() public {
        vm.prank(creator1);
        protocol.registerCreator("Reporter", "News");
        
        vm.prank(creator1);
        protocol.publishPremiumContent(
            "premium-article-001",
            SubscriptionProtocol.SubscriptionTier.BASIC
        );
        
        (,, SubscriptionProtocol.SubscriptionTier minTier,,) = 
            protocol.premiumContent("premium-article-001");
        
        assertEq(uint8(minTier), uint8(SubscriptionProtocol.SubscriptionTier.BASIC));
    }
    
    function testHasAccess() public {
        // Setup creator and content
        vm.prank(creator1);
        protocol.registerCreator("Reporter", "News");
        
        vm.prank(creator1);
        protocol.createSubscriptionPlan(
            SubscriptionProtocol.SubscriptionTier.BASIC,
            0.01 ether,
            0.1 ether,
            "Access"
        );
        
        vm.prank(creator1);
        protocol.publishPremiumContent(
            "premium-001",
            SubscriptionProtocol.SubscriptionTier.BASIC
        );
        
        // Subscriber without subscription
        assertFalse(protocol.hasAccess(subscriber1, "premium-001"));
        
        // Subscribe
        vm.prank(subscriber1);
        protocol.subscribe{value: 0.01 ether}(
            creator1,
            SubscriptionProtocol.SubscriptionTier.BASIC,
            false
        );
        
        // Now has access
        assertTrue(protocol.hasAccess(subscriber1, "premium-001"));
    }
    
    function testCancelSubscription() public {
        vm.prank(creator1);
        protocol.registerCreator("Reporter", "News");
        
        vm.prank(creator1);
        protocol.createSubscriptionPlan(
            SubscriptionProtocol.SubscriptionTier.BASIC,
            0.01 ether,
            0.1 ether,
            "Access"
        );
        
        vm.prank(subscriber1);
        protocol.subscribe{value: 0.01 ether}(
            creator1,
            SubscriptionProtocol.SubscriptionTier.BASIC,
            false
        );
        
        vm.prank(subscriber1);
        protocol.cancelSubscription(creator1);
        
        (bool isActive,,,) = protocol.getSubscriptionStatus(subscriber1, creator1);
        assertFalse(isActive);
    }
    
    function testDonateToCreator() public {
        vm.prank(creator1);
        protocol.registerCreator("Reporter", "News");
        
        vm.prank(subscriber1);
        protocol.donateToCreator{value: 1 ether}(creator1);
        
        uint256 balance = protocol.creatorBalances(creator1);
        assertEq(balance, 0.95 ether); // 95% after 5% commission
    }
}
