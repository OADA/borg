/**
 * @license
 * Copyright (c) 2021 Open Ag Data Alliance
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/* eslint-disable unicorn/no-process-exit */
/* eslint-disable no-process-exit */

import type { Readable } from 'node:stream';

import Geohash from 'latlon-geohash';
import Handlebars from 'handlebars';
import KSUID from 'ksuid';
import debug from 'debug';
import fg from 'fast-glob';
import { guess } from 'guess-file-type';
import stringify from 'fast-json-stable-stringify';
import { v5 as uuid } from 'uuid';

import type { Body } from '@oada/client/dist/client';
import { connect } from '@oada/client';

import { guessYear, timeNormalizer } from './time.js';
import config from './config.js';
import csv from './csv.js';
import zip from './zip.js';

const error = debug('oada:borg:error');
const info = debug('oada:borg:info');

const files = config.get('input.files');
const path = Handlebars.compile(config.get('output.path'));
const tree = config.get('output.tree');

// UUID v5 namespace
const ns = '72d0637d-2fab-4e6a-b195-c28b5f4aabcb';

// ? How to handle this?
const gpsColumns = [
  { name: 'gps time', key: 'time' },
  'lat',
  'lon',
  'alt',
  'speed',
  'bearing',
  'accuracy',
];

export interface InputFile<Datum = Record<string, unknown>> {
  info: { filename: string; topcomment?: string } & Record<string, unknown>;
  data: AsyncIterable<Datum>;
}

// ? Where should this logic go...
export async function* open(
  filename: string,
  stream?: Readable
): AsyncIterable<InputFile> {
  try {
    const type = await guess(filename);
    switch (type) {
      case 'text/plain': // Assume plain text is csv?
      case 'text/csv':
        yield* csv(gpsColumns, filename, stream);
        break;
      case 'application/zip':
        yield* zip(filename, stream);
        break;
      default:
        throw new Error(`Unsupported file type ${type}`);
    }
  } catch (error_: unknown) {
    error(error_, `Error reading ${filename}`);
  }
}

interface GpsDatum<T extends string | number | Date = string | number | Date> {
  lat: string;
  lon: string;
  alt: string;
  speed: string;
  bearing: string;
  time: T;
}

// ? Where to have these?
Handlebars.registerHelper(
  'geohash',
  function (this: GpsDatum, length?: number) {
    return Geohash.encode(Number(this.lat), Number(this.lon), length);
  }
);
Handlebars.registerHelper('uuid', function (this: { fileuuid: string }) {
  const { fileuuid, ...rest } = this;
  return uuid(stringify(rest), fileuuid);
});
Handlebars.registerHelper(
  'ksuid',
  function (this: { time: number; fileuuid: string }) {
    const { fileuuid, ...rest } = this;
    const thisUuid = Buffer.alloc(16);
    uuid(stringify(rest), fileuuid, thisUuid);
    return KSUID.fromParts(this.time, thisUuid).string;
  }
);

async function handleFiles(filenames: readonly string[]) {
  const { domain, token } = config.get('oada');
  const conn = await connect({ domain, token });

  // Conn.put({ path, data: {} });

  const stream = fg.stream(Array.from(filenames));
  for await (const filename of stream) {
    const matches = open(filename as string);
    for await (const file of matches) {
      const fileuuid = uuid(stringify(file.info), ns);
      try {
        /*
        Const {
          headers: { 'content-location': loc },
        } = await conn.post({
          path: '/resources',
          data: { _meta: file.info },
        });
        const _id = loc!.substring(1);
        */
        //// await conn.post({ path, data: { _id } });
        let nt: undefined | ((time: string | number | Date) => number);
        const year = guessYear(file.info);
        for await (const datum of file.data as unknown as AsyncIterable<GpsDatum>) {
          nt = nt ?? timeNormalizer(datum.time, year);
          const time = nt(datum.time);
          const context = {
            ...datum,
            time,
            year,
            fileuuid,
          };

          await conn.put({
            tree,
            path: path(context),
            // ContentType: 'application/json',
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            data: {
              ...datum,
              time,
              // TODO: What to call this??
              rawtime: datum.time,
            } as Body,
          });
        }

        info('Finished importing file: %O', file.info);
      } catch (error_: unknown) {
        error(error_, `Error importing file: ${JSON.stringify(file.info)}`);
      }
    }
  }
}

// ? Keep node alive??
setInterval(() => 0, 1000);

await handleFiles(files);

process.exit();
