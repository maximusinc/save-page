## Download page sources

Very often you need to develop page localy. And need to load page HTML code, and when manually upload dependencies from server and put into path relative index page according server path structure. It's easy, but if page has too many resources and you can't manually upload it. This script helps to solve this problems.

### Before using install NodeJS and Yeoman and dependencies.

```sh
npm install -g yo
```


### How to use:

+ clone this repo to `myfolder`

```sh
git clone git@github.com:maximusinc/save-page.git myfolder
```

+ save all page resources as `.HAR` file. It's very easy make with Google Dev Tools panel.
+ put `.HAR` file into `myfolder` folder.
+ go to cloning folder
```sh
cd myfolder
```
+ run in command line
```sh
npm install
```
+ and save page with command

```sh
node save.js
```

+ page and dependencies will uploads to content folder

####next steps are optional

If you want to run local server, you can to make it easy with yeoman generators. Install yeoman simple webapp generator.
```sh
npm install -g generator-simple
```

+ go to `content` folder

+ print in console

```sh
yo simple
```
~Note: Do not override uploaded files~

+ start local server print

```sh
grunt
```

All done. You are have local page