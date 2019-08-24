const express = require('express');
const bodyParser = require('body-parser');
const csv = require('csv-parser');
const fs = require('fs');
const cors = require('cors');
const request = require('superagent');
const app = express();
const port = process.env.PORT || 3000;

let attendanceTracker = {};

(() => {
    fs.createReadStream('AttendanceTracking.csv')
        .pipe(csv())
        .on('data', (row) => {
            attendanceTracker[row["netID"]] = row["attendance"];
        });
})();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const mailchimpInstance   = 'us9',
    listUniqueId        = 'c842a239db',
    mailchimpApiKey     = 'bf985a50508fd53cf9cdbd6607800227-us9';

app.post('/subscribe', (req, res) => {
    // send to mailchimp
    request
    .post(`https://${mailchimpInstance}.api.mailchimp.com/3.0/lists/${listUniqueId}/members/`)
    .set('Content-Type', 'application/json;charset=utf-8')
    .set('Authorization', 'Basic ' + new Buffer.from('anystring:' + mailchimpApiKey ).toString('base64'))
    .send({
        'email_address': req.body.email,
        'status': 'subscribed'
      })
    .end(function(err, response) {
        if (response.status < 300 || (response.status === 400 && response.body.title === "Member Exists")) {
            res.send('Signed Up!');
        } else {
            res.send('Sign Up Failed :(');
        }
    });

});

app.get('/attendance/:netID', (req, res) => {
    const netID = req.params.netID;
    if(netID in attendanceTracker){
        const attendance = attendanceTracker[netID];
        const output = `You have attended ${attendance} BAC meetings.`;
        if(attendance >= 5){
            res.json({
                attendanceMsg: output,
                additionalInfo: "Congratulations, you have achieved Prime Status! Access special resources on the BAC Prime Google Drive."
            });
        } else {
            res.json({
                attendanceMsg: output,
                additionalInfo: `You are a BAC General Member. You must attend ${5 - attendance} more meetings to achieve Prime Status.`
            });
        }

    } else {
        res.json({
            attendanceMsg: "You have not attended any BAC meetings.",
            additionalInfo: ""
        });
    }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));