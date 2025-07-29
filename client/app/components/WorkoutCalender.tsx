import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WorkoutCalendarProps {
  workoutDates: string[];
  currentMonth: number;
  currentYear: number;
  daysInMonth: number;
}

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({
  workoutDates,
  currentMonth,
  currentYear,
  daysInMonth,
}) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get the first day of the month (0 = Sunday, 6 = Saturday)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Create array of dates for the calendar
  const calendarDays = [];
  
  // Add empty spaces for days before the month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Check if a date has a workout
  const hasWorkout = (day: number | null) => {
    if (!day) return false;
    const dateStr = new Date(currentYear, currentMonth, day).toDateString();
    return workoutDates.includes(dateStr);
  };

  // Check if it's today
  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.monthTitle}>
        {monthNames[currentMonth]} {currentYear}
      </Text>
      
      {/* Day names header */}
      <View style={styles.dayNamesRow}>
        {dayNames.map((name) => (
          <Text key={name} style={styles.dayName}>
            {name}
          </Text>
        ))}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => (
          <View 
            key={index} 
            style={[
              styles.dayCell,
              day && hasWorkout(day) && styles.workoutDay,
              day && isToday(day) && styles.todayCell,
            ]}
          >
            {day && (
              <Text 
                style={[
                  styles.dayText,
                  hasWorkout(day) && styles.workoutDayText,
                  isToday(day) && styles.todayText,
                ]}
              >
                {day}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  workoutDay: {
    backgroundColor: '#485c11',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  dayText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '400',
  },
  workoutDayText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  todayText: {
    fontWeight: '600',
  },
});

export default WorkoutCalendar;