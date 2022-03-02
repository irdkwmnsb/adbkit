import Chai, { expect } from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import MockConnection from '../../../mock/connection';
import Protocol from '../../../../src/adb/protocol';
import GetPropertiesCommand from '../../../../src/adb/command/host-transport/getproperties';

describe('GetPropertiesCommand', () => {
    it("should send 'getprop'", () => {
        const conn = new MockConnection();
        const cmd = new GetPropertiesCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            return expect(chunk.toString()).to.equal(Protocol.encodeData('shell:getprop').toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            return conn.getSocket().causeEnd();
        });
        return cmd.execute();
    });
    it('should return an empty object for an empty property list', async () => {
        const conn = new MockConnection();
        const cmd = new GetPropertiesCommand(conn);
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            return conn.getSocket().causeEnd();
        });
        const properties = await cmd.execute();
        expect(Object.keys(properties)).to.be.empty;
    });
    return it('should return a map of properties', async () => {
        const conn = new MockConnection();
        const cmd = new GetPropertiesCommand(conn);
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            conn.getSocket().causeRead(`[ro.product.locale.region]: [US]
[ro.product.manufacturer]: [samsung]\r
[ro.product.model]: [SC-04E]
[ro.product.name]: [SC-04E]`);
            return conn.getSocket().causeEnd();
        });
        const properties = await cmd.execute();
        expect(Object.keys(properties)).to.have.length(4);
        expect(properties).to.eql({
            'ro.product.locale.region': 'US',
            'ro.product.manufacturer': 'samsung',
            'ro.product.model': 'SC-04E',
            'ro.product.name': 'SC-04E',
        });
    });
});
