import React from 'react'
import PropTypes from 'prop-types'
import { startCase } from 'lodash'
import { FaChevronUp, FaChevronDown } from 'react-icons/fa'

import { RESOLUTIONS } from '../../constants'

import './TimelineTools.scss'

/**
 * Renders the zoom buttons for the timeline
 * @param {Object} param0
 * @param {Integer} param0.maxZoom Max zoom level to allow
 * @param {Integer} param0.minZoom Min zoom level to allow
 * @param {Integer} param0.zoomLevel Current zoom level of the timeline
 * @param {Function} param0.onChangeZoomLevel Callback function for changing the zoom level
 */
export const TimelineTools = ({
  maxZoom,
  minZoom,
  zoomLevel,
  onChangeZoomLevel
}) => (
  <section className="timeline__tools">
    <section className="timeline__tool-section">
      <button
        className="timeline__tool-action"
        type="button"
        disabled={zoomLevel === maxZoom}
        onClick={() => onChangeZoomLevel(zoomLevel + 1)}
        title="Increase zoom level"
        label="Increase zoom level"
      >
        <FaChevronUp />
      </button>
      <span className="timeline__tool-label">
        {startCase(RESOLUTIONS[zoomLevel])}
      </span>
      <button
        className="timeline__tool-action"
        type="button"
        disabled={zoomLevel === minZoom}
        onClick={() => onChangeZoomLevel(zoomLevel - 1)}
        title="Decrease zoom level"
        label="Decrease zoom level"
      >
        <FaChevronDown />
      </button>
    </section>
  </section>
)

TimelineTools.propTypes = {
  maxZoom: PropTypes.number.isRequired,
  minZoom: PropTypes.number.isRequired,
  zoomLevel: PropTypes.number.isRequired,
  onChangeZoomLevel: PropTypes.func.isRequired
}
