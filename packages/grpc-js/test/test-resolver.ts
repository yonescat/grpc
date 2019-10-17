/*
 * Copyright 2019 gRPC authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

// Allow `any` data type for testing runtime type checking.
// tslint:disable no-any
import * as assert from 'assert';
import * as resolverManager from '../src/resolver';
import { ServiceConfig } from '../src/service-config';
import { StatusObject } from '../src/call-stream';

describe('Name Resolver', function() {
  describe('DNS Names', function() {
    // For some reason DNS queries sometimes take a long time on Windows
    this.timeout(4000);
    before(function() {
      resolverManager.registerAll();
    });
    it('Should resolve localhost properly', function(done) {
      const target = 'localhost:50051';
      const listener: resolverManager.ResolverListener = {
        onSuccessfulResolution: (
          addressList: string[],
          serviceConfig: ServiceConfig | null,
          serviceConfigError: StatusObject | null
        ) => {
          assert(addressList.includes('127.0.0.1:50051'));
          // We would check for the IPv6 address but it needs to be omitted on some Node versions
          done();
        },
        onError: (error: StatusObject) => {
          done(new Error(`Failed with status ${error.details}`));
        },
      };
      const resolver = resolverManager.createResolver(target, listener);
      resolver.updateResolution();
    });
    it('Should default to port 443', function(done) {
      const target = 'localhost';
      const listener: resolverManager.ResolverListener = {
        onSuccessfulResolution: (
          addressList: string[],
          serviceConfig: ServiceConfig | null,
          serviceConfigError: StatusObject | null
        ) => {
          assert(addressList.includes('127.0.0.1:443'));
          // We would check for the IPv6 address but it needs to be omitted on some Node versions
          done();
        },
        onError: (error: StatusObject) => {
          done(new Error(`Failed with status ${error.details}`));
        },
      };
      const resolver = resolverManager.createResolver(target, listener);
      resolver.updateResolution();
    });
    it('Should resolve a public address', function(done) {
      const target = 'example.com';
      const listener: resolverManager.ResolverListener = {
        onSuccessfulResolution: (
          addressList: string[],
          serviceConfig: ServiceConfig | null,
          serviceConfigError: StatusObject | null
        ) => {
          assert(addressList.length > 0);
          done();
        },
        onError: (error: StatusObject) => {
          done(new Error(`Failed with status ${error.details}`));
        },
      };
      const resolver = resolverManager.createResolver(target, listener);
      resolver.updateResolution();
    });
    it('Should resolve a name with multiple dots', function(done) {
      const target = 'loopback4.unittest.grpc.io';
      const listener: resolverManager.ResolverListener = {
        onSuccessfulResolution: (
          addressList: string[],
          serviceConfig: ServiceConfig | null,
          serviceConfigError: StatusObject | null
        ) => {
          assert(addressList.length > 0);
          done();
        },
        onError: (error: StatusObject) => {
          done(new Error(`Failed with status ${error.details}`));
        },
      };
      const resolver = resolverManager.createResolver(target, listener);
      resolver.updateResolution();
    });
    it('Should resolve a name with a hyphen', function(done) {
      /* TODO(murgatroid99): Find or create a better domain name to test this with.
       * This is just the first one I found with a hyphen. */
      const target = 'network-tools.com';
      const listener: resolverManager.ResolverListener = {
        onSuccessfulResolution: (
          addressList: string[],
          serviceConfig: ServiceConfig | null,
          serviceConfigError: StatusObject | null
        ) => {
          assert(addressList.length > 0);
          done();
        },
        onError: (error: StatusObject) => {
          done(new Error(`Failed with status ${error.details}`));
        },
      };
      const resolver = resolverManager.createResolver(target, listener);
      resolver.updateResolution();
    });
    it('Should resolve gRPC interop servers', function(done) {
      let completeCount = 0;
      function done2(error?: Error) {
        if (error) {
          done(error);
        } else {
          completeCount += 1;
          if (completeCount === 2) {
            done();
          }
        }
      }
      const target1 = 'grpc-test.sandbox.googleapis.com';
      const target2 = 'grpc-test4.sandbox.googleapis.com';
      const listener: resolverManager.ResolverListener = {
        onSuccessfulResolution: (
          addressList: string[],
          serviceConfig: ServiceConfig | null,
          serviceConfigError: StatusObject | null
        ) => {
          assert(addressList.length > 0);
          done2();
        },
        onError: (error: StatusObject) => {
          done2(new Error(`Failed with status ${error.details}`));
        },
      };
      const resolver1 = resolverManager.createResolver(target1, listener);
      resolver1.updateResolution();
      const resolver2 = resolverManager.createResolver(target1, listener);
      resolver2.updateResolution();
    })
  });
  describe('UDS Names', function() {
    it('Should handle a relative Unix Domain Socket name', done => {
      const target = 'unix:socket';
      const listener: resolverManager.ResolverListener = {
        onSuccessfulResolution: (
          addressList: string[],
          serviceConfig: ServiceConfig | null,
          serviceConfigError: StatusObject | null
        ) => {
          assert(addressList.includes('socket'));
          done();
        },
        onError: (error: StatusObject) => {
          done(new Error(`Failed with status ${error.details}`));
        },
      };
      const resolver = resolverManager.createResolver(target, listener);
      resolver.updateResolution();
    });
    it('Should handle an absolute Unix Domain Socket name', done => {
      const target = 'unix:///tmp/socket';
      const listener: resolverManager.ResolverListener = {
        onSuccessfulResolution: (
          addressList: string[],
          serviceConfig: ServiceConfig | null,
          serviceConfigError: StatusObject | null
        ) => {
          assert(addressList.includes('/tmp/socket'));
          done();
        },
        onError: (error: StatusObject) => {
          done(new Error(`Failed with status ${error.details}`));
        },
      };
      const resolver = resolverManager.createResolver(target, listener);
      resolver.updateResolution();
    });
  });
});
