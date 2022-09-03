import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import YAML from 'json-to-pretty-yaml';

import type { OpenAPIV3_1 } from 'openapi-types';
import type { API_URL } from './types/apiTypes';
import type APICollector from './APICollector';

type GenDocOpts = {
  output?: string,
  title?: string,
  version?: string,
  email?: string
}

const SUPPORTED_FORMAT = ['.json', '.yaml'];

export default class APIGenerator {
  public static async generate (
    apiCollector: APICollector,
    opts: GenDocOpts
  ): Promise<void> {
    const apiItems = apiCollector.getItems();
    const paths = Object.entries(apiItems)
      .reduce((acc, cur) => {
        const key: API_URL = cur[0];
        const value: OpenAPIV3_1.PathItemObject = cur[1];
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);
    const info = {
      title: opts.title || 'API Document',
      version: opts.version || '1.0.0',
      ... opts.email && { contact: { email: opts.email } }
    };
    const apiDoc: OpenAPIV3_1.Document = {
      openapi: '3.0.1',
      info,
      paths
    };

    const output = opts.output || 'api.yaml';
    const fileFormat = path.extname(output);
    if (!SUPPORTED_FORMAT.includes(fileFormat)) {
      throw new Error(`${fileFormat} file not supported`);
    }

    await mkdir(path.dirname(output), { recursive: true });
    switch (fileFormat) {
      case ".json": {
        await writeFile(output, JSON.stringify(apiDoc, null, 2));
        break;
      }
      case ".yaml": {
        const yamlData = YAML.stringify(apiDoc);
        await writeFile(output, yamlData);
        break;
      }
    }
  }
}
