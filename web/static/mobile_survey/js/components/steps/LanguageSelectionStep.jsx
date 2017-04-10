import React, { Component, PropTypes } from 'react'
import Prompt from '../Prompt'

class LanguageSelectionStep extends Component {
  getValue() {
    return this.refs.select.value
  }

  render() {
    const { step, onClick } = this.props
    return (
      <div>
        <Prompt text={step.prompt} />
        {step.choices.map(choice => {
          return (
            <div key={choice} >
              <button value={choice} onClick={e => { e.preventDefault(); onClick(choice) }}>{choice}</button>
            </div>
          )
        })}
      </div>
    )
  }
}

LanguageSelectionStep.propTypes = {
  step: PropTypes.object,
  onClick: PropTypes.func
}

export default LanguageSelectionStep

