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
export function testTansport(cmdClass: CommandConstructor<any, any>, expectWrite: string, ...args: string[]) {
    const conn = new MockConnection();
    const cmd = new cmdClass(conn);
    conn.getSocket().on('write', (chunk) => {
        return expect(chunk.toString()).to.equal(Protocol.encodeData(expectWrite).toString());
    });
    setImmediate(() => {
        conn.getSocket().causeRead(Protocol.OKAY);
        return conn.getSocket().causeEnd();
    });
    return cmd.execute(...args);
}

/**
 * check command parser
 */
export async function testParser(cmdClass: CommandConstructor<any, any>, readData: string, parsedData: any) {
    const conn = new MockConnection();
    const cmd = new cmdClass(conn);
    setImmediate(function () {
        conn.getSocket().causeRead(Protocol.OKAY);
        conn.getSocket().causeRead(readData);
        return conn.getSocket().causeEnd();
    });
    const result = await cmd.execute();
    expect(result).to.eql(parsedData);
}

export default function getTester(cmdClass: CommandConstructor<any, any>): {
    testTr: (expectWrite: string, ...args: string[]) => Promise<void>
    testPr: (readData: string, parsedData: any) => Promise<void>,
} {
    return {
        testTr: testTansport.bind(null, cmdClass),
        testPr: testParser.bind(null, cmdClass),
    }
}