import { create } from 'ipfs-http-client';
import fs from 'fs';
import path from 'path';

// Connect to the IPFS client
const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

async function uploadNpmPackageToIPFS(packagePath: string) {
  try {
    // Read the package file
    const packageFile = fs.readFileSync(packagePath);
    const packageName = path.basename(packagePath);

    // Upload the package file to IPFS
    const result = await ipfs.add({ path: packageName, content: packageFile });

    // Retrieve the CID for Cloudflare's gateway
    const ipfsCid = result.cid.toString();
    console.log(`Uploaded to IPFS with CID: ${ipfsCid}`);

    // Access the package via Cloudflare's IPFS gateway
    const cloudflareUrl = `https://cloudflare-ipfs.com/ipfs/${ipfsCid}`;
    console.log(`Access your package at: ${cloudflareUrl}`);
  } catch (error) {
    console.error('Failed to upload NPM package to IPFS:', error);
  }
}

// Replace with your package tarball file path
const packagePath = './your-package.tgz';
uploadNpmPackageToIPFS(packagePath);
