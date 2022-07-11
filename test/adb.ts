import { expect } from 'chai';
import Adb from '../src/index';
import Client from '../src/adb/client';
// import { Keycode } from '../src/adb/keycode';
import util from '../src/adb/util';

describe('Adb', () => {
    //it('should expose Keycode', (done) => {
    //    expect(Adb).to.have.property('Keycode');
        // expect(Adb.Keycode).to.equal(Keycode);
    //    done();
    //});
    it('should expose util', (done) => {
        expect(Adb).to.have.property('util');
        expect(Adb.util).to.equal(util);
        done();
    });
    return describe('@createClient(options)', () => {
        it('should return a Client instance', (done) => {
            expect(Adb.createClient()).to.be.an.instanceOf(Client);
            done();
        });
    });
});
