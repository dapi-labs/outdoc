# outdoc
[![Version](http://img.shields.io/npm/v/outdoc.svg)](https://www.npmjs.org/package/outdoc)
[![npm download][download-image]][download-url]

[download-image]: https://img.shields.io/npm/dm/outdoc.svg?style=flat-square
[download-url]: https://npmjs.org/package/outdoc

Auto generate OpenAPI document from local testing

The project still need more tests to cover more use cases

Please try it in your project and let us know if you got any issues or suggestions

## Installation

```bash
$ npm install outdoc -D
```

## Configuration
Check if the field `main` in your package.json pointing to the file where the node server exported.

If not, add `output.main` pointing to the file, e.g.:

```
{
  ...
  "outdoc": {
    "main": "./server/index.js"
  }
}
```

## Usage

```bash
$ npx outdoc [test command] [options]
```

Usually it could be:

```bash
$ npx outdoc npm test -t project-name
```
And it will generate an api.yaml in your root folder by default

## Options

```
  -o, --output            file path of the generated doc, format supports json and yaml, default: api.yaml
  -t, --title <string>    title of the api document, default: API Document
  -v, --version <string>  version of the api document, default: 1.0.0
  -e, --email <string>    contact information
  -h, --help              display help for command
```


## Typescript projects
Add `output.main` in your package.json pointing to the file where the nodejs server exported, e.g.:

```
{
  ...
  "outdoc": {
    "main": "./src/app.ts"
  }
}

```
afte that you can run the script as usual


## Behind the screen

Outdoc make use the node module `async_hooks` to understand all the HTTP request to the nodejs server.

When you running the e2e testing, you are like telling outdoc "ok, this is a 200 request if you pass in such request body", "and this endpoint can return 403 with a code 100", etc. Outdoc will generate the api doc based on that.

So if you wanna have a completed API doc, you need
1. Writing e2e test covering all the cases of your API.
2. Running e2e test with real http request, that means testing tools like supertest is a fit, but fastify.inject won't work.

## License

MIT
