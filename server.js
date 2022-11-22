const WebSocket = require('ws');
const superagent = require('superagent');
const http = require('http');
const fs = require('fs');
const express = require('express');
const app = express()
const moment = require('moment');
const dotenv = require('dotenv');
var lua2json = require('lua2json');

dotenv.config();

app.use(express.static('public'));

const server = http.createServer(app);

const battleNetToken = process.env.BATTLE_NET_TOKEN;


// Community Information Objects and Arrays
var communityInformationWoWFileLocation = process.env.COMMUNITYDATAFILELOCATION;

var communityInformation = {};

var communityInformationNames = [];

var mPlusData = [];

test = ["Mystwydow-Illidan", "Stormyshadow-Sargeras", "Mawmense-Sargeras"]

//Create web socket server
const wss = new WebSocket.Server({
    server
});

server.listen(process.env.EXPRESSPORT, () => console.log("Websocket Server Started " + moment().format('LLLL')));

app.get('/CommunityLuaData', (req, res) => {
    res.send(communityInformation);
});

app.get('/CommunityMPlusData', (req, res) => {
    res.send(mPlusData);
});

/* Section for Accepting LUA Data through API

app.get('/CommunityMPlusData', (req, res) => {
    res.send(mPlusData);
}); */

const readCommunityInformation = () => new Promise((resolve, reject) => {
    // Get specific variable from Lua file and ignore any unknown types and operators
    lua2json.getVariable(communityInformationWoWFileLocation, 'allCommunityMembers', function (err, result) {
        communityInformation = result;
        //console.log(err, result);
        //console.log("Community Information: ", communityInformation);
        resolve(communityInformation);
    }, {
        ignoreUnknownOperators: true,
        ignoreUnknownTypes: true
    });
})

const filterCommunityNames = () => new Promise((resolve, reject) => {
    communityInformation.map((item, index) => {
        if (item.name.indexOf("-") === -1) {
            let newItem = item.name + "-Illidan";
            communityInformationNames.push(newItem.toLowerCase());
        } else {
            communityInformationNames.push(item.name.toLowerCase());
        }

    });
    resolve(communityInformationNames);
});

const getMPlusData = async () => {


    for (let i = 0; i < 100; i++) {

        let name = communityInformationNames[i].split("-")[0];
        let realm = communityInformationNames[i].split("-")[1];

        //Adjust Timeout for 400 Errors
        await sleep(500);
        superagent
            .get(`https://us.api.blizzard.com/profile/wow/character/${realm}/${name}/mythic-keystone-profile?namespace=profile-us&locale=en_US&access_token=${battleNetToken}`)
            .set('Accept', 'application/json')
            .set('Content-type', 'application/json')
            .then(response => {
                let payloadData = response._body;
                mPlusData.push(payloadData);
                //console.log(payloadData);                
            }).catch(error => {
                console.log("There was an error: ", error)
            }).finally()

    }
}

//Creates function for async sleep if needed to delay functions
const sleep = ms => new Promise(res => setTimeout(res, ms))

const printConsole = () => new Promise((resolve, reject) => {
    //console.log("Community Information: ", communityInformation);
    mPlusData.map(item => {
        console.log(item);
    });
    resolve();
});

const runProgram = async () => {
    await readCommunityInformation();
    await filterCommunityNames();
    await getMPlusData();
    await printConsole();
};

runProgram();
//setInterval(updateClients, 5000)