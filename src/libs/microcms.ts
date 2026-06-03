import type { MicroCMSQueries } from 'microcms-js-sdk';
import { createClient } from 'microcms-js-sdk';

const client = createClient({
  serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: import.meta.env.MICROCMS_API_KEY,
});

export type imgType = {
  url: '';
};

export type responseType = {
  totalCount: number;
  offset: number;
  limit: number;
};

export type newsType = {
  id: string;
  title: string;
  date: string;
  url: string;
  image: imgType;
  category: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
};

export type newsResponseType = responseType & {
  contents: newsType[];
};

export type mediaType = {
  id: string;
  title: string;
  url: string;
  image: imgType;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
};

export type mediaResponseType = responseType & {
  contents: mediaType[];
};

export type clientType = {
  id: string;
  title: string;
  url?: string;
  image: imgType;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
};

export type clientResponseType = responseType & {
  contents: mediaType[];
};

export const getNewsItems = async (queries?: MicroCMSQueries) => {
  const response = await client.get<newsResponseType>({
    endpoint: 'news',
    queries: queries,
  });
  return response;
};

export const getMediaItems = async (queries?: MicroCMSQueries) => {
  const response = await client.get<mediaResponseType>({
    endpoint: 'media',
    queries: queries,
  });
  return response;
};

export const getClientItems = async (queries?: MicroCMSQueries) => {
  const response = await client.get<clientResponseType>({
    endpoint: 'clients',
    queries: queries,
  });
  return response;
};
