#!/usr/bin/env node
import axios from "axios";
import chalk from "chalk";
import chalkAnimation from "chalk-animation";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import { MuckerData, printData } from "./data.js";
import { fetchAllMessages, fetchChannel } from "./discord.js";
import { sleep } from "./util.js";
import * as fs from "fs";

let token: string;
let channelid: string;

const intro = async () => {
  const welcomeText = chalkAnimation.karaoke(
    "Discord Group Analyzer by Duckulus\n"
  );
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
        application @ https://github.com/Duckulus/muckerdata
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
      console.log(
        chalk.red(
          "\nYou entered a wrong token 3 times. The programm will close now."
        )
      );
      process.exit(1);
    }
  }
};

const channelPrompt = async () => {
  const channelResponse = await inquirer.prompt({
    name: "channelid",
    type: "input",
    message:
      "Please enter the ID of the group (Group -> Rightclick -> Copy ID):",
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
  const { limit } = await inquirer.prompt({
    name: "limit",
    type: "number",
    message:
      "Please enter the limit of messages to be fetched! (Enter -1 to fetch all messages)",
  });
  if (!Number.isInteger(Number(limit))) {
    console.log(chalk.red("Invalid Value! Please enter a number!"));
    await limitPromp();
  }

  const fetchSpinner = createSpinner("Preparing...").start();
  const messages = await fetchAllMessages(
    token,
    channelid,
    fetchSpinner,
    limit
  );

  const channel = await fetchChannel(token, channelid);
  const data: MuckerData = {
    messageCount: messages.length,
    channel: channel,
    messages: messages,
  };
  await printData(data);
  await exportPrompt(data);
};

const exportPrompt = async (data: MuckerData) => {
  const exportResponse = await inquirer.prompt({
    name: "export",
    type: "confirm",
    message: "Would you like to export the generated data?",
    default: false,
  });

  if (exportResponse.export) {
   await pathPrompt(data)
  }
  await againPromt();
};

const pathPrompt = async (data: MuckerData) => {
  const pathResponse = await inquirer.prompt({
    name: "path",
    type: "input",
    message: "Enter the full path of the folder you want to export the data to (Example \"C:\\Users\\User\\Documents\")",
    default: ""
  })
  const spinner = createSpinner("Saving...").start()
  if(!pathResponse.path) {
    spinner.error({
      text: "You need to specify a path"
    })
    await exportPrompt(data)
  }
  try {
    const path = pathResponse.path

    const file = (path.endsWith("\\") ? path.slice(0, -1) : path)  + "\\muckerdata.json"
    fs.writeFileSync(file, JSON.stringify(data, null, 4))
    spinner.success({
      text: `Data was saved succesfully in "${file}"`
    })
    await againPromt()
  } catch (e) {
    spinner.error({
      text: "Error saving data. Make sure you entered a path to a proper folder."
    })
    await exportPrompt(data)
  }


}

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

const main = async () => {
  await intro();
  await tokenPrompt();
  await channelPrompt();
};

main();
