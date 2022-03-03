import Chai, { expect } from 'chai';
import simonChai from 'sinon-chai';
Chai.use(simonChai);
import MockConnection from '../../../mock/connection';
import Protocol from '../../../../src/adb/protocol';
import Command from '../../../../src/adb/command';
import Connection from '../../../../src/adb/connection';

interface CommandConstructor<T extends Command<U>, U> {
    new(connection: Connection): T;
}

/**
 * check under the hood sent data
 */
export function testTr(cmdClass: CommandConstructor<any, any>, expectWrite: string, ...args: string[]) {
    const conn = new MockConnection();
    const cmd = new cmdClass(conn);
    if (expectWrite)
        conn.getSocket().on('write', (chunk) => {
            return expect(chunk.toString()).to.equal(Protocol.encodeData(expectWrite).toString());
        });
    setImmediate(() => {
        conn.getSocket().causeRead(Protocol.OKAY);
        conn.getSocket().causeEnd();
    });
    return cmd.execute(...args);
}

/**
 * check command parser
 */
export async function testPr(cmdClass: CommandConstructor<any, any>, readData?: string | string[]) {
    const conn = new MockConnection();
    const cmd = new cmdClass(conn);
    setImmediate(function () {
        conn.getSocket().causeRead(Protocol.OKAY);
        if (readData) {
            if (typeof readData === 'string' || readData instanceof String) {
                conn.getSocket().causeRead(readData as string);
            } else for (const rd of readData) {
                conn.getSocket().causeRead(rd);
            }
        }
        conn.getSocket().causeEnd();
    });
    const result = await cmd.execute();
    // expect(result).to.eql(parsedData);
    return result;
}
// , parsedData: any
export default function getTester(cmdClass: CommandConstructor<any, any>): {
    testTr: (expectWrite: string, ...args: string[]) => Promise<any>
    testPr: (readData?: string | string[]) => Promise<any>,
} {
    return {
        testTr: testTr.bind(null, cmdClass),
        testPr: testPr.bind(null, cmdClass),
    }
}