document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById('toggle-view')
    const listView = document.getElementById('list-view')
    const calendarView = document.getElementById('calendar-view')

    let calendarInitialized = false;
    let calendar;

    const eventsData = JSON.parse(
        document.getElementById("events-data").textContent
    )
    
    toggleBtn.onclick = () => {
        const showingList = listView.style.display !== 'none'

        if (showingList) {
            listView.style.display = 'none'
            calendarView.style.display = 'block'
            toggleBtn.textContent = "Switch to List View"

            document.querySelector('.event_section').classList.add('calendar-active');

            if (!calendarInitialized) {
                const calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
                    initialView: 'dayGridMonth',
                    contentHeight: 'auto',
                    titleFormat: { year: 'numeric', month: 'long' },
                    timeZone: 'Europe/Helsinki',
                    firstDay: 1,
                    eventTimeFormat: {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    },
                    events: eventsData                 
                })
                calendar.render()
                calendarInitialized = true
            }
        
        } else {
        calendarView.style.display = 'none'
        listView.style.display = 'block'
        toggleBtn.textContent = "Switch to Calendar View"

        document.querySelector('.event_section').classList.remove('calendar-active');
        } 
    }
})