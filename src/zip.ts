/**
 * @license
 * Copyright (c) 2021 Open Ag Data Alliance
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { Readable } from 'node:stream';

import StreamZip from 'node-stream-zip';

import { InputFile, open } from './index.js';

/**
 * @param file
 * @param stream
 */
export default async function* generate(
  file: string,
  stream?: Readable
): AsyncIterable<InputFile> {
  if (stream) {
    throw new Error('Nested zip archives not supported');
  }

  // eslint-disable-next-line new-cap
  const zip = new StreamZip.async({ file });
  const entries = await zip.entries();
  for (const entry of Object.values(entries)) {
    // eslint-disable-next-line no-await-in-loop
    const entryStream = await zip.stream(entry.name);
    yield* open(entry.name, entryStream as Readable);
  }

  await zip.close();
}
