/* Copyright 2021 OADA
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
        default: Infinity,
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
        '/bookmarks/borg/locations/year-index/{{year}}/geohash-index/{{geohash 7}}/data/{{ksuid}}',
    },
    tree: {
      format: Object,
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
      } as object,
    },
  },
});

/**
 * Error if our options are invalid.
 * Warn if extra options found.
 */
config.validate({ allowed: 'warn' });

export default config;
