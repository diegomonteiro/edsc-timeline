import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import PropTypes from 'prop-types'

import { startCase } from 'lodash'

import { calculateTimeIntervals } from './utils/calculateTimeIntervals'
import { determineIntervalLabel } from './utils/determineIntervalLabel'
import { determineScaledSize } from './utils/determineScaledSize'
import { getCenterTemporal } from './utils/getCenterTemporal'
import { getPositionByTimestamp } from './utils/getPositionByTimestamp'
import { roundTime } from './utils/roundTime'

import {
  RESOLUTIONS,
  INTERVAL_BUFFER,
  INTERVAL_THRESHOLD,
  // MS_PER_DAY,
  // MS_PER_HOUR,
  MS_PER_MINUTE,
  MS_PER_MONTH,
  MS_PER_HOUR
} from './constants'

import './index.scss'
import { getIntervalsDuration } from './utils/getIntervalsDuration'


export const EDSCTimeline = ({
  center,
  show,
  minZoom,
  maxZoom,
  onTimelineMove,
  zoom
}) => {
  // Ref for the timeline to access the DOM element
  const timelineListRef = useRef(null)

  // Ref for the timeline to access the DOM element
  const timelineWrapperRef = useRef(null)

  // Combine scroll positions state with scroll position from a scroll event to determine the scroll direction
  const [scrollDirection, setScrollDirection] = useState(null)

  // Store the zoom level and allow for changing props to modify the state
  const [zoomLevel, setZoomLevel] = useState(zoom)

  // Store the pixel width of the list of intervals
  const [intervalListWidthInPixels, setIntervalListWidthInPixels] = useState(null)

  // Store the pixel value of the center of the list of intervals
  const [intervalsCenterInPixels, setIntervalsCenterInPixels] = useState(null)

  const [isLoaded, setIsLoaded] = useState(false)

  const [dragging, setDragging] = useState(false)

  const [timelineStartPosition, setTimelineStartPosition] = useState(null)

  const [timelineDragStartPosition, setTimelineDragStartPosition] = useState(null)

  const [timelinePosition, setTimelinePosition] = useState({ top: 0, left: 0 })

  // Store calculated time intervals that power the display of the timeline dates
  const [timeIntervals, setTimeIntervals] = useState(() => [
    ...calculateTimeIntervals(center, zoomLevel, INTERVAL_BUFFER, true),
    roundTime(center, zoomLevel),
    ...calculateTimeIntervals(center, zoomLevel, INTERVAL_BUFFER, false)
  ])

  /**
   * DEBUG USEEFFECTS
   */

  // useEffect(() => {
  //   console.log('[DEBUG]: TIME_INTERVALS.LENGTH', timeIntervals.length)
  // }, [timeIntervals])

  // useEffect(() => {
  //   console.log('[DEBUG]: SCROLL_DIRECTION ', scrollDirection)
  // }, [scrollDirection])

  // useEffect(() => {
  //   console.log('[DEBUG]: SCROLL_POSITION ', scrollPosition)
  // }, [scrollPosition])

  /**
   * END DEBUG USEEFFECTS
   */

  useLayoutEffect(() => {
    const newWidth = intervalListWidthInPixels / 2
    if (timelineWrapperRef.current && intervalsCenterInPixels !== newWidth) {
      // When the timeline wrapper DOM element is available determine
      // the center value of the element in pixels

      setIntervalsCenterInPixels(intervalListWidthInPixels / 2)
    }
  }, [intervalListWidthInPixels, timelineWrapperRef])

  const handleMove = () => {
    if (onTimelineMove) {
      // const timelineWrapperWidth = timelineWrapperRef.current.getBoundingClientRect().width

      const centeredDate = getCenterTemporal({
        intervalListWidthInPixels,
        timeIntervals,
        timelinePosition,
        timelineWrapperRef,
        zoomLevel
      })
      onTimelineMove({ center: centeredDate, interval: zoomLevel })
    }
  }

  useLayoutEffect(() => {
    // Anytime new time intervals are calcualted update the pixel width of their container
    const duration = getIntervalsDuration(timeIntervals, zoomLevel)

    const timelineWrapperWidth = timelineWrapperRef.current.getBoundingClientRect().width

    const width = determineScaledSize(duration, zoomLevel, timelineWrapperWidth)

    setIntervalListWidthInPixels(width)
  }, [timeIntervals])

  useEffect(() => {
    if (timelineWrapperRef.current && !isLoaded && intervalsCenterInPixels) {
      // Center the timeline on load
      const timelineWrapperWidth = timelineWrapperRef.current.getBoundingClientRect().width
      const left = -(
        getPositionByTimestamp(
          center,
          timeIntervals,
          zoomLevel,
          timelineWrapperWidth
        ) - (timelineWrapperWidth / 2)
      )
      setTimelinePosition({
        ...timelinePosition,
        left
      })
      const centeredDate = getCenterTemporal({
        intervalListWidthInPixels,
        timeIntervals,
        timelinePosition: {
          left
        },
        timelineWrapperRef,
        zoomLevel
      })
      onTimelineMove({ center: centeredDate, interval: zoomLevel })
      setIsLoaded(true)
    }
  }, [intervalsCenterInPixels, center])

  // Update the internal state when/if the prop changes
  useEffect(() => {
    setZoomLevel(zoom)
  }, [zoom])

  const onTimelineDragStart = (e) => {
    const { pageX: mouseX } = e
    setDragging(true)
    setTimelineStartPosition(timelinePosition)
    setTimelineDragStartPosition(mouseX)
  }

  const onTimelineDragEnd = () => {
    if (dragging) {
      setDragging(false)
      setTimelineStartPosition(null)
      setTimelineDragStartPosition(null)
    }
  }

  /**
   * Scroll the timeline backward (up, or to the left)
   */
  const scrollBackward = () => {
    // If the underlying dataset has grown larger than desired, trim off 1 buffers
    // worth of data from opposite of the array
    let currentTimeIntervals = timeIntervals
    if (timeIntervals.length > (INTERVAL_BUFFER * 3)) {
      currentTimeIntervals = currentTimeIntervals.slice(
        0, (currentTimeIntervals.length - INTERVAL_BUFFER)
      )
    }

    const nextIntervals = calculateTimeIntervals(
      timeIntervals[0],
      zoomLevel,
      INTERVAL_BUFFER,
      true
    )

    const allIntervals = [
      ...nextIntervals,
      ...currentTimeIntervals
    ]

    setTimeIntervals(allIntervals)

    const startTime = nextIntervals[0]
    const lastInterval = nextIntervals[nextIntervals.length - 1]
    const [endTime] = calculateTimeIntervals(lastInterval, zoomLevel, 1, false)

    const duration = endTime - startTime

    const timelineWrapperWidth = timelineWrapperRef.current.getBoundingClientRect().width

    const intervalsWidth = determineScaledSize(duration, zoomLevel, timelineWrapperWidth)

    if (timelineWrapperRef.current) {
      // Appending data to the beginning of the underlying dataset requires us to scroll the user
      // to back to the right, outside of the window that triggers another page to be loaded
      // timelineListRef.current.style.transform = `translateX(${timelineStartPosition.left - intervalsWidth}px)`
      setTimelineStartPosition({
        ...timelineStartPosition,
        left: timelineStartPosition.left - intervalsWidth
      })
    }
  }

  /**
   * Scroll the timeline forward (down, or to the right)
   */
  const scrollForward = () => {
    let translationAdjustment = 0

    // If the underlying dataset has grown larger than desired, trim off 1 buffers
    // worth of data from opposite of the array
    let currentTimeIntervals = timeIntervals
    if (timeIntervals.length > (INTERVAL_BUFFER * 3)) {
      const startTime = currentTimeIntervals[0]
      const lastInterval = currentTimeIntervals[INTERVAL_BUFFER - 1]
      const [endTime] = calculateTimeIntervals(lastInterval, zoomLevel, 1, false)

      const duration = endTime - startTime

      currentTimeIntervals = currentTimeIntervals.slice(
        INTERVAL_BUFFER, currentTimeIntervals.length
      )

      const timelineWrapperWidth = timelineWrapperRef.current.getBoundingClientRect().width

      translationAdjustment = determineScaledSize(duration, zoomLevel, timelineWrapperWidth)

      setTimelineStartPosition({
        ...timelineStartPosition,
        left: timelineStartPosition.left + translationAdjustment
      })
    }

    setTimeIntervals([
      ...currentTimeIntervals,
      ...calculateTimeIntervals(
        timeIntervals[timeIntervals.length - 1], zoomLevel, INTERVAL_BUFFER, false
      )
    ])
  }

  const onTimelineDrag = (e) => {
    requestAnimationFrame(() => {
      if (dragging) {
        const { pageX: mouseX } = e
        const amountDragged = mouseX - timelineDragStartPosition
        const left = timelineStartPosition.left + amountDragged
        setTimelinePosition({
          ...timelinePosition,
          left
        })

        const wrapperWidth = timelineWrapperRef.current.getBoundingClientRect().width

        const scrollDirectionIsForward = timelineStartPosition.left - timelinePosition.left > 0

        if (scrollDirectionIsForward && scrollDirection !== 'forward') {
          setScrollDirection('forward')
        }

        if (!scrollDirectionIsForward && scrollDirection !== 'backward') {
          setScrollDirection('backward')
        }

        const loadMoreWindow = 500

        if (scrollDirection === 'backward') {
          // If the previous scroll position is outside of the window to trigger another page and
          // the scroll position attached to the event is within the window
          const originalDistanceFromEdge = timelineStartPosition.left * -1
          const distanceFromEdge = timelinePosition.left * -1

          if (originalDistanceFromEdge > loadMoreWindow && distanceFromEdge <= loadMoreWindow) {
            scrollBackward()
          }
        }

        if (scrollDirection === 'forward') {
          const listWidth = timelineListRef.current.getBoundingClientRect().width

          // Determine the previous pixel position of the right edge of the timeline
          const originalDistanceFromEdge = -(
            wrapperWidth - (timelineStartPosition.left + listWidth)
          )
          const distanceFromEdge = -(wrapperWidth - (timelinePosition.left + listWidth))

          // If the previous scroll position is outside of the window to trigger another page and
          // the scroll position attached to the event is within the window
          if (originalDistanceFromEdge > loadMoreWindow && distanceFromEdge <= loadMoreWindow) {
            scrollForward()
          }
        }

        handleMove()
      }
    })
  }

  const onTimelineMouseDown = (e) => {
    onTimelineDragStart(e)
  }

  const onWindowMouseUp = () => {
    onTimelineDragEnd()
  }

  const onWindowMouseMove = (e) => {
    onTimelineDrag(e)
  }

  useEffect(() => {
    window.addEventListener('mouseup', onWindowMouseUp)
    window.addEventListener('mousemove', onWindowMouseMove)

    return () => {
      window.removeEventListener('mouseup', onWindowMouseUp)
      window.removeEventListener('mousemove', onWindowMouseMove)
    }
  }, [dragging, timelinePosition, timelineDragStartPosition, scrollDirection])

  /**
   * Callback to change the current zoom level and recalculate timeIntervals
   * @param {Integer} newZoomLevel New desired zoom level
   */
  const onChangeZoomLevel = (newZoomLevel) => {
    if (newZoomLevel >= minZoom && zoomLevel <= maxZoom) {
      // const timelineWrapperWidth = timelineWrapperRef.current.getBoundingClientRect().width
      const centeredDate = getCenterTemporal({
        intervalListWidthInPixels,
        timeIntervals,
        timelinePosition,
        timelineWrapperRef,
        zoomLevel
      })

      const newIntervals = [
        ...calculateTimeIntervals(centeredDate, newZoomLevel, INTERVAL_BUFFER, true),
        roundTime(centeredDate, newZoomLevel),
        ...calculateTimeIntervals(centeredDate, newZoomLevel, INTERVAL_BUFFER, false)
      ]

      setTimeIntervals(newIntervals)
      setZoomLevel(newZoomLevel)

      const timelineWrapperWidth = timelineWrapperRef.current.getBoundingClientRect().width
      const left = -(
        getPositionByTimestamp(
          centeredDate,
          newIntervals,
          newZoomLevel,
          timelineWrapperWidth
        ) - (timelineWrapperWidth / 2)
      )

      setTimelinePosition({
        ...timelinePosition,
        left
      })

      onTimelineMove({ center: centeredDate, interval: newZoomLevel })
    }
  }

  return (
    <>
      {
        show && (
          <div className="timeline">
            <section>
              <button
                type="button"
                disabled={zoomLevel === maxZoom}
                onClick={() => onChangeZoomLevel(zoomLevel + 1)}
              >
                -
              </button>
              <span>
                {startCase(RESOLUTIONS[zoomLevel])}
                {zoomLevel}
              </span>
              <button
                type="button"
                disabled={zoomLevel === minZoom}
                onClick={() => onChangeZoomLevel(zoomLevel - 1)}
              >
                +
              </button>
            </section>
            <div className="timeline__outer-wrapper">
              <span className="timeline__timeline" />
              <div
                ref={timelineWrapperRef}
                className="timeline__wrapper"
              >
                <span className="timeline__center" />
                <div
                  ref={timelineListRef}
                  className="timeline__list"
                  style={{
                    width: `${intervalListWidthInPixels}px`,
                    transform: `translateX(${timelinePosition.left}px)`
                  }}
                  onMouseDown={onTimelineMouseDown}
                  role="button"
                  tabIndex="0"
                >
                  <span className="timeline__marker" style={{ left: intervalsCenterInPixels }} />
                  {
                    timeIntervals && timeIntervals.map((interval, i) => {
                      const [text, ...subText] = determineIntervalLabel(interval, zoomLevel)

                      const startTime = interval
                      let endTime

                      if (timeIntervals[i + 1] !== null) {
                        endTime = timeIntervals[i + 1]
                      } else {
                        const lastInterval = timeIntervals[timeIntervals.length - 1]
                        const [nextEndTime] = calculateTimeIntervals(
                          lastInterval,
                          zoomLevel,
                          1,
                          false
                        )
                        endTime = nextEndTime
                      }

                      const duration = endTime - startTime

                      if (timelineWrapperRef.current) {
                        const timelineWrapperWidth = timelineWrapperRef.current
                          .getBoundingClientRect().width

                        const width = determineScaledSize(duration, zoomLevel, timelineWrapperWidth)

                        return (
                          <div key={interval} className="timeline__interval" style={{ width }}>
                            <span className="timeline__interval-label">{text}</span>
                            <span className="timeline__interval-section-label">{subText}</span>
                          </div>
                        )
                      }
                    })
                  }
                </div>
              </div>
            </div>
          </div>
        )
      }
    </>
  )
}

EDSCTimeline.defaultProps = {
  intervalWidth: 200,
  center: new Date().getTime(),
  maxDate: new Date().getTime(),
  minDate: 0,
  onFocusedTemporalSet: null,
  onTemporalSet: null,
  onTimelineMove: null,
  show: true,
  minZoom: 1,
  maxZoom: 5,
  zoom: 3
}

EDSCTimeline.propTypes = {
  center: PropTypes.number,
  maxDate: PropTypes.number, // maximum date timeline will allow scrolling
  minDate: PropTypes.number, // minimum date timeline will allow scrolling
  onFocusedTemporalSet: PropTypes.func,
  onTemporalSet: PropTypes.func,
  onTimelineMove: PropTypes.func,
  resolution: PropTypes.string, // resolution of timeline day/month/etc.
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string, // ?
      title: PropTypes.string,
      color: PropTypes.string,
      intervals: PropTypes.arrayOf(
        PropTypes.arrayOf(
          PropTypes.number
        ) // [start, end, number of items in interval]
      ).isRequired,
    })
  ).isRequired,
  show: PropTypes.bool,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,
  zoom: PropTypes.number
}

export default EDSCTimeline
