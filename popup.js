let exportScheduleButton = document.getElementById("addToCalendar");
exportScheduleButton.addEventListener("click", pullTabInfo);

let bannerUrl = "https://nubanner.neu.edu/StudentRegistrationSsb/ssb/registrationHistory/registrationHistory";
let partialBannerUrl = "nubanner.neu.edu/StudentRegistrationSsb/ssb/registrationHistory";

chrome.runtime.onMessage.addListener(
    function receiveMessage(request) {
        if (request.action === "pullTabInfo") {
            pullTabInfo();
        }
    }
)

function writeOutput(string, color="green") {
    let contentBox = document.getElementById("content");
    let output = document.createElement("p");
    output.textContent = "> " + string;
    output.style.color = color;
    contentBox.appendChild(output);
    contentBox.style.display = "block";
}

async function openBanner() {
    chrome.tabs.update({url: bannerUrl, active: true});
}

function pullTabInfo() {
    chrome.tabs.query({active: true, currentWindow: true},
        function(tabs) {
            let currentTab = tabs[0];
            exportSchedule(currentTab.url, currentTab.id);
        }      
    )
}

function exportSchedule(currentTabUrl, currentTabId) {
    if(!confirmBannerUrl(currentTabUrl)) {
        getSchedule(currentTabId);
    }
}

function confirmBannerUrl(currentTabUrl) {
    if (currentTabUrl.includes(partialBannerUrl)) {
        return 0;
    }
    else {
        openBanner();
        return 1;
    }
}

function getSchedule(currentTabId) {
    chrome.tabs.sendMessage(currentTabId, {action: "readSchedule"}, function(response) {
        addScheduleToCalendar(response.data);
    });
}

function addScheduleToCalendar(scheduleArray) {
    chrome.identity.getAuthToken({"interactive": true},
        async function(token) {
            let calendarId = createCalendar(token);
            for (i=0; i<scheduleArray.length; i++) {
                if (scheduleArray[i].location != null) {
                    code = await addEventToCalendar(scheduleArray[i], calendarId, token, i+1);
                    if (code == 403) {
                        writeOutput("Fail. (Error 403) Retrying...", "red");
                        for(i=1; i++; i<=5) {
                            await new Promise(r => setTimeout(r, i*150));
                            if (addEventToCalendar(scheduleArray[i], token) == 403) {
                                continue;
                            }
                            else {
                                break;
                            }
                        }
                    }
                }
            } 
            writeOutput("Finished!", "#3333ff")  
        }
    );
}