/**
 * Copyright (c) 2021 Open Ag Data Alliance
 * 
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { resolve } from 'path';
import { createReadStream } from 'fs';

import { guessHeader, parseHeader } from './csv';

const ygzheader =
  'Time, GPS time, lat, lon, altitude, speed, bearing, accuracy';
const yangheader =
  'ids,gpsTimeAsUnixTimeInS,lats,lons,alts,speedsInMps,bearings,accuracies';

test('guess ygz header', async () => {
  const yqzsample = resolve(__dirname, '..', 'test', 'ygz_sample.txt');
  const { header, startline, topcomment } = await guessHeader(
    createReadStream(yqzsample)
  );
  expect(header).toEqual(ygzheader);
  expect(startline).toEqual(2);
  expect(topcomment).toEqual(
    ' Combine p and e 6088: gps_2014_07_06_13_53_40.txt'
  );
});

test('guess yang header', async () => {
  const yangsample = resolve(__dirname, '..', 'test', 'yang_sample.csv');
  const { header, startline, topcomment } = await guessHeader(
    createReadStream(yangsample)
  );
  expect(header).toEqual(yangheader);
  expect(startline).toEqual(1);
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
  const columns = parseHeader(gpsColumns, ygzheader);
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
  const columns = parseHeader(gpsColumns, yangheader);
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
