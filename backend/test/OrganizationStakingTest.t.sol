// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/staking/OrganizationStaking.sol";
import "../src/tokens/NEWSToken.sol";

contract OrganizationStakingTest is Test {
    OrganizationStaking public orgStaking;
    NEWSToken public newsToken;

    address public owner = address(1);
    address public organization1 = address(2);
    address public organization2 = address(3);
    address public journalist1 = address(4);
    address public journalist2 = address(5);

    function setUp() public {
        vm.prank(owner);
        newsToken = new NEWSToken();

        vm.prank(owner);
        orgStaking = new OrganizationStaking(address(newsToken));

        // Distribute tokens
        vm.startPrank(owner);
        newsToken.transfer(organization1, 100000 * 10 ** 18);
        newsToken.transfer(organization2, 100000 * 10 ** 18);
        vm.stopPrank();

        // Approve staking contract
        vm.prank(organization1);
        newsToken.approve(address(orgStaking), type(uint256).max);

        vm.prank(organization2);
        newsToken.approve(address(orgStaking), type(uint256).max);
    }

    function testDepositOrganizationStake() public {
        vm.prank(organization1);
        orgStaking.depositOrganizationStake(10000 * 10 ** 18);

        assertEq(
            orgStaking.organizationTotalStake(organization1),
            10000 * 10 ** 18
        );
    }

    function testAllocateToJournalist() public {
        vm.prank(organization1);
        orgStaking.depositOrganizationStake(10000 * 10 ** 18);

        vm.prank(organization1);
        orgStaking.allocateToJournalist(journalist1, 5000 * 10 ** 18);

        assertEq(
            orgStaking.journalistAllocations(organization1, journalist1),
            5000 * 10 ** 18
        );
        assertEq(
            orgStaking.getTotalJournalistBacking(journalist1),
            5000 * 10 ** 18
        );
    }

    function testMultipleOrganizationsBacking() public {
        // Organization 1 backs journalist
        vm.prank(organization1);
        orgStaking.depositOrganizationStake(10000 * 10 ** 18);

        vm.prank(organization1);
        orgStaking.allocateToJournalist(journalist1, 5000 * 10 ** 18);

        // Organization 2 also backs same journalist
        vm.prank(organization2);
        orgStaking.depositOrganizationStake(10000 * 10 ** 18);

        vm.prank(organization2);
        orgStaking.allocateToJournalist(journalist1, 3000 * 10 ** 18);

        assertEq(
            orgStaking.getTotalJournalistBacking(journalist1),
            8000 * 10 ** 18
        );
    }

    function testWithdrawStake() public {
        vm.prank(organization1);
        orgStaking.depositOrganizationStake(10000 * 10 ** 18);

        vm.prank(organization1);
        orgStaking.allocateToJournalist(journalist1, 5000 * 10 ** 18);

        // Deallocate first
        vm.prank(organization1);
        orgStaking.deallocateFromJournalist(journalist1, 5000 * 10 ** 18);

        uint256 balanceBefore = newsToken.balanceOf(organization1);

        // Withdraw
        vm.prank(organization1);
        orgStaking.withdrawStake(5000 * 10 ** 18);

        uint256 balanceAfter = newsToken.balanceOf(organization1);
        assertEq(balanceAfter - balanceBefore, 5000 * 10 ** 18);
    }

    function testCannotOverAllocate() public {
        vm.prank(organization1);
        orgStaking.depositOrganizationStake(10000 * 10 ** 18);

        vm.prank(organization1);
        vm.expectRevert("Insufficient unallocated stake");
        orgStaking.allocateToJournalist(journalist1, 15000 * 10 ** 18);
    }

    function testMinimumAllocation() public {
        vm.prank(organization1);
        orgStaking.depositOrganizationStake(10000 * 10 ** 18);

        vm.prank(organization1);
        vm.expectRevert("Minimum 100 NEWS per journalist");
        orgStaking.allocateToJournalist(journalist1, 50 * 10 ** 18);
    }
}
