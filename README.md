# Github Record Time

A simple GAS which records your working time commented on issue and pull request.

## Script Properties You Must Set

To run the script, you must set following variables as script properties:

1. `SHEET_NAME_LOG` : The name of sheet to record RAW comment. You can skip this if you don't want to do.
1. `SHEET_NAME_TIME_ONLY` : The name of sheet to record comment that includes time you worked.
1. `PATTERN_RECORD`: You can filter and extract the comments that includes time record. (e.g. "(⌚|:watch:).*" filters only comments such as ":watch: 30min")
