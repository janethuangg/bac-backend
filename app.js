const express = require('express');
const bodyParser = require('body-parser');
const csv = require('csv-parser');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/subscribe', (req, res) => {
    // send to mailchimp

});

app.get('/attendance/:email', (req, res) => {
    const email = req.params.email;
    const emailBroken = email.split("");
    //console.log(emailBroken);
    if(emailBroken.includes('@')){
        const netID = email.split("@")[0];
        //console.log(netID);
        let attendance = 0;
        fs.createReadStream('AttendanceTracking.csv')
            .pipe(csv())
            .on('data', (row) => {
                //console.log(`${row["netID"]} === ${netID}`);
                if(row["netID"] === netID){
                    attendance = row["attendance"];
                    
                }
            })
            .on('end', () => {
                //console.log("f");
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
            });
    } else {
        res.json({
            attendanceMsg: "You have not attended any BAC meetings.",
            additionalInfo: ""
        });
    }


});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));