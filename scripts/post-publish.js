const minimist = require('minimist');
const { Octokit } = require('@octokit/rest');
const nodeFetch = require('node-fetch');

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
});

function sendMessageToWechat(content) {
    const wechatRobotUrl = process.env.WEBHOOK_URL;

    if (!wechatRobotUrl) {
        return Promise.reject('wechat robot url is not set');
    }

    return nodeFetch(wechatRobotUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            msgtype: 'markdown',
            markdown: {
                content,
            },
        }),
    }).then(() => {
        console.log('send wechat robot success');
    });
}

function createPullRequest({ branchName, body, title = branchName, base = 'main' }) {
    if (!branchName) {
        return Promise.reject('branch name is not set');
    }

    console.log('Create a pull request');

    return octokit.rest.pulls
        .create({
            owner: 'opendatalab',
            repo: 'labelU-Kit',
            head: branchName,
            title,
            base,
            body,
        })
        .then(() => {
            console.log('Create a pull request success');
        });
}

async function main() {
    const args = minimist(process.argv.slice(2));
    const [branchName, releaseNotes] = args._;

    try {
        await sendMessageToWechat(releaseNotes);

        await new Promise((resolve) => {
            setTimeout(async () => {
                createPullRequest({
                    branchName,
                    body: releaseNotes,
                    base: 'main',
                    title: 'Update package version',
                }).catch((err) => {
                    console.log(err);
                });
                resolve();
                // 避免 You have exceeded a secondary rate limit 问题
            }, 1000);
        });
    } catch (err) {
        console.log(err);
    }
}

main();