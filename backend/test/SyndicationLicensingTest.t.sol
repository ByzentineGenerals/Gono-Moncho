// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/tokens/SyndicationLicensing.sol";

contract SyndicationLicensingTest is Test {
    SyndicationLicensing public licensing;

    address public owner = address(1);
    address public journalist1 = address(2);
    address public outlet1 = address(3);
    address public licensee1 = address(4);
    address public licensee2 = address(5);

    function setUp() public {
        vm.prank(owner);
        licensing = new SyndicationLicensing(owner);

        // Fund licensees
        vm.deal(licensee1, 100 ether);
        vm.deal(licensee2, 100 ether);
    }

    function testRegisterLicensee() public {
        vm.prank(licensee1);
        licensing.registerLicensee(
            "Local News Network",
            5000 // SMALL tier (< 10k subscribers)
        );

        (
            string memory name,
            uint256 subscriberCount,
            ,
            uint8 tier,

        ) = licensing.licensees(licensee1);

        assertEq(name, "Local News Network");
        assertEq(subscriberCount, 5000);
        assertEq(tier, 0); // SMALL
    }

    function testTierAssignment() public {
        // SMALL tier
        vm.prank(licensee1);
        licensing.registerLicensee("Small News", 5000);
        (, , uint8 tier1, ) = licensing.licensees(licensee1);
        assertEq(tier1, 0);

        // MEDIUM tier
        vm.prank(licensee2);
        licensing.registerLicensee("Medium News", 50000);
        (, , uint8 tier2, ) = licensing.licensees(licensee2);
        assertEq(tier2, 1);

        // LARGE tier
        address licensee3 = address(6);
        vm.deal(licensee3, 100 ether);
        vm.prank(licensee3);
        licensing.registerLicensee("Large News", 500000);
        (, , uint8 tier3, ) = licensing.licensees(licensee3);
        assertEq(tier3, 2);

        // ENTERPRISE tier
        address licensee4 = address(7);
        vm.deal(licensee4, 100 ether);
        vm.prank(licensee4);
        licensing.registerLicensee("Enterprise News", 2000000);
        (, , uint8 tier4, ) = licensing.licensees(licensee4);
        assertEq(tier4, 3);
    }

    function testPurchaseLicense() public {
        // Register content
        vm.prank(owner);
        licensing.registerContent(
            "article123",
            journalist1,
            outlet1,
            "Breaking News Story"
        );

        // Register licensee
        vm.prank(licensee1);
        licensing.registerLicensee("Local News", 5000);

        // Purchase license (SMALL tier = 0.001 ETH)
        vm.prank(licensee1);
        licensing.purchaseLicense{value: 0.001 ether}("article123", false);

        assertTrue(licensing.hasActiveLicense(licensee1, "article123"));
    }

    function testExclusiveLicense() public {
        vm.prank(owner);
        licensing.registerContent("article123", journalist1, outlet1, "Story");

        vm.prank(licensee1);
        licensing.registerLicensee("Local News", 5000);

        // Purchase exclusive license (3x price)
        vm.prank(licensee1);
        licensing.purchaseLicense{value: 0.003 ether}("article123", true);

        // Another licensee tries to purchase
        vm.prank(licensee2);
        licensing.registerLicensee("Other News", 5000);

        vm.prank(licensee2);
        vm.expectRevert("Exclusive license active");
        licensing.purchaseLicense{value: 0.001 ether}("article123", false);
    }

    function testRevenueDistribution() public {
        vm.prank(owner);
        licensing.registerContent("article123", journalist1, outlet1, "Story");

        vm.prank(licensee1);
        licensing.registerLicensee("Local News", 5000);

        uint256 journalistBalanceBefore = journalist1.balance;
        uint256 outletBalanceBefore = outlet1.balance;
        uint256 platformBalanceBefore = owner.balance;

        vm.prank(licensee1);
        licensing.purchaseLicense{value: 0.001 ether}("article123", false);

        // Check revenue distribution (60% journalist, 30% outlet, 10% platform)
        uint256 journalistRevenue = licensing.journalistRevenue(journalist1);
        uint256 outletRevenue = licensing.outletRevenue(outlet1);
        uint256 platformRevenue = licensing.platformRevenue();

        assertEq(journalistRevenue, 0.0006 ether); // 60%
        assertEq(outletRevenue, 0.0003 ether); // 30%
        assertEq(platformRevenue, 0.0001 ether); // 10%
    }

    function testWithdrawJournalistRevenue() public {
        vm.prank(owner);
        licensing.registerContent("article123", journalist1, outlet1, "Story");

        vm.prank(licensee1);
        licensing.registerLicensee("Local News", 5000);

        vm.prank(licensee1);
        licensing.purchaseLicense{value: 0.001 ether}("article123", false);

        uint256 balanceBefore = journalist1.balance;

        vm.prank(journalist1);
        licensing.withdrawJournalistRevenue();

        uint256 balanceAfter = journalist1.balance;
        assertEq(balanceAfter - balanceBefore, 0.0006 ether);
    }

    function testWithdrawOutletRevenue() public {
        vm.prank(owner);
        licensing.registerContent("article123", journalist1, outlet1, "Story");

        vm.prank(licensee1);
        licensing.registerLicensee("Local News", 5000);

        vm.prank(licensee1);
        licensing.purchaseLicense{value: 0.001 ether}("article123", false);

        uint256 balanceBefore = outlet1.balance;

        vm.prank(outlet1);
        licensing.withdrawOutletRevenue();

        uint256 balanceAfter = outlet1.balance;
        assertEq(balanceAfter - balanceBefore, 0.0003 ether);
    }

    function testRecordRepublish() public {
        vm.prank(owner);
        licensing.registerContent("article123", journalist1, outlet1, "Story");

        vm.prank(licensee1);
        licensing.registerLicensee("Local News", 5000);

        vm.prank(licensee1);
        licensing.purchaseLicense{value: 0.001 ether}("article123", false);

        vm.prank(licensee1);
        licensing.recordRepublish("article123", "https://localnews.com/story");

        assertEq(licensing.getRepublishCount("article123"), 1);
    }

    function testLicenseExpiration() public {
        vm.prank(owner);
        licensing.registerContent("article123", journalist1, outlet1, "Story");

        vm.prank(licensee1);
        licensing.registerLicensee("Local News", 5000);

        vm.prank(licensee1);
        licensing.purchaseLicense{value: 0.001 ether}("article123", false);

        assertTrue(licensing.hasActiveLicense(licensee1, "article123"));

        // Advance time beyond 365 days
        vm.warp(block.timestamp + 366 days);

        assertFalse(licensing.hasActiveLicense(licensee1, "article123"));
    }

    function testInsufficientPayment() public {
        vm.prank(owner);
        licensing.registerContent("article123", journalist1, outlet1, "Story");

        vm.prank(licensee1);
        licensing.registerLicensee("Local News", 5000);

        vm.prank(licensee1);
        vm.expectRevert("Insufficient payment");
        licensing.purchaseLicense{value: 0.0005 ether}("article123", false);
    }

    function testCannotRepublishWithoutLicense() public {
        vm.prank(owner);
        licensing.registerContent("article123", journalist1, outlet1, "Story");

        vm.prank(licensee1);
        licensing.registerLicensee("Local News", 5000);

        vm.prank(licensee1);
        vm.expectRevert("No active license");
        licensing.recordRepublish("article123", "https://localnews.com/story");
    }
}
