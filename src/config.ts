/**
 * Copyright (c) 2021 Open Ag Data Alliance
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable sonarjs/no-duplicate-string */

import convict from 'convict';
import { config as load } from 'dotenv';

load();

const config = convict({
  oada: {
    domain: {
      doc: 'OADA API domain',
      format: String,
      default: 'localhost',
      env: 'DOMAIN',
      arg: 'domain',
    },
    token: {
      doc: 'OADA API token',
      format: String,
      default: 'god',
      env: 'TOKEN',
      arg: 'token',
    },
  },
  input: {
    files: {
      format: Array,
      default: [] as readonly string[],
      env: 'FILES',
      arg: 'files',
    },
    years: {
      min: {
        format: Number,
        default: 1970,
      },
      max: {
        format: Number,
        default: Number.POSITIVE_INFINITY,
      },
    },
    delimiter: {
      format: String,
      default: ',',
    },
    comment: {
      format: Array,
      default: ['%', '#'],
    },
  },
  output: {
    path: {
      format: String,
      default:
        '/bookmarks/borg/locations/year-index/{{year}}/geohash-index/{{geohash 7}}/data/{{uuid}}',
    },
    tree: {
      format: Object,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      default: {
        bookmarks: {
          _type: 'application/json',
          borg: {
            _type: 'application/json',
            locations: {
              '_type': 'application/json',
              'year-index': {
                '*': {
                  '_type': 'application/json',
                  'geohash-index': {
                    '*': {
                      _type: 'application/json',
                      data: {
                        '*': {},
                      },
                    },
                  },
                },
              },
            },
          },
        },
      } as Record<string, unknown>,
    },
  },
});

/**
 * Error if our options are invalid.
 * Warn if extra options found.
 */
config.validate({ allowed: 'warn' });

export default config;
