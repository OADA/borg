import { timeNormalizer } from './time';

test('normalize time from y/m/d time ', () => {
  const ymdt = '2014/07/06 13:53:50';
  const f = timeNormalizer(ymdt);
  const t = f(ymdt);
  expect(t).toBe(1404669230000);
});

test('normalize time from unix milliseconds', () => {
  const unixms = 1625003407495;
  const f = timeNormalizer(unixms, 2021);
  const t = f(unixms);
  expect(t).toBe(unixms);
});

test('normalize time from unix seconds', () => {
  const unixs = 1625003407.495;
  const f = timeNormalizer(unixs, 2021);
  const t = f(unixs);
  expect(t).toBe(1625003407495);
});

test('normalize time from gps milliseconds', () => {
  const gpsms = 1625003407495;
  const f = timeNormalizer(gpsms, 2031);
  const t = f(gpsms);
  expect(t).toBe(1940968189495);
});

test('normalize time from gps seconds', () => {
  const gpsms = 1625003407.495;
  const f = timeNormalizer(gpsms, 2031);
  const t = f(gpsms);
  expect(t).toBe(1940968189495);
});