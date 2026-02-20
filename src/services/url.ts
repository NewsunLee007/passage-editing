
/**
 * Fetches content from a URL using the Jina Reader API.
 * Jina Reader converts web pages to Markdown and handles many CORS/scraping issues.
 * @param url The target URL to fetch
 * @returns The extracted content in Markdown format
 */
export async function fetchUrlContent(url: string): Promise<string> {
  if (!url) {
    throw new Error('URL is required');
  }

  // Ensure URL has protocol
  let targetUrl = url;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  // Use Jina Reader API: https://r.jina.ai/<url>
  const jinaUrl = `https://r.jina.ai/${targetUrl}`;
  
  try {
    const response = await fetch(jinaUrl, {
      headers: {
        'X-Target-URL': targetUrl
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText} (${response.status})`);
    }

    const text = await response.text();
    
    // Check if the response looks like an error from Jina or the target
    if (text.includes('Jina Reader') && text.includes('Error')) {
       // heuristic check, but usually Jina returns the content directly
    }

    return text;
  } catch (error) {
    console.error('URL Fetch Error:', error);
    throw new Error('无法读取该网页内容。请检查链接是否有效，或尝试手动复制内容。');
  }
}
