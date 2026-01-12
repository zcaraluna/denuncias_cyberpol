'use client'

import { useState, useRef, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onApply: () => void
  onCancel: () => void
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onCancel
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingStart, setSelectingStart] = useState(true)
  const [tempStartDate, setTempStartDate] = useState<string>(startDate)
  const [tempEndDate, setTempEndDate] = useState<string>(endDate)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTempStartDate(startDate)
    setTempEndDate(endDate)
  }, [startDate, endDate])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])


  const handleQuickSelect = (days: number) => {
    const end = new Date()
    const start = subDays(end, days - 1)
    setTempStartDate(format(start, 'yyyy-MM-dd'))
    setTempEndDate(format(end, 'yyyy-MM-dd'))
  }

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    
    if (selectingStart || !tempStartDate) {
      setTempStartDate(dateStr)
      setTempEndDate('')
      setSelectingStart(false)
    } else {
      if (new Date(dateStr) < new Date(tempStartDate)) {
        setTempEndDate(tempStartDate)
        setTempStartDate(dateStr)
      } else {
        setTempEndDate(dateStr)
      }
      setSelectingStart(true)
    }
  }

  const handleApply = () => {
    onStartDateChange(tempStartDate)
    onEndDateChange(tempEndDate)
    onApply()
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempStartDate(startDate)
    setTempEndDate(endDate)
    onCancel()
    setIsOpen(false)
  }

  const isDateInRange = (date: Date) => {
    if (!tempStartDate || !tempEndDate) return false
    const start = new Date(tempStartDate)
    const end = new Date(tempEndDate)
    return isWithinInterval(date, { start, end })
  }

  const isDateStart = (date: Date) => {
    if (!tempStartDate) return false
    return isSameDay(date, new Date(tempStartDate))
  }

  const isDateEnd = (date: Date) => {
    if (!tempEndDate) return false
    return isSameDay(date, new Date(tempEndDate))
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']
  
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  
  const monthAbbr = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ]
  
  const formatDateRangeSpanish = () => {
    if (!tempStartDate && !tempEndDate) return 'Seleccionar rango de fechas'
    if (tempStartDate && !tempEndDate) {
      const date = new Date(tempStartDate)
      return `${date.getDate()} ${monthAbbr[date.getMonth()]}`
    }
    if (tempStartDate && tempEndDate) {
      const start = new Date(tempStartDate)
      const end = new Date(tempEndDate)
      const startStr = `${start.getDate()} ${monthAbbr[start.getMonth()]}`
      const endStr = `${end.getDate()} ${monthAbbr[end.getMonth()]}`
      return `${startStr} - ${endStr}`
    }
    return 'Seleccionar rango de fechas'
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white hover:bg-gray-50 transition flex items-center justify-between"
      >
        <span className="text-sm text-gray-700">{formatDateRangeSpanish()}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-full md:w-auto md:min-w-[400px]">
          {/* Quick select buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleQuickSelect(1)}
              className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition"
            >
              1d
            </button>
            <button
              onClick={() => handleQuickSelect(7)}
              className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition"
            >
              7d
            </button>
            <button
              onClick={() => handleQuickSelect(30)}
              className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition"
            >
              30d
            </button>
          </div>

          {/* Calendar */}
          <div className="mb-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-sm font-medium text-gray-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const inRange = isDateInRange(day)
                const isStart = isDateStart(day)
                const isEnd = isDateEnd(day)
                const isToday = isSameDay(day, new Date())

                return (
                  <button
                    key={day.toString()}
                    onClick={() => handleDateClick(day)}
                    className={`
                      h-8 text-sm rounded transition
                      ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                      ${inRange && !isStart && !isEnd ? 'bg-blue-50' : ''}
                      ${isStart || isEnd ? 'bg-blue-600 text-white font-medium' : ''}
                      ${isToday && !isStart && !isEnd ? 'border-2 border-blue-600' : ''}
                      ${isCurrentMonth && !inRange && !isStart && !isEnd ? 'hover:bg-gray-100' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
