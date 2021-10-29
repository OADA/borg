/**
 * Copyright (c) 2021 Open Ag Data Alliance
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { Readable } from 'node:stream';
import { createReadStream } from 'node:fs';
import readline from 'node:readline';

import ReadableStreamClone from 'readable-stream-clone';
import debug from 'debug';
import { findBestMatch } from 'string-similarity';
import parse from 'csv-parse';

import type { InputFile } from './index.js';
import config from './config.js';

const warn = debug('oada:borg:warn');

const { delimiter } = config.get('input');

export type Column =
  | string
  | {
      /**
       * Name to find in header
       */
      name: string;
      /**
       * Key name to use for output
       */
      key: string;
    };

/**
 * Try to figure out columns from header?
 *
 * @param columns Keys to find in the header
 * @param header String of the header
 */
export function parseHeader(
  columns: readonly Column[],
  header: string
): string[] {
  // Normalize columns input
  const cols = columns.map((col) =>
    typeof col === 'string' ? { name: col, key: col } : col
  );

  const colnames = header.split(delimiter).map((r) => r.trim());
  /** Map cols to colnames */
  const map: Record<string, string> = {};
  /** Reverse map colnames to cols */
  const rMap: Record<string, string[]> = {};
  // Find most likely match for each column
  for (const col of cols) {
    const {
      bestMatch: { target },
    } = findBestMatch(col.name, colnames);
    map[col.key] = target;
    // eslint-disable-next-line security/detect-object-injection
    rMap[target] = [...(rMap[target] ?? []), col.key];
  }

  // Check for duplicate assignments
  for (const [target, c] of Object.entries(rMap)) {
    if (c.length > 1) {
      // TODO: Find alternate assignments?
      warn('Multiple columns matched field %s: %o', target, c);
    }
  }

  // Check for not found columns
  const missing = cols.filter(({ key }) => !(key in map));
  if (missing.length > 0) {
    throw new Error(`Failed to find fields ${missing} in header ${header}`);
  }

  // Remap colnames
  for (const [col, target] of Object.entries(map)) {
    const ind = colnames.indexOf(target);
    // eslint-disable-next-line security/detect-object-injection
    colnames[ind] = col;
  }
  // TODO: Pretty up "extra" columns?

  return colnames;
}

/**
 * Try to figure out the header line?
 *
 * @param filename Name of file to search for a header
 * @param input
 */
export async function guessHeader(input: Readable) {
  const { comment } = config.get('input');

  const lines = readline.createInterface(input);
  try {
    let header: string;
    let topcomment: string | undefined;
    let startline = 0;
    for await (const line of lines) {
      // Look for comment at top of file
      if (comment.some((c) => line.startsWith(c))) {
        // Remove comment character(s) from line?
        const commentLength = comment
          .filter((c) => line.startsWith(c))
          .map(({ length }) => length)
          // eslint-disable-next-line unicorn/no-array-reduce
          .reduce((a, b) => (b > a ? b : a));
        const text = line.slice(Math.max(0, commentLength));

        // Assume header is last line of top comment block?
        topcomment = topcomment ? `${topcomment}\n${header!}` : header!;
        header = text;
      } else if (startline === 0) {
        // If no top comment block, assume first line is header
        return {
          header: line,
          startline: 1,
        };
      } else {
        break;
      }

      startline++;
    }

    if (!header!) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      throw new Error(`Could not find header for file ${input}`);
    }

    return {
      header: header.trim(),
      startline,
      topcomment,
    };
  } finally {
    lines.close();
  }
}

/**
 * @param cols The columns to look for (e.g., GPS keys)
 * @param file The filename of a CSV file
 * @param filename
 * @param stream
 */
export default async function* generate(
  cols: readonly Column[],
  filename: string,
  stream: Readable = createReadStream(filename)
): AsyncIterable<InputFile> {
  // Clone steam so as to not consume it looking for header?
  const fork1 = new ReadableStreamClone(stream);
  const fork2 = new ReadableStreamClone(stream);

  try {
    const { header, startline, topcomment } = await guessHeader(fork2);
    const columns = parseHeader(cols, header);
    const info = {
      // TODO: Should this be the base name?
      filename,
      /**
       * Inferred column assignments from CSV file
       */
      columns,
      /**
       * Original header line from CSV file
       */
      header,
      /**
       * Line number where data rows start (from 0)
       */
      startline,
      /**
       * Top block comment from CSV file (if any)
       */
      topcomment,
    };

    /**
     * Return object representation of one row at a time
     */
    // eslint-disable-next-line no-inner-declarations
    async function* data() {
      const parser = fork1.pipe(
        parse({
          delimiter,
          trim: true,
          // TODO: Handle comments besides just top comment?
          comment: '',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          skip_lines_with_error: true,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          from_line: startline + 1,
          columns,
        })
      );
      yield* parser;
    }

    yield {
      info,
      data: data(),
    };
  } catch (error: unknown) {
    throw new Error(`Error reading csv file ${filename}: ${error}`);
  } finally {
    fork1.unpipe();
    fork2.unpipe();
  }
}
