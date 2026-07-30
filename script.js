const API_URL = "https://script.google.com/macros/s/AKfycbz8R9dhLS8jQSu1e1vdICwPIjg4EKqgh6Np8Se-rTwUSkMhwOSjagcPhuMkWx1mOek3_A/exec";

let currentLecturer = {
    id: "",
    name: "",
    subject: "",
    phone: "",
    schedule: "",
    googleForm: ""
};

window.addEventListener("DOMContentLoaded", () => {
    fetchCurrentLecturer();
});

function fetchCurrentLecturer() {
    fetch(API_URL)
        .then(res => res.json())
        .then(res => {
            if (res.success && res.data) {
                currentLecturer = res.data;
                // 名字和科目分开独立显示
                document.getElementById("lecturerName").innerText = currentLecturer.name;
                document.getElementById("lecturerSubject").innerText = "Subject: " + currentLecturer.subject;
                document.getElementById("lecturerSchedule").innerText = currentLecturer.schedule;
            } else {
                document.getElementById("lecturerName").innerText = "No active lecturer";
                document.getElementById("lecturerSubject").innerText = "Subject: -";
                document.getElementById("lecturerSchedule").innerText = "-";
            }
        })
        .catch(err => console.error("Failed to load current lecturer:", err));
}

function submitAttendance() {
    let studentID = document.getElementById("studentID").value.trim();
    if (studentID === "") {
        alert("Please enter Student ID");
        return;
    }

    document.getElementById("attendanceStatus").innerHTML = "📍 Getting GPS location...";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            let payload = {
                action: "attendance",
                studentID: studentID,
                subject: currentLecturer.subject || "General",
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };

            document.getElementById("attendanceStatus").innerHTML = "⏳ Submitting attendance...";

            fetch(API_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(result => {
                if (result.status === "SUCCESS") {
                    if (result.validation === "Success") {
                        document.getElementById("attendanceStatus").innerHTML = "✅ Attendance Success! (" + result.distance + "m)";
                    } else {
                        document.getElementById("attendanceStatus").innerHTML = "❌ Rejected: Out of classroom radius (" + result.distance + "m)";
                    }
                } else {
                    document.getElementById("attendanceStatus").innerHTML = "❌ Submission failed.";
                }
            });
        },
        () => {
            document.getElementById("attendanceStatus").innerHTML = "❌ Please enable GPS location access.";
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function submitFeedback(feedbackValue) {
    let studentID = document.getElementById("studentID").value.trim();
    if (studentID === "") {
        alert("Please enter your Student ID first.");
        return;
    }

    const btnUnderstand = document.getElementById("btnUnderstand");
    const btnNotUnderstand = document.getElementById("btnNotUnderstand");

    if (feedbackValue === 'Understand') {
        btnUnderstand.classList.add("active-green");
        btnNotUnderstand.classList.remove("active-red");
    } else {
        btnNotUnderstand.classList.add("active-red");
        btnUnderstand.classList.remove("active-green");
    }

    let payload = {
        action: "feedback",
        studentID: studentID,
        subject: currentLecturer.subject || "General",
        feedback: feedbackValue
    };

    document.getElementById("feedbackStatus").innerHTML = "⏳ Sending live feedback...";

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(result => {
        if (result.status === "SUCCESS") {
            document.getElementById("feedbackStatus").innerHTML = "✅ Feedback sent: <b>" + feedbackValue + "</b>";
        }
    });
}

// 自动带入 Google Form Prefilled 链接并同步输入框的文字
function sendRequest() {
    let requestText = document.getElementById("lecturerRequest").value.trim();
    if (requestText === "") {
        alert("Please enter your request or question first.");
        return;
    }
    
    let formBase = currentLecturer.googleForm;
    if (!formBase) {
        alert("Google Form Pre-filled link not configured for this lecturer.");
        return;
    }

    // 将用户打的字自动拼接到 G 列的预填链接后面
    let finalUrl = formBase + encodeURIComponent(requestText);
    window.open(finalUrl, "_blank");
}

function openWhatsApp() {
    if (!currentLecturer.phone) {
        alert("Phone number not available.");
        return;
    }
    let message = encodeURIComponent("Hello " + currentLecturer.name + ", I would like to arrange a consultation.");
    window.open("https://wa.me/" + currentLecturer.phone + "?text=" + message, "_blank");
}