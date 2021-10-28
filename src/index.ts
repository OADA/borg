import type { Readable } from 'stream';

import { guess } from 'guess-file-type';
import Geohash from 'latlon-geohash';
import Handlebars from 'handlebars';
import stringify from 'fast-json-stable-stringify';
import { v5 as uuid } from 'uuid';
import KSUID from 'ksuid';
import fg from 'fast-glob';
import debug from 'debug';

import { connect } from '@oada/client';

import csv from './csv';
import zip from './zip';
import { guessYear, timeNormalizer } from './time';
import config from './config';

const fatal = debug('oada:borg:fatal');
const error = debug('oada:borg:error');
const info = debug('oada:borg:info');

const files = config.get('input.files');
const path = Handlebars.compile(config.get('output.path'));
const tree = config.get('output.tree');

// UUID v5 namespace
const ns = '72d0637d-2fab-4e6a-b195-c28b5f4aabcb';

// TODO: How to handle this?
const gpsColumns = [
  { name: 'gps time', key: 'time' },
  'lat',
  'lon',
  'alt',
  'speed',
  'bearing',
  'accuracy',
];

export interface InputFile<Datum = {}> {
  info: {};
  data: AsyncIterable<Datum>;
}

// TODO: Where should this logic go...
export async function* open(
  filename: string,
  stream?: Readable
): AsyncIterable<InputFile> {
  try {
    const type = await guess(filename);
    switch (type) {
      case 'text/plain':
      // Assume plain text is csv?
      case 'text/csv':
        yield* csv(gpsColumns, filename, stream);
        break;
      case 'application/zip':
        yield* zip(filename, stream);
        break;
      default:
        throw new Error(`Unsupported file type ${type}`);
    }
  } catch (err) {
    error(`Error reading ${filename}: ${err}`);
  }
}

interface GPSDatum<T extends string | number | Date = string | number | Date> {
  lat: string;
  lon: string;
  alt: string;
  speed: string;
  bearing: string;
  time: T;
}

// TODO: Where to have these?
Handlebars.registerHelper('geohash', function geohash(length?: number) {
  // @ts-ignore
  return Geohash.encode(+this.lat, +this.lon, length);
});
Handlebars.registerHelper('uuid', function () {
  // @ts-ignore
  const { fileuuid, ...rest } = this;
  return uuid(stringify(rest), fileuuid);
});
Handlebars.registerHelper('ksuid', function () {
  // @ts-ignore
  const { fileuuid, ...rest } = this;
  const thisuuid = Buffer.alloc(16);
  uuid(stringify(rest), fileuuid, thisuuid);
  // @ts-ignore
  return KSUID.fromParts(this.time, thisuuid).string;
});

async function handleFiles(filenames: readonly string[]) {
  const { domain, token } = config.get('oada');
  const conn = await connect({ domain, token });

  //conn.put({ path, data: {} });

  const stream = fg.stream([...filenames]);
  for await (const filename of stream) {
    const files = open(filename as string);
    for await (const file of files) {
      const fileuuid = uuid(stringify(file.info), ns);
      try {
        /*
        const {
          headers: { 'content-location': loc },
        } = await conn.post({
          path: '/resources',
          data: { _meta: file.info },
        });
        const _id = loc!.substring(1);
        */
        //await conn.post({ path, data: { _id } });
        let nt: undefined | ((time: string | number | Date) => number);
        // @ts-ignore
        const year = guessYear(file.info);
        for await (const datum of file.data as AsyncIterable<GPSDatum>) {
          nt = nt ?? timeNormalizer(datum.time, year);
          const time = nt(datum.time);
          const ctx = {
            ...datum,
            time,
            year,
            fileuuid,
          };

          await conn.put({
            tree,
            path: path(ctx),
            //contentType: 'application/json',
            data: {
              ...datum,
              time,
              // TODO: What to call this??
              rawtime: datum.time,
            } as any,
          });
        }
        info('Finished importing file: %O', file.info);
      } catch (err) {
        error('Error importing file: %O %O', file.info, err);
      }
    }
  }

  // TODO: Find what is not being closed or something
  process.exit();
}

handleFiles(files).catch((err) => {
  fatal(err);
  process.exit(1);
});
