/**
 * HTTP Download Utilities
 * Handles downloading files with retry logic and validation
 */

export interface DownloadOptions {
  timeout?: number;
  retries?: number;
  userAgent?: string;
  validatePDF?: boolean;
}

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; DarwinEducation/1.0; +https://darwin.education)';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 3;

/**
 * Download file with retry logic
 */
export async function downloadFile(
  url: string,
  options: DownloadOptions = {}
): Promise<Buffer> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    userAgent = DEFAULT_USER_AGENT,
    validatePDF = true,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `📥 Downloading (attempt ${attempt}/${retries}): ${url.substring(0, 80)}...`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            Accept: 'application/pdf, */*',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText} (${url})`
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate PDF if requested
        if (validatePDF) {
          if (buffer.length < 100) {
            throw new Error(`Downloaded file too small (${buffer.length} bytes)`);
          }

          // Check for PDF magic bytes
          const header = buffer.toString('utf8', 0, 4);
          if (!header.startsWith('%PDF')) {
            throw new Error(
              'Downloaded file is not a valid PDF (magic bytes check failed)'
            );
          }
        }

        console.log(
          `✓ Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`
        );
        return buffer;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        console.warn(`⚠️  Attempt ${attempt} failed: ${lastError.message}`);
        console.log(`⏳ Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw new Error(
    `Failed to download ${url} after ${retries} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Download file with no retries (simple fetch)
 */
export async function downloadFileSimple(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': DEFAULT_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Test if URL is accessible (HEAD request)
 */
export async function urlAccessible(
  url: string,
  options: DownloadOptions = {}
): Promise<boolean> {
  const { timeout = DEFAULT_TIMEOUT, userAgent = DEFAULT_USER_AGENT } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': userAgent,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  } catch {
    return false;
  }
}
