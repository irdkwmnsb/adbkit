import { EOL } from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

function convert(data: string) {
  data = data.replace(/ \[default = \d+\]/g, '');
  data = data.replace(/message (\w+) /g, 'export interface $1 ');
  data = data.replace(/enum (\w+) /g, 'export enum $1 ');
  data = data.replace(/ bytes /g, ' Uint8Array ');
  data = data.replace(/ bool /g, ' boolean ');
  data = data.replace(/\s(uint32|bytes|double|int32|float)\s/g, ' number ');
  data = data.replace(/ {2}=/g, ' =');
  data = data.replace(/optional (\w+) (\w+) = \d+;/g, '$2?: $1;');
  data = data.replace(/required (\w+) (\w+) = \d+;/g, '$2: $1;');
  data = data.replace(/repeated (\w+) (\w+) = \d+;/g, '$2: $1[];');
  // enum
  data = data.replace(/\s{2,}([a-zA-Z_]+)\s+=\s+(\d+);/g, `${EOL}  $1 = $2,`);

  data = data.replace(/syntax = "proto2";[\r\n]+/g, '');
  data = data.replace(/package jp.co.cyberagent.stf.proto;[\r\n]+/g, '');
  data = data.replace(/option java_outer_classname = "Wire";[\r\n]+/g, '');
  data = data.replace(/export interface (\w+) \{([\r\n]+)\}/gm, '// eslint-disable-next-line @typescript-eslint/no-empty-interface$2export interface $1 {}');
  //data = data.replace(/export interface (\w+)/g, '// cCCCCeslint-disable-next-line @typescript-eslint/no-empty-interface$2export interface $1 {}');
  //  repeated string properties = 1;
  // optional uint32 id = 1;
  return data;
}

function main() {
  {
    const fn = path.resolve(__dirname, '..', 'bin', 'wireService.proto');
    const dest = path.resolve(__dirname, '..', 'src', 'adb', 'thirdparty', 'STFService', 'STFServiceModel.ts');
    let data = fs.readFileSync(fn, { encoding: 'utf8' });
    data = convert(data);
    fs.writeFileSync(dest, `// generarted by genProto.ts${EOL}` + data, { encoding: 'utf8' });
  }

  {
    const fn = path.resolve(__dirname, '..', 'bin', 'wireAgent.proto');
    const dest = path.resolve(__dirname, '..', 'src', 'adb', 'thirdparty', 'STFService', 'STFAgentModel.ts');
    let data = fs.readFileSync(fn, { encoding: 'utf8' });
    data = convert(data);
    fs.writeFileSync(dest, `// generarted by genProto.ts${EOL}` + data, { encoding: 'utf8' });
  }

}

void main();