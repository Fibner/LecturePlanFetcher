import fs from 'fs';
import fetch from 'node-fetch';
import xpath from 'xpath';
import { DOMParser } from '@xmldom/xmldom';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import {createWriteStream} from 'node:fs';
let config = JSON.parse(fs.readFileSync('config.json'));

// Fetch the page and parse the response to get pdf's link
const url = new URL(config.url);
let response = await fetch(url);
const body = await response.text();
const document = new DOMParser().parseFromString(body);
const node = xpath.select(config.xpath, document);

// Fetch the pdf and save it
response = await fetch(url.protocol + url.hostname + node[0].attributes[0].nodeValue);
const streamPipeline = promisify(pipeline);
await streamPipeline(response.body, createWriteStream('./plan.pdf'));