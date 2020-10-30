const express = require("express");
const bodyParser = require("body-parser");
const csv = require("csv-parser");
const fs = require("fs");
const cors = require("cors");
const request = require("superagent");
const queryString = require("query-string");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const mailchimpInstance = "us9",
  listUniqueId = "c842a239db",
  mailchimpApiKey = "bf985a50508fd53cf9cdbd6607800227-us9";

app.post("/subscribe", (req, res) => {
  // send to mailchimp
  request
    .post(
      `https://${mailchimpInstance}.api.mailchimp.com/3.0/lists/${listUniqueId}/members/`
    )
    .set("Content-Type", "application/json;charset=utf-8")
    .set(
      "Authorization",
      "Basic " +
        new Buffer.from("anystring:" + mailchimpApiKey).toString("base64")
    )
    .send({
      email_address: req.body.email,
      status: "subscribed",
    })
    .end(function (err, response) {
      if (
        response.status < 300 ||
        (response.status === 400 && response.body.title === "Member Exists")
      ) {
        res.send("Signed Up!");
      } else {
        res.send("Sign Up Failed :(");
      }
    });
});

app.get("/attendance/:netID", (req, res) => {
  const netID = req.params.netID.toLowerCase();
  let found = false;
  fs.createReadStream("attendance.csv")
    .pipe(csv())
    .on("data", (row) => {
      if (netID === row["Campus Email"].split("@")[0]) {
        const attendance = parseInt(row["Total"]);
        const interviewee = parseInt(row["Insight Team Interviewee"]);
        const output = `You have attended ${attendance} BAC meetings.`;
        found = true;
        if (attendance >= 5) {
          res.json({
            attendanceMsg: output,
            additionalInfo:
            `
              <div>
              Congratulations, you have achieved Prime Status! Access workshop resources <u><a target="_blank" href="https://docs.google.com/forms/d/1-NFhVQ--SjrBZlk8cOYBWcb8CY96w15os8m-t0QyF_E/viewform?edit_requested=true">here</a></u> and connect with alumni <u><a target="_blank" href="https://github.com/janethuangg/BAC_workshops">here</a></u>.
              </div>
            `
          });
        } else if (interviewee === 1) {
          res.json({
            attendanceMsg: output,
            additionalInfo:
              `
              <div>
                As an Insight Team interviewee, you are now a prime member! Access workshop resources <u><a target="_blank" href="https://docs.google.com/forms/d/1-NFhVQ--SjrBZlk8cOYBWcb8CY96w15os8m-t0QyF_E/viewform?edit_requested=true">here</a></u> and connect with alumni <u><a target="_blank" href="https://github.com/janethuangg/BAC_workshops">here</a></u>.
              </div>
              `
          });
        }
        else {
          res.json({
            attendanceMsg: output,
            additionalInfo: `You are a BAC General Member. You must attend ${
              5 - attendance
            } more meetings to achieve Prime Status.`,
          });
        }
      }
    })
    .on("end", () => {
      if (found === false) {
        res.json({
          attendanceMsg: "You have not attended any BAC meetings.",
          additionalInfo: "",
        });
      }
    });
});

const GOOGLE_CAL_URL = "https://www.googleapis.com/calendar/v3/calendars/";
const API_KEY = "AIzaSyABek6rqw9ZTqA9vZLJ84YTA1YG0cgDMWE";
const CALENDAR_ID = "analytic@stern.nyu.edu";
const TIME_FORMAT = {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/New_York",
};

app.get("/calendar/:count", (req, res) => {
  const count = parseInt(req.params.count);

  const params = {
    timeMin: new Date().toISOString(),
    showDeleted: false,
    singleEvents: true,
    orderBy: "startTime",
    key: API_KEY,
  };
  //if we want to include past events
  if (count === 0) {
    params["timeMin"] = new Date(2020, 0, 1).toISOString();
  }
  request
    .get(
      GOOGLE_CAL_URL + CALENDAR_ID + "/events?" + queryString.stringify(params)
    )
    .then((data) => {
      const items = data.body.items;
      let iterator = -1;
      if (count === 0) {
        iterator = items.length;
      } else {
        iterator = Math.min(items.length, count);
      }

      calendar = [];

      for (let i = 0; i < iterator; i++) {
        let currItem = items[i];
        const info = create_datetime_location(currItem);
        const date = currItem.start.dateTime
          ? currItem.start.dateTime
          : currItem.start.date;
        const month = new Date(date).getMonth();
        let calItem = {
          title: currItem.summary,
          ...info,
          month: get_month_name(month),
          summary: currItem.summary,
          description: currItem.description,
        };
        calendar.push(calItem);
      }
      res.json({ data: calendar });
    });
});

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
function get_month_name(monthNumber) {
  return months[monthNumber];
}

function create_datetime_location(event) {
  const start = event.start;
  let result = {
    time: "",
    location: "",
  };
  if (start.dateTime) {
    const dateTime = new Date(start.dateTime);
    result["time"] =
      dateTime.toLocaleDateString("en-US") +
      "  " +
      dateTime.toLocaleTimeString("en-US", TIME_FORMAT);
  } else if (start.date) {
    result["time"] = new Date(start.date).toLocaleDateString("en-US");
  }

  const end = event.end;
  if (end.dateTime) {
    const dateTime = new Date(end.dateTime);
    result["time"] += " - " + dateTime.toLocaleTimeString("en-US", TIME_FORMAT);
  }

  const loc = event.location;
  if (loc) {
    result["location"] = "Location: " + loc;
  }

  return result;
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
