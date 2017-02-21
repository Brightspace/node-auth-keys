'use strict';

const assert = require('assert');
const sinon = require('sinon');
require('sinon-as-promised');

const PublicKeyNotFoundError = require('../errors/public-key-not-found');

const DummyPublicKeyStore = require('./dummy-public-key-store');

const dummyPublicKeyStore = new DummyPublicKeyStore();

describe('AbstractPublicKeyStore', () => {
	let sandbox;

	beforeEach(() => sandbox = sinon.sandbox.create());
	afterEach(() => sandbox.restore());

	describe('lookupPublicKeys', () => {
		it('should return all public keys returned from the implementation, transforming old format', () => {
			sandbox
				.stub(dummyPublicKeyStore, '_lookupPublicKeys')
				.resolves([
					JSON.stringify({
						n: 'some-n-1',
						e: 'some-e-1',
						kid: '123',
						kty: 'RSA',
						use: 'sig',
						exp: 123,
						alg: 'RS256'
					}),
					JSON.stringify({
						n: 'some-n-2',
						e: 'some-e-2',
						kid: '456',
						pem: 'some-pem-2'
					}),
					JSON.stringify({
						x: 'some-x-1',
						y: 'some-y-1',
						kid: '789',
						kty: 'EC',
						crv: 'P-384',
						use: 'sig',
						exp: 456,
						alg: 'ES384'
					})
				]);

			return dummyPublicKeyStore
				.lookupPublicKeys()
				.then(res => assert.deepStrictEqual(res, [{
					n: 'some-n-1',
					e: 'some-e-1',
					use: 'sig',
					kty: 'RSA',
					kid: '123',
					exp: 123,
					alg: 'RS256'
				}, {
					n: 'some-n-2',
					e: 'some-e-2',
					use: 'sig',
					kty: 'RSA',
					kid: '456',
					alg: 'RS256'
					// unfortunately can't infer exp
				}, {
					x: 'some-x-1',
					y: 'some-y-1',
					kid: '789',
					use: 'sig',
					kty: 'EC',
					crv: 'P-384',
					exp: 456,
					alg: 'ES384'
				}]), () => assert(false));
		});

		it('should return an empty array if implementation doesn\'t return array', () => {
			sandbox
				.stub(dummyPublicKeyStore, '_lookupPublicKeys')
				.resolves('foo');

			return dummyPublicKeyStore
				.lookupPublicKeys()
				.then(
					res => assert.deepStrictEqual(res, []),
					() => assert(false)
				);
		});
	});

	describe('lookupPublicKey', () => {
		it('should resolve matching key if it exists', () => {
			sandbox
				.stub(dummyPublicKeyStore, 'lookupPublicKeys')
				.resolves([{
					kid: 123
				}, {
					kid: 456
				}, {
					kid: 789
				}]);

			return dummyPublicKeyStore
				.lookupPublicKey(456)
				.then(
					res => assert.deepStrictEqual(res, { kid: 456 }),
					() => assert(false)
				);
		});

		it('should reject with PublicKeyNotFoundError if matching key is not found', () => {
			sandbox
				.stub(dummyPublicKeyStore, 'lookupPublicKeys')
				.resolves([{
					kid: 123
				}, {
					kid: 789
				}]);

			return dummyPublicKeyStore
				.lookupPublicKey(456)
				.then(
					() => assert(false),
					err => {
						assert(err instanceof PublicKeyNotFoundError);
						assert.strictEqual(err.kid, 456);
					}
				);
		});
	});
});