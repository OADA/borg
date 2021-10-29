/**
 * Copyright (c) 2021 Open Ag Data Alliance
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/* eslint-disable unicorn/prefer-module */

import { resolve } from 'node:path';
import { createReadStream } from 'node:fs';

import { guessHeader, parseHeader } from './csv';

const ygzHeader =
  'Time, GPS time, lat, lon, altitude, speed, bearing, accuracy';
const yangHeader =
  'ids,gpsTimeAsUnixTimeInS,lats,lons,alts,speedsInMps,bearings,accuracies';

test('guess ygz header', async () => {
  const yqzSample = resolve(__dirname, '..', 'test', 'ygz_sample.txt');
  const { header, startline, topcomment } = await guessHeader(
    createReadStream(yqzSample)
  );
  expect(header).toEqual(ygzHeader);
  expect(startline).toBe(2);
  expect(topcomment).toBe(' Combine p and e 6088: gps_2014_07_06_13_53_40.txt');
});

test('guess yang header', async () => {
  const yangSample = resolve(__dirname, '..', 'test', 'yang_sample.csv');
  const { header, startline, topcomment } = await guessHeader(
    createReadStream(yangSample)
  );
  expect(header).toEqual(yangHeader);
  expect(startline).toBe(1);
  expect(topcomment).toBeUndefined();
});

const gpsColumns = [
  { name: 'gps time', key: 'time' },
  'lat',
  'lon',
  'alt',
  'speed',
  'bearing',
  'accuracy',
];

test('parse yqz header', () => {
  const columns = parseHeader(gpsColumns, ygzHeader);
  expect(columns).toEqual([
    'Time',
    'time',
    'lat',
    'lon',
    'alt',
    'speed',
    'bearing',
    'accuracy',
  ]);
});

test('parse yang header', () => {
  const columns = parseHeader(gpsColumns, yangHeader);
  expect(columns).toEqual([
    'ids',
    'time',
    'lat',
    'lon',
    'alt',
    'speed',
    'bearing',
    'accuracy',
  ]);
});
