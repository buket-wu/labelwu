// const fs = require('fs')

// let lbAnnotation = require('../packages/lb-annotation/package.json')
// let lbComponents = require('../packages/lb-components/package.json')
// let lbUtils = require('../packages/lb-utils/package.json')
//
// let demoPath = "./packages/lb-demo/package.json"
// let lbDemo = require('../packages/lb-demo/package.json')
//
// if (lbDemo["dependencies"]["@labelwu/lb-annotation"] == lbAnnotation["version"] && lbDemo["dependencies"]["@labelwu/lb-components"] == lbComponents["version"] && lbDemo["dependencies"]["@labelwu/lb-utils"] == lbUtils["version"]) {
//     console.log("upgrade success; ver not change")
//     process.exit(0)
// }
//
// lbDemo["dependencies"]["@labelwu/lb-annotation"] = lbAnnotation["version"]
// lbDemo["dependencies"]["@labelwu/lb-components"] = lbComponents["version"]
// lbDemo["dependencies"]["@labelwu/lb-utils"] = lbUtils["version"]

// fs.writeFile(demoPath, JSON.stringify(lbDemo, null, "  "), function (err) {
//     if (err) {
//         console.log("upgrade fail", err)
//     } else {
//         console.log("upgrade success")
//     }
// })


const gitHelper = async function () {
    // await exec('git add packages/lb-demo/package.json', (error) => {
    //     if (error) {
    //         console.error(`执行出错: ${error}`);
    //         return;
    //     }
    // });
    //
    // await exec('git commit -m \"feat(ci): upgrade lb-demo dependence version\"', (error) => {
    //     if (error) {
    //         console.error(`执行出错: ${error}`);
    //         return;
    //     }
    // });

    // let branch = process.env.INPUT_BRANCH;
    const repository = trim(process.env.INPUT_REPOSITORY || process.env.GITHUB_REPOSITORY);
    const github_url_protocol = trim(process.env.INPUT_GITHUB_URL).split("//")[0];
    const github_url = trim(process.env.INPUT_GITHUB_URL).split("//")[1];

    remoteRepo = github_url_protocol + "//" + process.env.GITHUB_ACTOR + ":" + process.env.GITHUB_TOKEN + "@" + github_url + "/" + repository + ".git"
    console.info(remoteRepo)

    await exec('git push ', (error) => {
        if (error) {
            console.error(`执行出错: ${error}`);
            return;
        }
    });
}

gitHelper()

// const fs = require('fs')

// let lbAnnotation = require('../packages/lb-annotation/package.json')
// let lbComponents = require('../packages/lb-components/package.json')
// let lbUtils = require('../packages/lb-utils/package.json')
//
// let demoPath = "./packages/lb-demo/package.json"
// let lbDemo = require('../packages/lb-demo/package.json')
//
// if (lbDemo["dependencies"]["@labelwu/lb-annotation"] == lbAnnotation["version"] && lbDemo["dependencies"]["@labelwu/lb-components"] == lbComponents["version"] && lbDemo["dependencies"]["@labelwu/lb-utils"] == lbUtils["version"]) {
//     console.log("upgrade success; ver not change")
//     process.exit(0)
// }
//
// lbDemo["dependencies"]["@labelwu/lb-annotation"] = lbAnnotation["version"]
// lbDemo["dependencies"]["@labelwu/lb-components"] = lbComponents["version"]
// lbDemo["dependencies"]["@labelwu/lb-utils"] = lbUtils["version"]

// fs.writeFile(demoPath, JSON.stringify(lbDemo, null, "  "), function (err) {
//     if (err) {
//         console.log("upgrade fail", err)
//     } else {
//         console.log("upgrade success")
//     }
// })


const gitHelper = async function () {
    // await exec('git add packages/lb-demo/package.json', (error) => {
    //     if (error) {
    //         console.error(`执行出错: ${error}`);
    //         return;
    //     }
    // });
    //
    // await exec('git commit -m \"feat(ci): upgrade lb-demo dependence version\"', (error) => {
    //     if (error) {
    //         console.error(`执行出错: ${error}`);
    //         return;
    //     }
    // });

    // let branch = process.env.INPUT_BRANCH;
    const repository = trim(process.env.INPUT_REPOSITORY || process.env.GITHUB_REPOSITORY);
    const github_url_protocol = trim(process.env.INPUT_GITHUB_URL).split("//")[0];
    const github_url = trim(process.env.INPUT_GITHUB_URL).split("//")[1];

    remoteRepo = github_url_protocol + "//" + process.env.GITHUB_ACTOR + ":" + process.env.GITHUB_TOKEN + "@" + github_url + "/" + repository + ".git"
    console.info(remoteRepo)
}

gitHelper()

