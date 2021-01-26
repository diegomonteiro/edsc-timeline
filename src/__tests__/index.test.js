import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

import EDSCTimeline from '../index'

Enzyme.configure({ adapter: new Adapter() })

function setup() {
  const props = {
    rows: [],
    show: true,
    onTemporalSet: jest.fn(),
    onFocusedTemporalSet: jest.fn(),
    onTimelineMove: jest.fn()
  }

  const enzymeWrapper = shallow(<EDSCTimeline {...props} />)

  return {
    enzymeWrapper,
    props
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('EDSCTimeline component', () => {
  test('renders test timeline', () => {
    const { enzymeWrapper } = setup()

    expect(enzymeWrapper.find('div.timeline').text()).toEqual('Testing')
  })

  describe('Show prop', () => {
    test('hides the timeline when false', () => {
      const { enzymeWrapper } = setup()

      enzymeWrapper.setProps({ show: false })

      expect(enzymeWrapper.find('div.timeline').exists()).toBeFalsy()
    })
  })
})