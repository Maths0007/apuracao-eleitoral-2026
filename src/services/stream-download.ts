import { createWriteStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { validateOfficialUrl } from './official-fetch';

export type DownloadStreamOptions = {
  fetcher?: typeof fetch;
  maxBytes?: number;
  expectedSha512?: string;
  timeoutMs?: number;
};

export type DownloadStreamResult = {
  destinationPath: string;
  bytes: number;
  sha512: string;
  sha256: string;
};

export async function downloadOficialStream(
  urlInput: string,
  destinationPath: string,
  options: DownloadStreamOptions = {}
): Promise<DownloadStreamResult> {
  const url = validateOfficialUrl(urlInput);
  const maxBytes = options.maxBytes ?? 500_000_000;
  const fetcher = options.fetcher ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error('Tempo limite de download TSE excedido')),
    options.timeoutMs ?? 60_000
  );

  try {
    const response = await fetcher(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Download oficial TSE falhou: HTTP ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > maxBytes) {
      throw new Error(`Arquivo oficial TSE excede o limite de ${maxBytes} bytes`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Resposta oficial TSE sem corpo legível em fluxo');

    const fileStream = createWriteStream(destinationPath);
    const hash512 = createHash('sha512');
    const hash256 = createHash('sha256');
    let totalBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.length;
        if (totalBytes > maxBytes) {
          throw new Error(`Download oficial TSE excedeu o limite máximo de ${maxBytes} bytes`);
        }
        hash512.update(value);
        hash256.update(value);
        fileStream.write(value);
      }
    } catch (err) {
      fileStream.destroy();
      await unlink(destinationPath).catch(() => {});
      throw err;
    } finally {
      fileStream.end();
    }

    const calculatedSha512 = hash512.digest('hex');
    const calculatedSha256 = hash256.digest('hex');

    if (
      options.expectedSha512 &&
      options.expectedSha512.trim().toLowerCase() !== calculatedSha512.toLowerCase()
    ) {
      await unlink(destinationPath).catch(() => {});
      throw new Error('Hash SHA-512 oficial divergente do arquivo baixado');
    }

    return {
      destinationPath,
      bytes: totalBytes,
      sha512: calculatedSha512,
      sha256: calculatedSha256,
    };
  } finally {
    clearTimeout(timer);
  }
}
