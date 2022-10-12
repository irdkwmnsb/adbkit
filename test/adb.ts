import { expect } from 'chai';
import Adb, { Utils } from '../';
// import Client from '../src/adb/client';
// import { Keycode } from '../src/adb/keycode';

describe('Adb', () => {
    //it('should expose Keycode', (done) => {
    //    expect(Adb).to.have.property('Keycode');
    // expect(Adb.Keycode).to.equal(Keycode);
    //    done();
    //});
    it('should expose utisl', (done) => {
        expect(Adb).to.have.property('util');
        expect(Adb.util).to.equal(Utils);
        done();
    });
    // return describe('@createClient(options)', () => {
    //     it('should return a Client instance', (done) => {
    //         expect(Adb.createClient()).to.be.an.instanceOf(Client);
    //         done();
    //     });
    // });
});
