## Outdoc

Auto generate OpenAPI document from local HTTP testing

[![Version](http://img.shields.io/npm/v/outdoc.svg)](https://www.npmjs.org/package/outdoc)
[![npm download][download-image]][download-url]

[download-image]: https://img.shields.io/npm/dm/outdoc.svg?style=flat-square
[download-url]: https://npmjs.org/package/outdoc



<img width="30%" height="30%" src="https://user-images.githubusercontent.com/5305874/193726116-d427aebd-035f-4692-a82f-cfaf3cd4d885.png">

## Installation

```bash
$ npm install outdoc -D
```

## Usage

Add the following codes into your main file

```js
const { OutDoc } = require('outdoc')
if (process.env.NODE_ENV === "test") {
  OutDoc.init()
}
```

Run the command

```bash
$ npx outdoc [test command] [options]
```

Usually it could be, for example:

```bash
$ npx outdoc npm test -t project-name
```

Adn it will generate an api.yaml in your root folder by defaults

## Options

```
  -o, --output            file path of the generated doc, format supports json and yaml, default: api.yaml
  -t, --title <string>    title of the api document, default: API Document
  -v, --version <string>  version of the api document, default: 1.0.0
  -e, --email <string>    contact information
  -f, --force             run the script without adding OutDoc.init in the code 
  -h, --help              display help for command
```

## Not adding extra codes
You might don't wanna add any extra codes in your project only for generating API document, then you can do:

First, Check if the **main** in your package.json pointing to your app entry file which export your nodejs server. If not, please add the attribute **outdoc** pointing to it. If you are writting a Typescript project, you need to add the following configuration.

```json
{
	"outdoc": {
		"main": "./src/app.ts"
	}
}
```

Then run the command with the option **-f**

```bash
$ npx outdoc npm test -f
```

#### What is happending behind `-f`

By using the option `-f`, Outdoc will first check the **outdoc.main** in your package.json, if it not exist, Outdoc will use **main** in the package.json to find the app entry file.

Then Outdoc will copy the entry app file and insert codes into it, and use the new copied file as the entry app file, the concrete steps are:

1. Find your app entry file from package.json, for example the file is named as app.js
2. Copy app.js to a new temporary file named tmp_outdoc_file
3. Insert Outdoc.init into app.js and start running the program to generate the API doc
4. After the generation finished, copy back the content of tmp_outdoc_file to app.js and remove tmp_outdoc_file


## Notes

Outdoc can only understand tests who are sending and receiving real HTTP requests, for example using the [supertest](https://github.com/visionmedia/supertest) in your test cases.

Mocked HTTP request won't work with Ourdoc, like fastify.inject.

## License

MIT
