import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

import { TimelineList } from '../TimelineList'
import { TimelineInterval } from '../../TimelineInterval/TimelineInterval'

Enzyme.configure({ adapter: new Adapter() })

function setup(overrideProps) {
  const props = {
    dragging: false,
    draggingTemporalStart: false,
    draggingTemporalEnd: false,
    intervalListWidthInPixels: 3,
    temporalRange: {},
    temporalRangeMouseOverPosition: null,
    timeIntervals: [
      new Date('2021-01-01').getTime(),
      new Date('2021-02-01').getTime(),
      new Date('2021-03-01').getTime(),
      new Date('2021-04-01').getTime(),
      new Date('2021-05-01').getTime()
    ],
    timelineListRef: {},
    timelinePosition: {},
    timelineWrapperRef: {
      current: {
        getBoundingClientRect: jest.fn(() => ({ width: 1240 }))
      }
    },
    zoomLevel: 3,
    onTimelineMouseDown: jest.fn(),
    onTimelineMouseMove: jest.fn(),
    onTemporalMarkerMouseDown: jest.fn(),
    ...overrideProps
  }

  const enzymeWrapper = shallow(<TimelineList {...props} />)

  return {
    enzymeWrapper,
    props
  }
}

describe('TimelineList component', () => {
  test('renders a TimelineInterval component for each timeInterval', () => {
    const { enzymeWrapper, props } = setup()

    expect(enzymeWrapper.find(TimelineInterval).length).toEqual(props.timeIntervals.length)
  })

  test('returns null if timelineWrapperRef.current is undefined', () => {
    const { enzymeWrapper } = setup({
      timelineWrapperRef: {}
    })

    expect(enzymeWrapper.isEmptyRender()).toBeTruthy()
  })

  describe('when the timeline is not dragging', () => {
    test('renders the correct classnames', () => {
      const { enzymeWrapper } = setup({
        temporalRange: {
          start: new Date('2021-03').getTime(),
          end: new Date('2021-04').getTime()
        }
      })

      expect(enzymeWrapper.props().className).not.toContain('timeline-list--is-dragging')
    })
  })

  describe('when the timeline is dragging', () => {
    test('renders the correct classnames', () => {
      const { enzymeWrapper } = setup({
        dragging: true,
        temporalRange: {
          start: new Date('2021-03').getTime(),
          end: new Date('2021-04').getTime()
        }
      })

      expect(enzymeWrapper.props().className).toContain('timeline-list--is-dragging')
    })
  })

  describe('Temporal markers', () => {
    test('renders markers if temporal range has start and end', () => {
      const { enzymeWrapper } = setup({
        temporalRange: {
          start: new Date('2021-03').getTime(),
          end: new Date('2021-04').getTime()
        }
      })

      expect(enzymeWrapper.find('.timeline-list__temporal-start').exists()).toBeTruthy()
      expect(enzymeWrapper.find('.timeline-list__temporal-end').exists()).toBeTruthy()

      expect(enzymeWrapper.find('.timeline-list__temporal-start').props().style).toEqual({
        left: 200.43835616438355
      })
      expect(enzymeWrapper.find('.timeline-list__temporal-end').props().style).toEqual({
        left: 305.75342465753425
      })
    })

    test('does not render markers if temporal range does not have an end', () => {
      const { enzymeWrapper } = setup({
        temporalRange: {
          start: new Date('2021-03').getTime()
        }
      })

      expect(enzymeWrapper.find('.timeline-list__temporal-start').exists()).toBeFalsy()
      expect(enzymeWrapper.find('.timeline-list__temporal-end').exists()).toBeFalsy()
    })

    test('clicking on the start marker calls onTemporalStartMouseDown', () => {
      const { enzymeWrapper, props } = setup({
        temporalRange: {
          start: new Date('2021-03').getTime(),
          end: new Date('2021-04').getTime()
        }
      })

      const marker = enzymeWrapper.find('.timeline-list__temporal-start')

      marker.props().onMouseDown()

      expect(props.onTemporalMarkerMouseDown).toHaveBeenCalledTimes(1)
    })

    test('clicking on the end marker calls onTemporalStartMouseDown', () => {
      const { enzymeWrapper, props } = setup({
        temporalRange: {
          start: new Date('2021-03').getTime(),
          end: new Date('2021-04').getTime()
        }
      })

      const marker = enzymeWrapper.find('.timeline-list__temporal-end')

      marker.props().onMouseDown()

      expect(props.onTemporalMarkerMouseDown).toHaveBeenCalledTimes(1)
    })

    describe('when the temporal markers are not dragging', () => {
      test('renders the correct classnames', () => {
        const { enzymeWrapper } = setup({
          temporalRange: {
            start: new Date('2021-03').getTime(),
            end: new Date('2021-04').getTime()
          }
        })

        const startMarker = enzymeWrapper.find('.timeline-list__temporal-start')
        const endMarker = enzymeWrapper.find('.timeline-list__temporal-end')

        expect(startMarker.props().className).not.toContain('timeline-list__temporal-marker--is-dragging')
        expect(endMarker.props().className).not.toContain('timeline-list__temporal-marker--is-dragging')
      })
    })

    describe('when the start temporal marker is dragging', () => {
      test('renders the correct classnames', () => {
        const { enzymeWrapper } = setup({
          draggingTemporalStart: true,
          temporalRange: {
            start: new Date('2021-03').getTime(),
            end: new Date('2021-04').getTime()
          }
        })

        const startMarker = enzymeWrapper.find('.timeline-list__temporal-start')
        const endMarker = enzymeWrapper.find('.timeline-list__temporal-end')

        expect(startMarker.props().className).toContain('timeline-list__temporal-marker--is-dragging')
        expect(endMarker.props().className).not.toContain('timeline-list__temporal-marker--is-dragging')
      })
    })

    describe('when the end temporal marker is dragging', () => {
      test('renders the correct classnames', () => {
        const { enzymeWrapper } = setup({
          draggingTemporalEnd: true,
          temporalRange: {
            start: new Date('2021-03').getTime(),
            end: new Date('2021-04').getTime()
          }
        })

        const startMarker = enzymeWrapper.find('.timeline-list__temporal-start')
        const endMarker = enzymeWrapper.find('.timeline-list__temporal-end')

        expect(startMarker.props().className).not.toContain('timeline-list__temporal-marker--is-dragging')
        expect(endMarker.props().className).toContain('timeline-list__temporal-marker--is-dragging')
      })
    })
  })
})
