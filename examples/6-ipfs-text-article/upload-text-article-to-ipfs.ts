import { create } from 'ipfs-http-client';

// Connect to the IPFS client (e.g., Infura's public IPFS node)
const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

async function uploadTextArticleToIPFS(title: string, content: string) {
  try {
    // Create an HTML document
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body>
        <article>
          <h1>${title}</h1>
          <p>${content}</p>
        </article>
      </body>
      </html>
    `;

    // Upload the HTML content to IPFS
    const result = await ipfs.add(htmlContent);
    const ipfsCid = result.cid.toString();

    // Access the article via Cloudflare's IPFS gateway
    const cloudflareUrl = `https://cloudflare-ipfs.com/ipfs/${ipfsCid}`;
    console.log(`Access your article as a website at: ${cloudflareUrl}`);
  } catch (error) {
    console.error('Failed to upload article to IPFS:', error);
  }
}

// Example usage
const articleTitle = 'My Article Title';
const articleContent = 'This is the content of my article. It’s now stored on IPFS!';
uploadTextArticleToIPFS(articleTitle, articleContent);
