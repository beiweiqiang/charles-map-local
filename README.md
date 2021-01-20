# charles-map-local README

## Features

When we use Charles's Map Local function to test different response. Often requires a lot of repeated clicks and operations to change local file, in order to provider different response.

With this extension, you only **ONE CLICK**, click the response file you want to provide. Charles will choose your clicked file as response.

## Usage

1. Build a total dir, contains all mock response data.
2. Each mock api in a dir
3. Each mock dir has own `index.json` file
4. Set the `index.json` as the entry point of Charles's Map Local
5. Open a new vscode window to load total mock dir (will be optimize)
6. Click the response file which you want to set as a response

## To do list

- use specific dir as a mock response dir
- can use another dir as a mock dir
- ~~refresh files in dir~~
- auto create `index.json` if it not exist in dir
- label the response that current use
- add usage gif
- ~~can add new mock response file in extension~~
- ~~can delete useless mock file~~
- ~~click dir and expend dir files~~
- ~~create file in workspace~~
