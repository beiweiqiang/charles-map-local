# charles-map-local README

## Features

When we use Charles's Map Local function to test different response. Often requires a lot of repeated clicks and operations to change local file, in order to provider different response.

With this extension, you only **ONE CLICK**, click the response file you want to provide. Charles will choose your clicked file as response.

## Usage

Your mock data dir should like this:

1. Build a total dir, contains all mock response data
2. Each mock api in a dir
3. Each mock dir has own `index.json` file

Set Charles Map Local:

1. Set the `index.json` as the entry point of each response in Charles's Map Local

Open the extension:

1. Choose your mock data dir
2. Click the response file which you want to set as a response in each api dir

## To do list

- can use another dir as a root mock dir
- save the folder already pick, so that next time no need to pick again
- auto create `index.json` if it not exist in dir
- label the response that current use
- add usage gif
- if not choose, display welcome view and can choose again
- <del>if only choose the dir with a flat api, also can add, delete<del>
- <del>can create new dir in root</del>
- <del>can create new file in root</del>
- <del>can modify folder name</del>
- <del>can modify file name</del>
- <del>refresh files in dir</del>
- <del>can add new mock response file in extension</del>
- <del>can delete useless mock file</del>
- <del>click dir and expend dir files</del>
- <del>create file in workspace</del>
- <del>use specific dir as a mock response dir</del>
- <del>bug: after add/modify file, content not refresh</del>
