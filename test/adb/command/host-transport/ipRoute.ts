import Chai, { expect } from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import { IpRouteCommand } from '../../../../src/adb/command/host-transport';
import { testParser, testTansport } from './commonTest';


describe('ipRouteCommand', function () {
    it("should send 'ip route'", function () {
        return testTansport(IpRouteCommand, 'shell:ip route');
    });

    it("should send 'ip route list table all'", function () {
        return testTansport(IpRouteCommand, 'shell:ip route list table all', ['list table all']);
    });

    it("should send 'ip route list table all' split", function () {
        return testTansport(IpRouteCommand,
            'shell:ip route list table all',
            ['list', 'table', 'all']);
    });

    it('should return a list of routes', (): Promise<void> => {
        return testParser(IpRouteCommand,
            `192.168.1.0/24 dev wlan0 proto kernel scope link src 192.168.1.2\n`,
            [{ dest: '192.168.1.0/24', dev: 'wlan0', proto: 'kernel', scope: 'link', src: '192.168.1.2' }],
        )
    });

    it('should return convert number string to numbers', async (): Promise<void> => {
        return testParser(IpRouteCommand,
            `fe80::/64 dev wlan0 table 1021 proto kernel metric 256 pref medium\n`,
            [{ dest: 'fe80::/64', dev: 'wlan0', table: 1021, proto: 'kernel', metric: 256, pref: 'medium' }]
        )
    });
});
