import os
import sys
import json
import requests, json
from icalendar import Calendar, Event
from datetime import datetime
from pytz import UTC

def print_json(type, message):
	print(json.dumps({'type': type, 'message': message}))
	sys.stdout.flush()

def get_person(fileName):
    return fileName[0 : fileName.find(".")].replace('_', ' ')

def calculate_length(event):
    start = event['DTSTART'].dt
    end = event['DTEND'].dt
    return end - start

def is_class(event):
    categories = event.get('categories')
    if len(categories) != 2:
        return False
    
    if categories[0] == "MyUCLA" and categories[1] == "Study List":
        summary = event.decoded('summary').decode("utf-8")
        if "Final Exam" not in summary:
            return True

    return False

def get_class_name(summary):
    classTypes = [ "DIS", "LEC", "LAB" ]
    for classType in classTypes:
        if classType in summary:
            return summary[0 : summary.find(classType)].strip()
    return summary

def get_class_days(bydays):
    # JS and PYthon have different weekday enums
    converter = { "MO" : 1, "TU" : 2, "WE" : 3, "TH" : 4, "FR" : 5 }

    convertedDates = []
    for day in bydays:
        convertedDates.append(converter.get(day))
    
    return convertedDates

def get_class_times(startDate, endDate):
    startTime = startDate.hour + (startDate.minute / 60)
    endTime = endDate.hour + (endDate.minute / 60)
    return [startTime, endTime]

moduleFolder = os.getcwd() + '\\modules\\MMM-classSchedules\\'
schedules = []
for file in os.listdir(moduleFolder):
    # print(file)
    if file.endswith(".ics"):
        person = { "person": get_person(file) }
        daily_schedule = [None] * 7
        i = open(moduleFolder + file, 'rb')
        ical = Calendar.from_ical(i.read())
        for component in ical.walk():
            if component.name == "VEVENT" and is_class(component):
                if component.get('rrule') != None:
                    for day in get_class_days(component.decoded('rrule')['byday']):
                        day_schedule = { 'day': day, 'classes': [] }
                        # print_json("DAY", day)
                        classTimes = get_class_times(component.get('dtstart').dt, component.get('dtend').dt)
                        class_dict = {'class': get_class_name(component.decoded('summary').decode("utf-8")), 'start': classTimes[0], 'end': classTimes[1]}
                        class_schedule = [get_class_name(component.decoded('summary').decode("utf-8")), get_class_times(component.get('dtstart').dt, component.get('dtend').dt)]

                        if daily_schedule[day] == None:
                            daily_schedule[day] = [ class_dict ]
                        else:
                            classIndex = 0
                            while classIndex < len(daily_schedule[day]) and class_dict['end'] > daily_schedule[day][classIndex]['start']:
                                classIndex += 1
                            daily_schedule[day].insert(classIndex, class_dict)
                                
                        day_schedule['classes'] = day_schedule['classes'].append(class_dict)
                        # print_json("TEST", class_schedule)
                        # print (day)
                        # print(get_class_name(component.decoded('summary').decode("utf-8")))
                        # print(get_class_times(component.get('dtstart').dt, component.get('dtend').dt))
            
        person['classes'] = daily_schedule
        print_json("PERSON", person)