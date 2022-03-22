import axios from "axios";

const baseUrl = "https://discord.com/api/v9/";

const fetchMessages = async (token, channelid, limit = 50, before = null) => {
    let url = baseUrl + `channels/${channelid}/messages`;
    url += `?limit=${limit}`;
    if (before) {
        url += `&before=${before}`;
    }
    const resp = await axios.get(url, {
        headers: {
            authorization: token,
        },
    });
    return resp.data;
};

export const fetchAllMessages = async (token, channelid, spinner, limit = -1) => {
    let messages = [];
    while (true) {
        const fetched = await fetchMessages(token, channelid, 100, messages[messages.length - 1] ? messages[messages.length - 1].id : null);
        if (fetched.length > 1) {
            messages = messages.concat(fetched);
            spinner.update({
                text: `Fetching Messages... (${messages.length}) This may take a while`,
            });

            if (!(limit < 1) && messages.length >= limit) {
                spinner.stop();
                return messages;
            }
        } else {
            spinner.stop();
            return messages;
        }
    }
};

export const fetchChannel = async (token, channelid) => {
    let url = baseUrl + `channels/${channelid}`;
    const resp = await axios.get(url, {
        headers: {
            authorization: token,
        },
    });
    return resp.data;
};

// export const fetchGroups = async (token) => {
//     let url = baseUrl + `users/@me/channels`;
//     const resp = await axios.get(url, {
//         headers: {
//             authorization: token,
//         },
//     });
//     const groups = [];
//     for (const channel of resp.data) {
//         if (channel.type == 3) {
//             groups.push == channel;
//         }
//     }
//     return groups;
// };
