# Hash Data Files

The file [exercises.json](../../prompts/exercises.json) contains references to the data files for each exercise. The data files are in the corresponding subfolders in [prompts](../../prompts/).

I need a Node.js/JavaScript helper script that does the following:

* Receives the path to the `prompts` folder as an argument
* Reads the `exercises.json` file
* Iterates over the data files. Calculate an MD5 hash of the file content. Change the file name so that the has is appended to the file name (separated by an underscore).
* The data file names in the `exercises.json` file should be updated to the new file names.

Create a `build-utils` folder in the root of the project. Put the script in there.
