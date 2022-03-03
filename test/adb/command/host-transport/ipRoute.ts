import Chai, { expect } from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import MockConnection from '../../../mock/connection';
import Protocol from '../../../../src/adb/protocol';
import { IpRouteCommand } from '../../../../src/adb/command/host-transport';
import { IpRouteEntry } from '../../../../src/adb/command/host-transport/ipRoute';

describe('ipRouteCommand', function () {
    it("should send 'ip route'", function () {
        const conn = new MockConnection();
        const cmd = new IpRouteCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            return expect(chunk.toString()).to.equal(Protocol.encodeData('shell:ip route').toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            return conn.getSocket().causeEnd();
        });
        return cmd.execute();
    });

    it("should send 'ip route list table all'", function () {
        const conn = new MockConnection();
        const cmd = new IpRouteCommand(conn);
        conn.getSocket().on('write', (chunk) => {
            return expect(chunk.toString()).to.equal(Protocol.encodeData('shell:ip route list table all').toString());
        });
        setImmediate(() => {
            conn.getSocket().causeRead(Protocol.OKAY);
            return conn.getSocket().causeEnd();
        });
        return cmd.execute('list table all');
    });

    it('should return a list of routes', async (): Promise<void> => {
        const conn = new MockConnection();
        const cmd = new IpRouteCommand(conn);
        setImmediate(function () {
            conn.getSocket().causeRead(Protocol.OKAY);
            conn.getSocket().causeRead(`192.168.1.0/24 dev wlan0 proto kernel scope link src 192.168.1.2\n`);
            return conn.getSocket().causeEnd();
        });
        const routeList: Partial<IpRouteEntry>[] = await cmd.execute();
        expect(routeList).to.eql([
            { dest: '192.168.1.0/24', dev: 'wlan0', proto: 'kernel', scope: 'link', src: '192.168.1.2' },
        ]);
    });

    it('should return convert number string to numbers', async (): Promise<void> => {
        const conn = new MockConnection();
        const cmd = new IpRouteCommand(conn);
        setImmediate(function () {
            conn.getSocket().causeRead(Protocol.OKAY);
            conn.getSocket().causeRead(`fe80::/64 dev wlan0 table 1021 proto kernel metric 256 pref medium\n`);
            return conn.getSocket().causeEnd();
        });
        const routeList: Partial<IpRouteEntry>[] = await cmd.execute();
        expect(routeList).to.eql([
            { dest: 'fe80::/64', dev: 'wlan0', table: 1021, proto: 'kernel', metric: 256, pref: 'medium' },
        ]);
    });
});
