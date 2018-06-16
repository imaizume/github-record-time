function doPost(e) {
  if (typeof e === undefined) { return; }
  var event = JSON.parse(e.postData.getDataAsString());
  var date, user, comment, issueNumber, issueTitle, assignee;

  const issueComment = event.comment;
  const reviewComment = event.review;
  if (issueComment !== undefined) {
    // Extract info from issue comment.
    date = issueComment.created_at;
    user = issueComment.user.login;
    comment = issueComment.body;
    issueNumber = issueComment.number;
    issueTitle = issueComment.title;
    assignee = issueComment.assignee.login;
  } else if (reviewComment !== undefined) {
    // Extract info from review comment.
    date = reviewComment.submitted_at;
    user = reviewComment.user.login;
    comment = reviewComment.body;
    issueNumber = reviewComment.number;
    issueTitle = reviewComment.title;
  } else {
    // You can even extract another type of comments!
    return;
  }

  const properties = PropertiesService.getScriptProperties();
  const activeSheet = SpreadsheetApp.getActiveSpreadsheet();
  // Record all of comments if necessary.
  var sheetNameLog = properties.getProperty("SHEET_NAME_LOG");
  if (sheetNameLog == null || sheetNameLog != "") {
    var sheetLog = activeSheet.getSheetByName(sheetNameLog);
    sheetLog.appendRow([date, user, comment, issueNumber, issueTitle, assignee]);
  }

  // Only time record which inludes specific pattern in comment string.
  var sheetNameTimeOnly = PropertiesService.getScriptProperties().getProperty("SHEET_NAME_TIME_ONLY");
  var sheetTimeOnly = activeSheet.getSheetByName(sheetNameTimeOnly);
  var stringPatternRecord = PropertiesService.getScriptProperties().getProperty("PATTERN_RECORD");
  var patternOfRecord = new RegExp(stringPatternRecord);
  var match = patternOfRecord.exec(comment);

  if (match == null || !(match.length > 0)) { return }
  sheetTimeOnly.appendRow([date, user, comment, issueNumber, issueTitle, assignee, "", "", "", ""]);

  var dataRange = sheetTimeOnly.getDataRange();
  var lastRow = dataRange.getLastRow();
  sheetTimeOnly.getRange(lastRow, 7).setFormulaR1C1("=REGEXMATCH(RC[-4], \"m(in)?\")"); // min
  sheetTimeOnly.getRange(lastRow, 8).setFormulaR1C1("=RC[-2] = RC[-6]"); // self
  sheetTimeOnly.getRange(lastRow, 9).setFormulaR1C1("=VALUE(REGEXEXTRACT(RC[-6], \"(\\d+(\\.\\d+)?)\"))"); //raw value
  sheetTimeOnly.getRange(lastRow, 10).setFormulaR1C1("=If(RC[-3], RC[-1]/60, RC[-1])"); // hour
}

function archive() {
  var oldSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Time Only");
  SpreadsheetApp.setActiveSheet(oldSheet);
  var name = Moment.moment().subtract(7, 'days').format('YYMMDD');
  SpreadsheetApp.getActiveSpreadsheet().duplicateActiveSheet().setName(name);
  var dataRange = oldSheet.getDataRange();
  var lastRow = dataRange.getLastRow();
  if (lastRow > 1) {
    oldSheet.deleteRows(2, lastRow - 1);
  }
}

function getEstimate(issueId) {
  var token = PropertiesService.getScriptProperties().getProperty("GITHUB_ACCESS_TOKEN");
  var payload = {
    "access_token" : token
  };
  var options = {
    "method" : "get",
    // "payload" : payload
  };
  var repo_id = PropertiesService.getScriptProperties().getProperty("GITHUB_REPOGITORY_ID");
  var params = [
    ['access_token', token],
    ['repo_id', repo_id],
    ['issue_number', issueId],
  ];
  var param = params.map(function(x) { return x[0] + '=' + x[1] }).join('&');
  var url = ['https://api.zenhub.io', 'p1', 'repositories', repo_id, 'issues', issueId].join('/');
  var response = UrlFetchApp.fetch(url + '?' + param, options);
  var obj = JSON.parse(response.getContentText("UTF-8"));
  if(obj) if(obj.estimate) if (obj.estimate["value"]) return obj.estimate["value"];
  return 0
}

function getAllIssues() {
  const properties = PropertiesService.getScriptProperties();
  var api = 'https://api.github.com';
  var owner = properties.getProperty("GITHUB_OWNER");
  var token = properties.getProperty("GITHUB_ACCESS_TOKEN");
  var repo = properties.getProperty("GITHUB_REPOSITORY");
  var repo_id = properties.getProperty("GITHUB_REPOGITORY_ID");
  var PER_PAGE = 100;

  var url = [api, 'repos', owner, repo, 'issues', repo_id, 'epics', epic_id].join('/');
  var params = [['access_token', token]];
  var response = UrlFetchApp.fetch(url + '?' + params.map(function(x) { return x[0] + '=' + x[1] }).join('&'), options);
  for (var i = 0; i < issues.length; i++) {
    // Issueのマスターデータに追加
    date = p.issue.created_at;
    issueNumber = p.issue.number;
    issueTitle = p.issue.title;
    assignee = p.issue.assignee.login;
    var allIssuesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("All Issues");
    allIssuesSheet.appendRow([date, issueNumber, issueTitle, assignee]);
  }
}
// curl -H 'X-Authentication-Token: <GITHUB_ACCESS_TOKEN>' https://www.zenhub.com/p1/repositories/<GITHUB_REPOGITORY_ID>/epics

function listIssues() {
  var properties = PropertiesService.getScriptProperties();
  var api = 'https://api.github.com';
  var owner = properties.getProperty("GITHUB_OWNER");
  var token = properties.getProperty("GITHUB_ACCESS_TOKEN");
  var repos = [PropertiesService.getScriptProperties().getProperty("GITHUB_REPOSITORY")];
  var PER_PAGE = 100;

  // APIからissueのjsonを取得
  var getIssues = function(repository, page){
    var params = [
      ['state', 'all'],
      ['direction', 'desc'],
      ['access_token', token],
      ['page', page],
      ['per_page', PER_PAGE]
    ];
    var url = [api, 'repos', owner, repository, 'issues'].join('/');
    var param = params.map(function(x) { return x[0] + '=' + x[1] }).join('&');
    var response = UrlFetchApp.fetch(url + '?' + param);
    var json = response.getContentText();
    return JSON.parse(json);
  }

  // issueのjsonから中身を取得
  var getAttributesOfIssue = function(issue){
    var id = issue["number"];

    var milestone = "";
    if(issue["milestone"]) milestone = issue["milestone"]["title"];

    var labels = "";
    if(issue["labels"]){
      labels = issue["labels"].map(function(label){ return label["name"]; }).join(",");
    }

    var assignee = "";
    if(issue["assignee"]) assignee = issue["assignee"]["login"];

    var estimate = getEstimate(id);

/*
    var due_on = "";
    if(issue["milestone"] && issue["milestone"]["due_on"]){
      due_on = issue["milestone"]["due_on"].substring(0, 10);
    }



    var opend_at = "";
    if(issue["created_at"]){
      opend_at = issue["created_at"].substring(0, 10);
    }

    var closed_at = "";
    if(issue["closed_at"]){
      closed_at = issue["closed_at"].substring(0, 10);
    }
*/
    var url = '=HYPERLINK("' + issue["html_url"] + '","' + issue["number"] + '")';

    return [
      id,
      milestone,
      issue["title"],
      assignee,
      issue["state"],
      labels,
      estimate,
      url
    ]
  }

  var sortByValueOfIndex = function(ary, index){
    return ary.sort(function(a,b){
      if( a[index] < b[index] ) return -1;
      if( a[index] > b[index] ) return 1;
      return 0;
    });
  }

  // スプレッドシートを取得
  var ss = SpreadsheetApp.getActive()

  // 指定したレポジトリでシートに反映していく
  repos.forEach(function(repository){
    var issues = getIssues(repository).map(function(issue){
      return getAttributesOfIssue(issue);
    });

    // due on でソートしています
    issues = sortByValueOfIndex(issues, 5);
    var titles = ['ID', "Milestone", "Title", "Assignee", "Status", "Labels", "Estimate", "Issue URL"];
    issues.unshift(titles);
    var sheetName = 'Latest Issues';
    var sheet = ss.getSheetByName(sheetName);
    if(sheet == null) {
      ss.insertSheet(sheetName);
      sheet = ss.getSheetByName(sheetName);
    }
    var edge = [
      String.fromCharCode(65 + titles.length - 1),
      (issues.length).toString()
    ]
    sheet.getRange("A1:" + edge[0] + edge[1]).setValues(issues);
  });
}
