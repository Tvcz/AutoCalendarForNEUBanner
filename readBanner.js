window.onload=function(){
    chrome.runtime.sendMessage({action: "pullTabInfo"});
}

chrome.runtime.onMessage.addListener(
    function receiveMessage(request, sender, sendResponse) {
        if (request.action === "readSchedule") {
            loadSchedule();
            let id = setInterval(
                function() {
                    if (document.querySelector(".listViewWrapper > .listViewInstructorInformation > .list-view-crn-schedule")
                        && (document.querySelectorAll(".listViewWrapper").length > 1)) {
                        sendResponse({data: readSchedule()});
                        clearInterval(id);
                    }
                },
                500
            )
        }
        return true;
    }
)

function loadSchedule() {
    let scheduleTabButton = document.querySelector("#scheduleDetailsViewLink");
    scheduleTabButton.click();
    return 0;
}

function readSchedule() {
    let courseDivs = document.querySelectorAll(".listViewWrapper");
    let courses = [];
    courseDivs.forEach(getCourseInfo, courses);
    return courses;
}

function getCourseInfo(courseDiv) {
    courseInfo = {
        courseName:   undefined,
        daysOfWeek:   undefined,
        timeBegin:    undefined,
        timeEnd:      undefined,
        dateBegin:    undefined,
        dateEnd:      undefined,
        location:     undefined,
        instructors:  undefined,
        courseNumber: undefined
    }

    try {
        courseInfo.courseName = courseDiv.querySelector(".list-view-course-title > .section-details-link").textContent;

        courseInfo.daysOfWeek = courseDiv.querySelector(".list-view-pillbox").title.substring(10);

        let time = courseDiv.querySelectorAll(".listViewMeetingInformation > span")[2].textContent;
        time = removeSpaces(time);
        courseInfo.timeBegin = time.substring(0, 8);
        courseInfo.timeEnd = time.substring(11, 19);

        let dateRow = courseDiv.querySelector(".meetingTimes").textContent;
        let dates = dateRow.split(" -- ");
        courseInfo.dateBegin = dates[0];
        courseInfo.dateEnd = dates[1];

        let locationRow = courseDiv.querySelector(".listViewMeetingInformation").childNodes;
        courseInfo.location = locationRow[10].textContent + " - Room " + locationRow[12].textContent;

        let instructors = courseDiv.querySelectorAll(".listViewInstructorInformation > .email");
        let names = [];
        for (i=0; i<instructors.length; i++) {
            names[i] = instructors[i].textContent.split(", ");
            names[i] = names[i][1] + " " + names[i][0];
        }
        courseInfo.instructors = "Instructor" + ((names.length > 1) ? "s: " : ": ") + names.join(", ");

        let courseNumber = courseDiv.querySelector("div > .list-view-course-info-div > .list-view-subj-course-section");
        let courseNumberText = courseNumber.textContent;
        courseInfo.courseNumber = courseNumberText;
    }

    catch (TypeError) {
        courseInfo.location = "None";
    }

    courseInfo = formatCourseInfo(courseInfo);

    this.push(courseInfo);
}

function formatCourseInfo(courseInfo) {
    courseInfo.courseName = removeSpaces(courseInfo.courseName);
    
    courseInfo.daysOfWeek = removeSpaces(courseInfo.daysOfWeek);
    let daysOfWeek = courseInfo.daysOfWeek.split(",");
    for (i=0; i<daysOfWeek.length; i++) {
        daysOfWeek[i] = daysOfWeek[i].substring(0,2).toUpperCase();
    }
    courseInfo.daysOfWeek = daysOfWeek.join(",");
    
    courseInfo.timeBegin = removeSpaces(courseInfo.timeBegin);
    courseInfo.timeBegin = formatTime(courseInfo.timeBegin);

    courseInfo.timeEnd = removeSpaces(courseInfo.timeEnd);
    courseInfo.timeEnd = formatTime(courseInfo.timeEnd);

    courseInfo.dateBegin = removeSpaces(courseInfo.dateBegin);
    courseInfo.dateBegin = formatDate(courseInfo.dateBegin);
    
    courseInfo.dateEnd = removeSpaces(courseInfo.dateEnd);
    courseInfo.dateEnd = formatDate(courseInfo.dateEnd).replace(/-/g,"");
    
    courseInfo.location = removeSpaces(courseInfo.location);
    if (courseInfo.location.substring(0,4) === "None") {
        courseInfo.location = null;
        courseInfo.timeBegin = null;
        courseInfo.timeEnd = null;
        courseInfo.daysOfWeek = null;
    }

    courseInfo.instructors = removeSpaces(courseInfo.instructors);

    courseInfo.courseNumber = removeSpaces(courseInfo.courseNumber);

    return courseInfo;
}

function removeSpaces(paddedString) {
    return paddedString.replace(/\s\s+/g, ' ').trim();
}

function formatTime(time) {
    if ((time.substring(6, 8) === "PM") && (time.substring(0,2) !== "12")) {
        time = (parseInt(time.substring(0,2)) + 12).toString() + time.substring(2);
    }
    if ((time.substring(6, 8) === "AM") && (time.substring(0,2) === "12")) {
        time = "00" + time.substring(2);
    }
    time = time.substring(0, 5) + ":00";
    return time;
}

function formatDate(date) {
    date = date.substring(6) + "-" + date.substring(0,2) + "-" + date.substring(3,5);
    return date;
}