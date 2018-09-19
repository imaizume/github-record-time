# Github Record Time

A simple GAS which records your working time commented on issue and pull request.

## Usage

1. Create a Google Spreadsheet for time recording.
1. Open script editor then copy `script.gs` or clone this repository using Chrome plugins such as [leonhartX/gas\-github](https://github.com/leonhartX/gas-github)
1. Create following types of sheet. To know more about these, read script property section.
  1. `SHEET_NAME_LOG`
  1. `SHEET_NAME_TIME_ONLY`


| Column Name | What Value Means |
----|----
| date         | Date of event occurence. |
| user         | GitHub user name of commenter. |
| comment      | Content of comment. |
| issue number | Issue number comment put. |
| issue title  | Issue title comment put. |
| assignee     | Assignee of the issue. |
| min          | (FORMULA) TRUE if comment has expression to specify unit as minutes. |
| self         | (FORMULA) TRUE if commenter is equal to asignee. |
| raw value    | (FORMULA) Extract numeric expression from the comment. |
| hour         | (FORMULA) Working time converted into hour. If min is TRUE, value devied into 60 will be filled. |

## Script Properties You Must Set

To run the script, you must set following variables as script properties:

1. `SHEET_NAME_LOG` : The name of sheet to record RAW comment. You can skip this if you don't want to do.
1. `SHEET_NAME_TIME_ONLY` : The name of sheet to record comment that includes time you worked.
1. `PATTERN_RECORD`: You can filter and extract the comments that includes time record. (e.g. `"(⌚|:watch:).*"` filters only comments such as `":watch: 30min"`)

## Dependency

- Date translation depends on [Moment.js](https://script.google.com/macros/library/versions/d/15hgNOjKHUG4UtyZl9clqBbl23sDvWMS8pfDJOyIapZk5RBqwL3i-rlCo) and import from "Resource" -> "Library"

