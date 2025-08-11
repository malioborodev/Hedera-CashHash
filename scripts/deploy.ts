import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Deploying contracts to Hedera...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy CashHashInvoice contract
  const CashHashInvoice = await ethers.getContractFactory('CashHashInvoice');
  const cashHashInvoice = await CashHashInvoice.deploy(
    process.env.PLATFORM_WALLET || deployer.address,
    process.env.PLATFORM_FEE_BPS || 75
  );
  await cashHashInvoice.waitForDeployment();
  const invoiceAddress = await cashHashInvoice.getAddress();
  console.log('CashHashInvoice deployed to:', invoiceAddress);

  // Deploy CashHashBondEscrow contract
  const CashHashBondEscrow = await ethers.getContractFactory('CashHashBondEscrow');
  const cashHashBondEscrow = await CashHashBondEscrow.deploy(
    invoiceAddress,
    process.env.PLATFORM_WALLET || deployer.address,
    process.env.PLATFORM_FEE_BPS || 75
  );
  await cashHashBondEscrow.waitForDeployment();
  const escrowAddress = await cashHashBondEscrow.getAddress();
  console.log('CashHashBondEscrow deployed to:', escrowAddress);

  // Deploy CashHashPayout contract
  const CashHashPayout = await ethers.getContractFactory('CashHashPayout');
  const cashHashPayout = await CashHashPayout.deploy(
    process.env.INVOICE_TOKEN_ADDRESS || ethers.ZeroAddress,
    process.env.PLATFORM_WALLET || deployer.address
  );
  await cashHashPayout.waitForDeployment();
  const payoutAddress = await cashHashPayout.getAddress();
  console.log('CashHashPayout deployed to:', payoutAddress);

  // Set up contract relationships
  console.log('Setting up contract relationships...');
  
  // Set escrow contract in invoice contract
  await cashHashInvoice.setBondEscrow(escrowAddress);
  console.log('Bond escrow set in invoice contract');

  // Save deployment addresses to .env.local
  const deploymentInfo = `
# Contract Deployment Addresses
NEXT_PUBLIC_INVOICE_CONTRACT_ADDRESS=${invoiceAddress}
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=${escrowAddress}
NEXT_PUBLIC_PAYOUT_CONTRACT_ADDRESS=${payoutAddress}
  `;

  console.log('Deployment completed!');
  console.log('Add these to your .env.local file:');
  console.log(deploymentInfo);

  // Write to deployment file
  const fs = require('fs');
  fs.writeFileSync(
    './deployment.json',
    JSON.stringify(
      {
        invoiceContract: invoiceAddress,
        escrowContract: escrowAddress,
        payoutContract: payoutAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString()
      },
      null,
      2
    )
  );

  console.log('Deployment addresses saved to deployment.json');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});