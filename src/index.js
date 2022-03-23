#!/usr/bin/env node
import axios from "axios";
import chalk from "chalk";
import chalkAnimation from "chalk-animation";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";

import { printData } from "./data.js";
import { fetchAllMessages, fetchChannel } from "./discord.js";
import { sleep } from "./util.js";

let token;
let channelid;
let limit;

const intro = async () => {
    const welcomeText = chalkAnimation.karaoke("Discord Group Analyzer by Duckulus\n");
    await sleep(3000);
    welcomeText.stop();
    console.log(`
        ${chalk.bgBlue("INFO")}
        This utility allows you to generate some interesting 
        data about your Discord group chats. To procceed your
        Discord Account token is required. Generally this 
        information should not be shared with anyone but in 
        this case you can be assured that your token will not 
        be saved anywhere. If you want to check for 
        yourself feel free to check the sourcecode of this 
        application @ {link}
    `);
};
let tries = 2;
const tokenPrompt = async () => {
    const tokenResponse = await inquirer.prompt({
        name: "token",
        type: "password",
        message: "Please enter your token:",
    });
    token = tokenResponse.token;
    const spinner = createSpinner("Validating...").start();
    await sleep(1000);
    try {
        await axios.get("https://discord.com/api/v9/users/@me", {
            headers: {
                authorization: token,
            },
        });
        spinner.success({
            text: "Succesfully verified",
        });
    } catch (e) {
        if (tries > 0) {
            spinner.error({
                text: "Error! An invalid token has been passed!",
            });
            tries--;
            await tokenPrompt();
        } else {
            console.log(chalk.red("\nYou entered a wrong token 3 times. The programm will close now."));
            process.exit(1);
        }
    }
};

const channelPrompt = async () => {
    const channelResponse = await inquirer.prompt({
        name: "channelid",
        type: "input",
        message: "Please enter the ID of the group (Group -> Rightclick -> Copy ID):",
    });
    channelid = channelResponse.channelid;
    const spinner = createSpinner("Checking...").start();
    try {
        await axios.get(`https://discord.com/api/v9/channels/${channelid}`, {
            headers: {
                authorization: token,
            },
        });
        spinner.success({
            text: "Succesfully verified",
        });
    } catch (e) {
        spinner.error({
            text: "Error fetching Group! Perhaps you passed an improper ID.",
        });

        await channelPrompt();
    }
    await limitPromp();
};

const limitPromp = async () => {
    const limitResponse = await inquirer.prompt({
        name: "limit",
        type: "input",
        message: "Please enter the limit of messages to be fetched! (Enter -1 to fetch all messages)",
    });
    if (!Number.isInteger(Number(limitResponse.limit))) {
        console.log(chalk.red("Invalid Value! Please enter a number!"));
        await limitPromp();
    }
    limit = limitResponse.limit;

    const fetchSpinner = createSpinner("Preparing...").start();
    const messages = await fetchAllMessages(token, channelid, fetchSpinner, limit);
    const channel = await fetchChannel(token, channelid);
    const data = {};
    data.messageCount = messages.length;
    data.channel = channel;
    data.messages = messages;
    await printData(data);
    await exportPrompt(data);
};

const exportPrompt = async (data) => {
    const exportResponse = await inquirer.prompt({
        name: "export",
        type: "confirm",
        message: "Would you like to export the generated data?",
        default: false,
    });

    if (exportResponse.export) {
        const spinner = createSpinner("Uploading to Hastebin...").start();
        const url = "https://www.toptal.com/developers/hastebin/";
        try {
            const resp = await axios.post(
                url + "documents",
                {
                    data: JSON.stringify(data, null, 3),
                },
                {
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                }
            );
            spinner.success({ text: chalk.blue(`The raw data has been dumped @ ${url + resp.data.key} !`) });
        } catch (e) {
            spinner.error({
                text: "An Error occured while uploading your data! Please try again later.",
            });
        }
    }
    await againPromt();
};

const againPromt = async () => {
    const againResponse = await inquirer.prompt({
        name: "again",
        type: "confirm",
        message: "Do you want to analyze another Channel?",
        default: false,
    });

    if (againResponse.again) {
        await channelPrompt();
    } else {
        process.exit(0);
    }
};

await intro();
await tokenPrompt();
await channelPrompt();
