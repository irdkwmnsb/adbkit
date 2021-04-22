import https from 'https';
// import strip from 'strip-comments';
// import { parse, BaseJavaCstVisitor, LambdaExpressionCtx, BaseJavaCstVisitorWithDefaults } from "java-parser";

function getData(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data: Buffer[] = [];
            // const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
            // console.log('Status Code:', res.statusCode);
            // console.log('Date in Response header:', headerDate);
            if (res.statusCode !== 200) {
                reject(Error('Status Code:' + res.statusCode));
                return;
            }

            res.on('data', chunk => {
                data.push(chunk);
            });

            res.on('end', () => {
                // console.log('Response ended: ');
                resolve(Buffer.concat(data));
            });
        }).on('error', err => {
            console.log('Error: ', err.message);
            reject(err);
        });
    })
}
// https://android.googlesource.com/platform/frameworks/base/+/android-11.0.0_r35/core/java/android/security/keymaster/IKeyAttestationApplicationIdProvider.aidl?format=TEXT
// https://android.googlesource.com/platform/frameworks/base/+/android-11.0.0_r35/telephony/java/android/hardware/fingerprint/IFingerprintService.aidl?format=TEXT

async function getAllTags(): Promise<string[]> {
    const data = await getData('https://android.googlesource.com/platform/frameworks/base/+refs/tags/?format=text');
    const asText = data.toString('ascii');
    const TAGS = /refs\/tags\/(android-[0-9_r.]+)\^\{\}/gm;
    const tags: string[] = [];
    for (; ;) {
        const match = TAGS.exec(asText);
        if (!match)
            break;
        tags.push(match[1]);
    }
    return tags;
}

async function getAidl(tag: string, pkgName: string) {
    const pkg = pkgName.replace(/\./g, '/');
    let data: Buffer | null = null;
    try {
        const url = `https://android.googlesource.com/platform/frameworks/base/+/${tag}/core/java/${pkg}.aidl?format=TEXT`;
        // console.log(url);
        data = await getData(url);
    } catch (e) {
        // console.log(e);
        return;
    }
    //console.log(data);
    const asBase64 = data.toString('ascii');
    const javaCode = Buffer.from(asBase64, 'base64').toString('ascii');
    console.log(javaCode);

    
    // const cst = parse(javaCode)
    //const lambdaArrowsCollector = new LambdaArrowsPositionCollector();
    // The CST result from the previous code snippet
    //lambdaArrowsCollector.visit(cst);
    return;
    //const striped = strip(code).replace(/^\s+$/gm, '');
    //console.log(`${pkgName} tag: ${tag} exists, len:${striped.length}`);
    //console.log(striped);
    //console.log('resp', );
}

async function main() {
    const tags = await getAllTags();
    for (const tag of tags) {
        await getAidl(tag, 'android.hardware.display.IDisplayManager')
        // await getAidl(tag, 'android.security.keymaster.IKeyAttestationApplicationIdProvider')
        // 
    }
}

main();