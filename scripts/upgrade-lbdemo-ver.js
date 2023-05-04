const fs = require('fs')

let lbAnnotation = require('../packages/lb-annotation/package.json')
let lbComponents = require('../packages/lb-components/package.json')
let lbUtils = require('../packages/lb-utils/package.json')

let demoPath = "./packages/lb-demo/package.json"
let lbDemo = require('../packages/lb-demo/package.json')

if ( lbDemo["dependencies"]["@labelwu/lb-annotation"] == lbAnnotation["version"] && lbDemo["dependencies"]["@labelwu/lb-components"] == lbComponents["version"] && lbDemo["dependencies"]["@labelwu/lb-utils"] == lbUtils["version"]) {
    console.log("upgrade success; ver not change")
    process.exit(0)
}

lbDemo["dependencies"]["@labelwu/lb-annotation"] = lbAnnotation["version"]
lbDemo["dependencies"]["@labelwu/lb-components"] = lbComponents["version"]
lbDemo["dependencies"]["@labelwu/lb-utils"] = lbUtils["version"]

fs.writeFile(demoPath, JSON.stringify(lbDemo, null, "  "), function (err) {
    if (err) {
        console.log("upgrade fail", err)
    } else {
        console.log("upgrade success")
    }
})