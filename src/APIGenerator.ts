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
  private static getTagByUrl (
    url: API_URL,
    apiCollector: APICollector
  ): string | undefined {
    const paths = url.split("/").slice(1, 3);
    const totalURLAmount = Object.keys(apiCollector.getItems()).length;
    let tag;
    let max = 0;
    paths.forEach((path, index) => {
      const count = apiCollector.getCountByPath(path);
      if (index === 0) {
        if (count <= 1 || count >= totalURLAmount -1) {
          return;
        } else {
          tag = path.trim();
          max = Infinity;
        }
      } else {
        if (count > max && count > 1) {
          tag = path.trim();
          max = count;
        }
      }
    });
    return tag;
  }

  private static addTagToPathItem(
    tag: string,
    pathItem: OpenAPIV3_1.PathItemObject
  ): void {
    Object.keys(pathItem).forEach(key => {
      pathItem[key as OpenAPIV3_1.HttpMethods]!.tags = [tag];
    });
  }

  public static async generate (
    apiCollector: APICollector,
    opts: GenDocOpts
  ): Promise<void> {
    const apiItems = apiCollector.getItems();
    const paths = Object.entries(apiItems)
      .reduce((acc, cur) => {
        const key: API_URL = cur[0];
        const value: OpenAPIV3_1.PathItemObject = cur[1];
        const tag = APIGenerator.getTagByUrl(key, apiCollector);
        if (tag) {
          APIGenerator.addTagToPathItem(tag, value);
        }
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
