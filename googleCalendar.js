async function createCalendar(token) {
    writeOutput("Creating Calendar...", "blue");

    for(let i=1; i<=5; i++) {
        let options = {month: 'long'};
        let date = new Date();
        let month = new Intl.DateTimeFormat('en-US', options).format(date);
        let year = date.getUTCFullYear();
        let calendarName = "NEU " + month + " " + year

        let calendar = {
            "summary": calendarName,
            "description": "Calendar created by the \"Auto Calendar for NEU Banner\" Chrome extension for storing course schedule."
        };
        
        let response = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            method: "POST", 
            body: JSON.stringify(calendar)
        })

        responseJson = await response.json();
        let calendarId = await responseJson.id;

        if (response.ok) {
            writeOutput("Created calendar \"" + calendarName + "\"");
            writeOutput("Adding courses to calendar...", "blue");
            return calendarId;
        }
        else {
            writeOutput("Fail. (Error " + response.status + ") Retrying...", "red");
            await new Promise(r => setTimeout(r, i*150));
            continue;
        }
    }
    console.log(await responseJson);
    return 1;
}

async function addEventToCalendar(courseInfo, calendarId, token, color) { 
    var event = {
        "summary": courseInfo.courseName,
        "location": courseInfo.location,
        "start": {
            "dateTime": courseInfo.dateBegin + "T" + courseInfo.timeBegin,
            "timeZone": "America/New_York",
        },
        "end": {
            "dateTime": courseInfo.dateBegin + "T" + courseInfo.timeEnd,
            "timeZone": "America/New_York",
        },
        "recurrence": [
            "RRULE:FREQ=WEEKLY;UNTIL=" + courseInfo.dateEnd + ";BYDAY=" + courseInfo.daysOfWeek,
            "EXDATE;TZID=America/New_York;VALUE=DATE-TIME:" + courseInfo.dateBegin.replace(/-/g, "") + "T" + courseInfo.timeBegin.replace(/:/g, ""),
        ],
        "reminders": {
            "useDefault": false,
            "overrides": [
                {"method": "popup", "minutes": 30}
            ]
        },
        "creator": {
            "displayName": "Auto Calendar for NEU Banner"
        },
        "colorId": (color<=11) ? color : Math.floor((Math.random() * 11) + 1),
        "description": courseInfo.courseNumber + "\n" + courseInfo.instructors
    };

    let response = await fetch("https://www.googleapis.com/calendar/v3/calendars/" + await calendarId + "/events/", {
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        },
        method: "POST", 
        body: JSON.stringify(event)
    })

    if (response.ok) {
        writeOutput(courseInfo.courseName + " added to calendar.");
        return 200;
    }
    if (response.status == 403) {
        return 403;
    }
    else {
        return parseInt(response.status);
    }
}