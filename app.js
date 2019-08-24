const express = require('express');
const bodyParser = require('body-parser');
const csv = require('csv-parser');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/subscribe', (req, res) => {
    // send to mailchimp
    console.log(req.body.email);
    res.sendStatus(200);

});

app.get('/attendance/:netID', (req, res) => {
    const netID = req.params.netID;
    let attendance = 0;
    let found = false;
    fs.createReadStream('AttendanceTracking.csv')
        .pipe(csv())
        .on('data', (row) => {
            //console.log(`${row["netID"]} === ${netID}`);
            if(row["netID"] === netID){
                attendance = row["attendance"];
                found = true;
            }
        })
        .on('end', () => {
            //console.log("f");
            const output = `You have attended ${attendance} BAC meetings.`;
            if(found) {
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



});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));