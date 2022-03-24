import axios, { AxiosResponse } from "axios";
import {
  APIChannelBase,
  APIDMChannel,
  APIMessage,
  ChannelType,
} from "discord-api-types/v10";
import { Spinner } from "nanospinner";

const baseUrl = "https://discord.com/api/v9/";

const fetchMessages = async ({
  token,
  channelid,
  limit = 50,
  before = undefined,
}: {
  token: string;
  channelid: string;
  limit: number;
  before: string | undefined;
}) => {
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

export const fetchAllMessages = async (
  token: string,
  channelid: string,
  spinner: Spinner,
  limit = -1
) => {
  let messages: APIMessage[] = [];
  while (true) {
    const fetched = await fetchMessages({
      token,
      channelid,
      limit: 100,
      before: messages[messages.length - 1]?.id,
    });
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

export const fetchChannel = async (token: string, channelid: string) => {
  let url = baseUrl + `channels/${channelid}`;
  const resp: AxiosResponse<APIDMChannel> = await axios.get(url, {
    headers: {
      authorization: token,
    },
  });
  return resp.data;
};

export const fetchGroups = async (token: string) => {
  let url = baseUrl + `users/@me/channels`;
  const resp: AxiosResponse<APIChannelBase<number>[]> = await axios.get(url, {
    headers: {
      authorization: token,
    },
  });
  const groups: APIChannelBase<number>[] = [];
  for (const channel of resp.data) {
    if (channel.type == ChannelType.GroupDM) {
      groups.push(channel);
    }
  }
  return groups;
};
