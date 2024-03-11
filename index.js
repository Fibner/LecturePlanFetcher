import fs from 'fs';
import fetch from 'node-fetch';
import xpath from 'xpath';
import crypto from 'crypto';
import { DOMParser } from '@xmldom/xmldom';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
let config = JSON.parse(fs.readFileSync('config.json'));

let currenHash = null;

// Function to fetch the page and parse the response to get pdf's link
let downloadFile = async () => {
    const url = new URL(config.url);
    let response = await fetch(url);
    const body = await response.text();
    const document = new DOMParser().parseFromString(body);
    const node = xpath.select(config.xpath, document);

    // Fetch the pdf and save it
    response = await fetch(url.protocol + url.hostname + node[0].attributes[0].nodeValue);
    const streamPipeline = promisify(pipeline);
    await streamPipeline(response.body, fs.createWriteStream('./plan.pdf'));
}

// Function to calculate the hash of the pdf and compare it with the previous hash
let compareFiles = async () => {
    const hash = crypto.createHash('sha256');
    const fileStream = fs.createReadStream('./plan.pdf');
    fileStream.on('data', (data) => {
        hash.update(data);
    });
    fileStream.on('end', () => {
        const fileHash = hash.digest('hex');
        if(currenHash == null){
            currenHash = fileHash;
            console.log("Initialized file hash: " + currenHash);
        }
        if(currenHash != fileHash){
            console.log("File has changed, sending message",currenHash, fileHash);
            currenHash = fileHash;
        }
    });
}

// Download the file and compare it
await downloadFile();
await compareFiles();

// Download and compare the files every hour
setInterval(async () => {
    await downloadFile();
    await compareFiles();
}, 3600000);