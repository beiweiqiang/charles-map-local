<p align="center">
  <img alt="Charles Map Local logo" src="resources/logo.png" />
</p>

<br />

# charles-map-local

This is a [vscode extension](https://marketplace.visualstudio.com/items?itemName=beiweiqiang.charles-map-local).

When we use Charles's Map Local function to test different response. Often requires a lot of repeated clicks and operations to change local file, so that we can provider different response.

With this extension, you just need **ONE CLICK** to change the mock response.

## Usage

Before Use:

- Create your mock folder
  - The folder shold contain a `index.json` file
- Set the `index.json` file as the entry point of the mock file response in Charles's Map Local

Open the extension:

1. Choose your mock folder
2. Click the response file which you want to set as a mock response

## To do list

- can use another dir as a root mock dir
- save the folder already pick, so that next time no need to pick again
- auto create `index.json` if it not exist in dir
- label the response that current use
- add usage gif
- if not choose, display welcome view and can choose again
- <del>add extension logo</del>
- <del>if only choose the dir with a flat api, also can add, delete</del>
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
