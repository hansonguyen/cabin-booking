"use client"
import format from "date-fns/format";
import getDay from "date-fns/getDay";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import React, { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./globals.css";


const locales = {
    "en-US": require("date-fns/locale/en-US"),
};
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const events = [
    {
        title: "Lawrence",
        allDay: true,
        start: new Date(2023, 8, 1),
        end: new Date(2023, 9, 12),
    },

];

function App() {
    const [newEvent, setNewEvent] = useState({ title: "", start: "", end: "" });
    const [allEvents, setAllEvents] = useState(events);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);

    function handleAddEvent() {
        for (let i=0; i<allEvents.length; i++){

            const d1 = new Date (allEvents[i].start);
            const d2 = new Date(newEvent.start);
            const d3 = new Date(allEvents[i].end);
            const d4 = new Date(newEvent.end);

             if (
              ( (d1  <= d2) && (d2 <= d3) ) || ( (d1  <= d4) &&
                (d4 <= d3) )
              )
            {   
                alert("CLASH"); 
                break;
             }
    
        }

        setAllEvents([...allEvents, newEvent]);
        setNewEvent({ title: "", start: "", end: "" }); // Reset newEvent state
    }

    function handleDeleteEvent() {
        if (eventToDelete) {
            const updatedEvents = allEvents.filter(event => event !== eventToDelete);
            setAllEvents(updatedEvents);
            setShowDeletePopup(false);
            setEventToDelete(null);
        }
    }

    return (
        <div className="App">

            <h1>Cabin Calendar</h1>
            <h2>Add New Event</h2>
            <div >
                <input type="text" placeholder="Name" style={{ width: "20%", marginRight: "10px" }} value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
                <DatePicker placeholderText="Start Date" style={{ marginRight: "10px", marginBottom: "10px"}} selected={newEvent.start} onChange={(start) => setNewEvent({ ...newEvent, start })} />
                <DatePicker placeholderText="End Date" selected={newEvent.end} onChange={(end) => setNewEvent({ ...newEvent, end })} />
                <button style={{ marginTop: "10px" }} onClick={handleAddEvent}>
                    Add Event
                </button>
            </div>
            
            <Calendar
                localizer={localizer}
                events={allEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500, margin: "130px" }}
                onSelectEvent={event => {
                    setEventToDelete(event);
                    setShowDeletePopup(true);
                }}
            />

            {showDeletePopup && (
                <div className="delete-popup">
                    <p>Are you sure you want to delete this event?</p>
                    <button onClick={handleDeleteEvent}>Delete</button>
                    <button onClick={() => setShowDeletePopup(false)}>Cancel</button>
                </div>
            )}
        </div>
    );
}

export default App;