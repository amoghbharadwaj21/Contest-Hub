import { useState, useEffect } from "react";
import { formatDate, formatSeconds, platformIcons } from "../utils";

// Define background and text colors for different contest statuses
const bgColor = {
    upcoming: "bg-green-600",
    ongoing: "bg-orange-600",
    completed: "bg-red-600"
};

const textColor = {
    upcoming: "text-white",
    ongoing: "text-white",
    completed: "text-white"
};

// Available calendar options for adding events
const calendarOptions = ["Google", "Outlook", "Apple"];

function Card({ platform, title, url, startTime, duration, isVisible }) {
    // Set up state variables to track countdown and contest status
    const [countdownSeconds, setCountdownSeconds] = useState(0);
    const [status, setStatus] = useState("");

    // Convert start and end times to Date objects
    const contestStartTime = new Date(startTime);
    const contestEndTime = new Date(startTime);
    contestEndTime.setSeconds(contestStartTime.getSeconds() + duration);

    // Update contest status and countdown timer
    useEffect(() => {
        const now = new Date();

        // Check if contest is upcoming, ongoing, or completed
        if (contestStartTime > now) {
            setStatus("Upcoming");
            setCountdownSeconds(((contestStartTime - now) / 1000).toFixed());
        } else if (contestStartTime <= now && now <= contestEndTime) {
            setStatus("Ongoing");
            setCountdownSeconds(((contestEndTime - now) / 1000).toFixed());
        } else {
            setStatus("Completed");
            setCountdownSeconds(0);
        }

        // Set up countdown timer
        const countdownTimer = setInterval(() => {
            const now = new Date();

            // Trigger a notification 5 minutes before start
            if (((contestStartTime - now) / 1000).toFixed() == 5 * 60) {
                new Notification(`${title} about to start in 5 minutes.`);
            }

            // Update contest status in real-time
            if (contestStartTime > now) {
                setStatus("Upcoming");
            } else if (contestStartTime <= now && now <= contestEndTime) {
                setStatus("Ongoing");
            } else {
                setStatus("Completed");
                clearInterval(countdownTimer);
            }

            // Decrement the countdown timer
            setCountdownSeconds(prevCountdownSeconds => prevCountdownSeconds - 1);
        }, 1000);

        // Clear the timer on component unmount
        return () => clearInterval(countdownTimer);
    }, [status]);

    // Function to add contest to selected calendar
    const handleAddToCal = (calendarType) => {
        // Format start and end times for calendar links
        const startDate = contestStartTime.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const endDate = contestEndTime.toISOString().replace(/-|:|\.\d\d\d/g, "");

        let calendarUrl;

        // Generate URL based on selected calendar type
        switch (calendarType) {
            case 'google':
                calendarUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(platform + ' - ' + title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent('Find more info at ' + url)}&location=Online&sf=true&output=xml`;
                break;
            case 'outlook':
                calendarUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(platform + ' - ' + title)}&startdt=${contestStartTime.toISOString()}&enddt=${contestEndTime.toISOString()}&body=${encodeURIComponent('Find more info at ' + url)}&location=Online`;
                break;
            case 'apple': {
                // Create a downloadable .ics file for Apple Calendar
                const icsContent = `
                    BEGIN:VCALENDAR
                    VERSION:2.0
                    BEGIN:VEVENT
                    DTSTART:${startDate}
                    DTEND:${endDate}
                    SUMMARY:${platform + ' - ' + title}
                    DESCRIPTION:Find more info at ${url}
                    LOCATION:Online
                    END:VEVENT
                    END:VCALENDAR
                `.trim();
                const blob = new Blob([icsContent], { type: 'text/calendar' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${platform + ' contest - ' + title}.ics`;
                link.click();
                return;
            }
            default:
                return;
        }

        // Open calendar URL in new tab
        window.open(calendarUrl, "_blank");
    };

    // Card component rendering
    return (
        <div className={`${isVisible ? 'flex' : 'hidden'} flex-col border p-4 gap-2 w-full bg-gray-800 text-white hover:border-gray-600 rounded-lg shadow-md`}>
            {/* Platform icon, name, and contest status */}
            <div className="flex gap-3 items-center">
                <img src={platformIcons[platform]} alt={`${platform} icon`} width={24} height={24} className="inline" />
                <span className="text-lg font-semibold text-gray-300">{platform}</span>
                <div className={`inline-flex items-center text-sm font-medium border px-2 py-0.5 rounded ${bgColor[status.toLowerCase()]} ${textColor[status.toLowerCase()]}`}>
                    {status}
                </div>
                {status !== "Completed" && (
                    <div className="inline-flex items-center text-sm border px-2 py-0.5 rounded text-gray-400 bg-gray-700">
                        {formatSeconds(countdownSeconds, true)}
                    </div>
                )}
            </div>

            {/* Contest title with link */}
            <div className="text-xl font-semibold underline text-blue-400 hover:text-blue-500">
                <a href={url} target="_blank" rel="noreferrer">{title}</a>
            </div>

            {/* Contest start time and duration */}
            <div className="flex gap-2">
                <div className="border px-2 py-1 rounded text-gray-400 bg-gray-700">
                    {formatDate(startTime)}
                </div>
                <div className="border px-2 py-1 rounded text-gray-400 bg-gray-700">
                    {formatSeconds(duration)}
                </div>
            </div>
        </div>
    );
}

export default Card;
