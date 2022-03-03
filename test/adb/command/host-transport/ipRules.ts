import Chai, { expect } from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import { IpRuleCommand } from '../../../../src/adb/command/host-transport';
import getTester from './commonTest';

const {testTr, testPr} = getTester(IpRuleCommand);

describe('ipRouteCommand', function () {
    it("should send 'ip rule'", () => testTr('shell:ip rule'));

    it("should send 'ip rule list'", () => testTr('shell:ip rule list', 'list'));

    it('should return a list of rule', async() => {
        const result = await testPr(`0:      from all lookup local 
10000:  from all fwmark 0xc0000/0xd0000 lookup 99 
10500:  from all iif lo oif dummy0 uidrange 0-0 lookup 1003`);
        expect(result).to.have.length(3);
        expect(result[0].toStirng()).to.eq('0:\tfrom all lookup local');
        expect(result[1].toStirng()).to.eq('10000:\tfrom all fwmark 0xc0000/0xd0000 lookup 99');
        expect(result[2].toStirng()).to.eq('10500:\tfrom all iif lo oif dummy0 uidrange 0-0 lookup 1003');
    });
});
