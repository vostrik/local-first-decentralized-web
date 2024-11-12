import { ethers } from 'ethers';

// Configure your provider (Infura, Alchemy, or any Ethereum node provider)
const provider = new ethers.providers.InfuraProvider('mainnet', 'YOUR_INFURA_PROJECT_ID');

// Set up a wallet (make sure to keep the private key secure)
const privateKey = 'YOUR_PRIVATE_KEY';
const wallet = new ethers.Wallet(privateKey, provider);

// Function to pin CID to Ethereum
async function pinCidToEthereum(cid: string) {
  try {
    // Prepare the transaction
    const tx = {
      to: ethers.constants.AddressZero, // Sending to null address since we're only storing data
      value: ethers.utils.parseEther("0.0"), // No ETH is being transferred, only data
      data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(cid)) // Convert CID to hex format
    };

    // Send the transaction
    const transactionResponse = await wallet.sendTransaction(tx);
    console.log(`Transaction sent! Hash: ${transactionResponse.hash}`);

    // Wait for the transaction to be confirmed
    const receipt = await transactionResponse.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
  } catch (error) {
    console.error('Failed to pin CID to Ethereum:', error);
  }
}

// Example usage
const cid = 'QmYwAPJzv5CZsnAzt8auVZRn2BLyPjcVWx8JrKH5kEG7zn'; // Replace with the actual CID
pinCidToEthereum(cid);
