<p align="center">
  <img alt="Charles Map Local logo" src="https://raw.githubusercontent.com/beiweiqiang/charles-map-local/main/resources/logo.png" />
</p>

<br />

# charles-map-local

This is a [vscode extension](https://marketplace.visualstudio.com/items?itemName=beiweiqiang.charles-map-local).

When we use Charles's Map Local function to test different response. Often requires a lot of repeated clicks and operations to change local file, so that we can provider different response.

With this extension, you just need **ONE CLICK** to change the mock response.

## Usage

![usage](https://raw.githubusercontent.com/beiweiqiang/charles-map-local/main/resources/charles-map-local.gif)

Before Use:

- Create your mock folder
  - The folder shold contain a `index.json` file
- Set the `index.json` file as the entry point of the mock file response in Charles's Map Local

Open the extension:

1. Choose your mock folder
2. Click the response file which you want to set as a mock response

## To do list

- ✔️if not choose, display welcome view and can choose folder again
- ✔️label the response that current use
- ✔️save the folder already pick, so that next time no need to pick again
- ✔️add extension logo
- ✔️if only choose the dir with a flat api, also can add, delete
- ✔️can create new dir in root
- ✔️can create new file in root
- ✔️can modify folder name
- ✔️can modify file name
- ✔️refresh files in dir
- ✔️can add new mock response file in extension
- ✔️can delete useless mock file
- ✔️click dir and expend dir files
- ✔️create file in workspace
- ✔️use specific dir as a mock response dir
- ✔️bug: after add/modify file, content not refresh
- ✔️can use another dir as a root mock dir
- ✔️add usage gif