/**
 * Receive event from GitHub, then extract specific fields to record.
 * @param {Object} e - An event from GitHub defined in {@link https://developer.github.com/v3/activity/events/}.
 */
function doPost(e) {

  const properties = PropertiesService.getScriptProperties();
  const activeSheet = SpreadsheetApp.getActiveSpreadsheet();

  const PATTERN_MIN = '"m(in)?"';
  const PATTERN_NUMERIC = '"(\\d+(\\.\\d+)?)"';

  if (typeof e === undefined) { return; }

  /// Parsed GitHub event object.
  var event = JSON.parse(e.postData.getDataAsString());
  var issueComment = event.comment;
  var reviewComment = event.review;

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
    sheetLog.appendRow([
      row.date,         // column 1 (date)
      row.user,         // column 2 (user)
      row.comment,      // column 3 (comment)
      row.issueNumber,  // column 4 (issueNumber)
      row.issueTitle,   // column 5 (issueTitle)
      row.assignee      // column 6 (asignee)
    ]);
  }

  /// Record comment which inludes specific pattern in its string.
  var sheetNameTimeOnly = PropertiesService.getScriptProperties().getProperty("SHEET_NAME_TIME_ONLY");
  var sheetTimeOnly = activeSheet.getSheetByName(sheetNameTimeOnly);
  var stringPatternRecord = PropertiesService.getScriptProperties().getProperty("PATTERN_RECORD");
  var patternOfRecord = new RegExp(stringPatternRecord);
  var match = patternOfRecord.exec(comment);
  if (match == null || !(match.length > 0)) { return }
  sheetTimeOnly.appendRow([
    row.date,         // column 1  (date)
    row.user,         // column 2  (user)
    row.comment,      // column 3  (comment)
    row.issueNumber,  // column 4  (issueNumber)
    row.issueTitle,   // column 5  (issueTitle)
    row.assignee,     // column 6  (asignee)
    "",               // column 7  (min)
    "",               // column 8  (self)
    "",               // column 9  (raw value)
    ""                // column 10 (hour)
  ]);

  /// Set formula to calcurate working time and fill into certain cell.
  var dataRange = sheetTimeOnly.getDataRange();
  var lastRow = dataRange.getLastRow();
  sheetTimeOnly.getRange(lastRow, 7).setFormulaR1C1("=REGEXMATCH(RC[-4], " + PATTERN_MIN + ")");              // True if the comment contains expression "m(in)".
  sheetTimeOnly.getRange(lastRow, 8).setFormulaR1C1("=RC[-2] = RC[-6]");                                      // True if assignee is you.
  sheetTimeOnly.getRange(lastRow, 9).setFormulaR1C1("=VALUE(REGEXEXTRACT(RC[-6], " + PATTERN_NUMERIC + "))"); // Raw value from numeric expression in the comment.
  sheetTimeOnly.getRange(lastRow, 10).setFormulaR1C1("=If(RC[-3], RC[-1]/60, RC[-1])");                       // Working hour.
}

/**
 * Archive existing records to another sheet with specified name.
 * Schedule this to run periodically archive record.
 */
function archiveSheetTimeOnly() {
  /// Sheet to archive.
  var sheetNameTimeOnly = PropertiesService.getScriptProperties().getProperty("SHEET_NAME_TIME_ONLY");
  var sheetTimeOnly = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetNameTimeOnly);
  SpreadsheetApp.setActiveSheet(sheetTimeOnly);

  /// Name of sheet for archiving.
  /// Note that you MUST SPECIFY IDENTICAL SHEET NAME or archiving will fail.
  var sheetNameArchive = Moment.moment().subtract(7, 'days').format('YYMMDD');
  SpreadsheetApp.getActiveSpreadsheet().duplicateActiveSheet().setName(sheetNameArchive);

  /// Clear all existing data from current sheet.
  var dataRange = sheetTimeOnly.getDataRange();
  var lastRow = dataRange.getLastRow();
  if (lastRow > 1) {
    sheetTimeOnly.deleteRows(2, lastRow - 1);
  }
}

