"use client";

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  NEWS_OUTLET_REGISTRY_ABI, 
  NEWS_OUTLET_REGISTRY_ADDRESS,
  ORGANIZATION_STAKING_ABI,
  ORGANIZATION_STAKING_ADDRESS 
} from '@/lib/contracts/organizationFeatures';

export default function OrganizationDashboard() {
  const { address } = useAccount();
  const [journalistAddress, setJournalistAddress] = useState('');
  const [journalistRole, setJournalistRole] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [allocateAmount, setAllocateAmount] = useState('');

  // Read outlet data
  const { data: outletData } = useReadContract({
    address: NEWS_OUTLET_REGISTRY_ADDRESS,
    abi: NEWS_OUTLET_REGISTRY_ABI,
    functionName: 'outlets',
    args: [address as `0x${string}`],
  });

  // Read staking data
  const { data: totalStake } = useReadContract({
    address: ORGANIZATION_STAKING_ADDRESS,
    abi: ORGANIZATION_STAKING_ABI,
    functionName: 'organizationTotalStake',
    args: [address as `0x${string}`],
  });

  const { writeContract: affiliateJournalist, isPending: isAffiliating } = useWriteContract();
  const { writeContract: depositStake, isPending: isDepositing } = useWriteContract();
  const { writeContract: allocateStake, isPending: isAllocating } = useWriteContract();

  const handleAffiliateJournalist = () => {
    affiliateJournalist({
      address: NEWS_OUTLET_REGISTRY_ADDRESS,
      abi: NEWS_OUTLET_REGISTRY_ABI,
      functionName: 'affiliateJournalist',
      args: [journalistAddress as `0x${string}`, journalistRole]
    });
  };

  const handleDepositStake = () => {
    depositStake({
      address: ORGANIZATION_STAKING_ADDRESS,
      abi: ORGANIZATION_STAKING_ABI,
      functionName: 'depositOrganizationStake',
      args: [parseEther(stakeAmount)]
    });
  };

  const handleAllocateStake = () => {
    allocateStake({
      address: ORGANIZATION_STAKING_ADDRESS,
      abi: ORGANIZATION_STAKING_ABI,
      functionName: 'allocateToJournalist',
      args: [journalistAddress as `0x${string}`, parseEther(allocateAmount)]
    });
  };

  const getStatusBadge = (status: number) => {
    const statuses = ['Pending', 'Verified', 'Suspended', 'Banned'];
    const colors = ['bg-yellow-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500'];
    return <Badge className={colors[status]}>{statuses[status]}</Badge>;
  };

  if (!outletData || !outletData[0]) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Dashboard</CardTitle>
          <CardDescription>Your outlet is not registered yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{outletData[0]}</span>
            {getStatusBadge(outletData[7])}
          </CardTitle>
          <CardDescription>{outletData[1]} • {outletData[3]}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Stake Amount</p>
            <p className="text-2xl font-bold">{outletData[6] ? formatEther(outletData[6]) : '0'} NEWS</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Credibility Score</p>
            <p className="text-2xl font-bold">{outletData[9] ? Number(outletData[9]) / 100 : 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Organization Stake</p>
            <p className="text-2xl font-bold">{totalStake ? formatEther(totalStake as bigint) : '0'} NEWS</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="journalists" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="journalists">Journalists</TabsTrigger>
          <TabsTrigger value="staking">Staking</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="journalists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Journalist</CardTitle>
              <CardDescription>Add journalists to your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="journalistAddr">Journalist Address</Label>
                <Input
                  id="journalistAddr"
                  placeholder="0x..."
                  value={journalistAddress}
                  onChange={(e) => setJournalistAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role/Title</Label>
                <Input
                  id="role"
                  placeholder="Senior Reporter"
                  value={journalistRole}
                  onChange={(e) => setJournalistRole(e.target.value)}
                />
              </div>
              <Button onClick={handleAffiliateJournalist} disabled={isAffiliating}>
                {isAffiliating ? 'Processing...' : 'Add Journalist'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Organization Stake</CardTitle>
              <CardDescription>Stake NEWS tokens to back your journalists</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stakeAmt">Amount (NEWS)</Label>
                <Input
                  id="stakeAmt"
                  type="number"
                  placeholder="1000"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
              </div>
              <Button onClick={handleDepositStake} disabled={isDepositing}>
                {isDepositing ? 'Processing...' : 'Deposit Stake'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allocate to Journalist</CardTitle>
              <CardDescription>Distribute stake to support specific journalists (min 100 NEWS)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allocJournalist">Journalist Address</Label>
                <Input
                  id="allocJournalist"
                  placeholder="0x..."
                  value={journalistAddress}
                  onChange={(e) => setJournalistAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allocAmt">Amount (NEWS)</Label>
                <Input
                  id="allocAmt"
                  type="number"
                  min="100"
                  placeholder="100"
                  value={allocateAmount}
                  onChange={(e) => setAllocateAmount(e.target.value)}
                />
              </div>
              <Button onClick={handleAllocateStake} disabled={isAllocating}>
                {isAllocating ? 'Processing...' : 'Allocate Stake'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Organization Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Website</span>
                  <a href={outletData[4]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {outletData[4]}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Registration Number</span>
                  <span>{outletData[2]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Jurisdiction</span>
                  <span>{outletData[3]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Organization Tier</span>
                  <Badge>{['Bronze', 'Silver', 'Gold', 'Platinum'][outletData[8]]}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
