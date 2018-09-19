/**
 * Receive event from GitHub, then extract specific fields to record.
 * @param {Object} e - An event from GitHub defined in {@link https://developer.github.com/v3/activity/events/}.
 */
function doPost(e) {

  if (typeof e === undefined) { return; }

  /// Parsed GitHub event object.
  var event = JSON.parse(e.postData.getDataAsString());

  /// Single row data object represents key as column and value as row value.
  var row = {};

  /// Extract single row data from an issue comment event.
  var translateIssueCommentIntoRow = function(issueComment) {
    return {
      date: issueComment.created_at,
      user: issueComment.user.login,
      comment: issueComment.body,
      issueNumber: issueComment.number,
      issueTitle: issueComment.title,
      assignee: issueComment.assignee.login
    }
  }

  /// Extract single row data from a pull request review comment event.
  var translateReviewCommentIntoRow = function(issueComment) {
    return {
      date: reviewComment.submitted_at,
      user: reviewComment.user.login,
      comment: reviewComment.body,
      issueNumber: reviewComment.number,
      issueTitle: reviewComment.title
    }
  }

  const properties = PropertiesService.getScriptProperties();
  const activeSheet = SpreadsheetApp.getActiveSpreadsheet();
  const issueComment = event.comment;
  const reviewComment = event.review;

  /// Record different type of property by type of the event.
  if (issueComment !== undefined) {
    row = translateIssueCommentIntoRow(issueComment)

  } else if (reviewComment !== undefined) {
    row = translateReviewCommentIntoRow(reviewComment)

  } else {
    // NOTE: You can even extract another type of comments!
    return;
  }

  /// Record any comments.
  var sheetNameLog = properties.getProperty("SHEET_NAME_LOG");
  if (sheetNameLog == null || sheetNameLog != "") {
    var sheetLog = activeSheet.getSheetByName(sheetNameLog);
    sheetLog.appendRow([date, user, comment, issueNumber, issueTitle, assignee]);
  }

  /// Record comment which inludes specific pattern in its string.
  var sheetNameTimeOnly = PropertiesService.getScriptProperties().getProperty("SHEET_NAME_TIME_ONLY");
  var sheetTimeOnly = activeSheet.getSheetByName(sheetNameTimeOnly);
  var stringPatternRecord = PropertiesService.getScriptProperties().getProperty("PATTERN_RECORD");
  var patternOfRecord = new RegExp(stringPatternRecord);
  var match = patternOfRecord.exec(comment);
  if (match == null || !(match.length > 0)) { return }
  sheetTimeOnly.appendRow([date, user, comment, issueNumber, issueTitle, assignee, "", "", "", ""]);

  /// Set formula to calcurate working time and fill into certain cell.
  var dataRange = sheetTimeOnly.getDataRange();
  var lastRow = dataRange.getLastRow();
  sheetTimeOnly.getRange(lastRow, 7).setFormulaR1C1("=REGEXMATCH(RC[-4], \"m(in)?\")");                    // True if the comment contains expression "m(in)".
  sheetTimeOnly.getRange(lastRow, 8).setFormulaR1C1("=RC[-2] = RC[-6]");                                   // True if assignee is you.
  sheetTimeOnly.getRange(lastRow, 9).setFormulaR1C1("=VALUE(REGEXEXTRACT(RC[-6], \"(\\d+(\\.\\d+)?)\"))"); // Raw value from numeric expression in the comment.
  sheetTimeOnly.getRange(lastRow, 10).setFormulaR1C1("=If(RC[-3], RC[-1]/60, RC[-1])");                    // Working hour.
}

/**
 * Archive existing records to another sheet with specified name.
 * Schedule this to run periodically archive record.
 */
function archiveSheetTimeOnly() {
  /// Sheet to archive.
  var sheetDataExists = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Time Only");
  SpreadsheetApp.setActiveSheet(sheetDataExists);

  /// Name of sheet for archiving.
  var sheetNameArchive = Moment.moment().subtract(7, 'days').format('YYMMDD');
  SpreadsheetApp.getActiveSpreadsheet().duplicateActiveSheet().setName(sheetNameArchive);

  /// Clear all existing data from current sheet.
  var dataRange = sheetDataExists.getDataRange();
  var lastRow = dataRange.getLastRow();
  if (lastRow > 1) {
    sheetDataExists.deleteRows(2, lastRow - 1);
  }
}

