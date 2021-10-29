/**
 * Copyright (c) 2021 Open Ag Data Alliance
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { timeNormalizer } from './time';

test('normalize time from y/m/d time', () => {
  const ymdt = '2014/07/06 13:53:50';
  const f = timeNormalizer(ymdt);
  const t = f(ymdt);
  expect(t).toBe(1_404_669_230_000);
});

test('normalize time from unix milliseconds', () => {
  const unixms = 1_625_003_407_495;
  const f = timeNormalizer(unixms, 2021);
  const t = f(unixms);
  expect(t).toBe(unixms);
});

test('normalize time from unix seconds', () => {
  const unixs = 1_625_003_407.495;
  const f = timeNormalizer(unixs, 2021);
  const t = f(unixs);
  expect(t).toBe(1_625_003_407_495);
});

test('normalize time from gps milliseconds', () => {
  const gpsms = 1_625_003_407_495;
  const f = timeNormalizer(gpsms, 2031);
  const t = f(gpsms);
  expect(t).toBe(1_940_968_189_495);
});

test('normalize time from gps seconds', () => {
  const gpsms = 1_625_003_407.495;
  const f = timeNormalizer(gpsms, 2031);
  const t = f(gpsms);
  expect(t).toBe(1_940_968_189_495);
});
