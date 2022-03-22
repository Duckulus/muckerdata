import gradient from "gradient-string";
import figlet from "figlet";
import { msToHMS, sleep, sortObject } from "./util.js";
import chalkAnimation from "chalk-animation";
import chalk from "chalk";

export const printData = async (data) => {
    const total = data.messageCount;
    const messages = {};
    let add = 0;
    let remove = 0;
    let calls = 0;
    const call = {};
    let callDuration = 0;
    const users = [];
    const words = {};
    for (const message of data.messages) {
        if (message.type == 1) {
            add++;
            for (const mention of message.mentions) {
                if (!users.includes(mention.username)) {
                    users.push(mention.username);
                }
            }
        }
        if (message.type == 2) {
            remove++;
        }
        if (message.type == 3) {
            calls++;
            call[message.author.username] = (call[message.author.username] || 0) + 1;
            if (message.call.ended_timestamp && message.timestamp) {
                const duration = new Date(message.call.ended_timestamp).getTime() - new Date(message.timestamp).getTime();
                callDuration += duration;
            }
        }
        if (message.author.username && message.content) {
            messages[message.author.username] = (messages[message.author.username] || 0) + 1;
            const content = message.content;
            for (const word of content.split(" ")) {
                if (word != "") {
                    words[word] = (words[word] || 0) + 1;
                }
            }
        }
    }
    const sortedMessages = sortObject(messages);
    const sortedCall = sortObject(call);
    const sortedWords = sortObject(words);

    figlet("Mucker Data", (_err, data) => {
        console.log(gradient.pastel.multiline(data));
    });
    await sleep(500);
    console.log(`\n${chalk.blue("General Information")}`);
    console.log(chalk.blue("------------"));
    console.log(chalk.gray("Group Name: ") + data.channel.name);
    console.log(chalk.gray("ID: ") + data.channel.id);
    console.log(chalk.gray("Members: ") + (data.channel.recipients.length + 1));
    console.log(chalk.gray("Individuals who were ever part of the group: ") + users.length);
    console.log(chalk.gray("\nAdded: ") + add);
    console.log(chalk.gray("Removed: ") + remove);
    console.log(chalk.blue("\nMessages:"));
    console.log(chalk.blue("------------"));
    console.log(chalk.gray("Total: ") + total);
    for (let i = 0; i < 5; i++) {
        const author = sortedMessages[i];
        if (author) {
            console.log(`${chalk.yellowBright(i + 1)}. ${author[0]}: ${author[1]} (${Math.ceil((author[1] / total) * 100)}%)`);
        }
    }
    console.log(chalk.blue("\nVoice Calls:"));
    console.log(chalk.blue("------------"));
    console.log(chalk.gray("Total Number of voice calls: ") + calls);
    console.log(chalk.gray("Total duration of all voice calls: ") + msToHMS(callDuration));
    console.log(chalk.blue("\nMost calls started by:"));
    console.log(chalk.blue("------------"));
    for (let i = 0; i < 5; i++) {
        const author = sortedCall[i];
        if (author) {
            console.log(`${chalk.yellowBright(i + 1)}. ${author[0]}: ${author[1]} (${Math.ceil((author[1] / total) * 100)}%)`);
        }
    }
    console.log(chalk.blue("\nMost used Words:"));
    console.log(chalk.blue("------------"));
    for (let i = 0; i < 10; i++) {
        const word = sortedWords[i];
        if (word) {
            console.log(`${chalk.yellowBright(i + 1)}. "${word[0]}": ${word[1]}`);
        }
    }
};
