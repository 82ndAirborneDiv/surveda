import React, { PropTypes, Component } from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions/survey'
import every from 'lodash/every'
import map from 'lodash/map'
import uniq from 'lodash/uniq'
import some from 'lodash/some'
import each from 'lodash/each'
import isEqual from 'lodash/isEqual'
import { modeLabel } from '../../reducers/survey'
import * as respondentActions from '../../actions/respondentGroups'
import * as uiActions from '../../actions/ui'
import { Dropdown, DropdownItem } from '../ui'
import { availableOptions } from '../../surveyModes'

class SurveyWizardModeStep extends Component {
  static propTypes = {
    survey: PropTypes.object.isRequired,
    respondentGroups: PropTypes.object,
    questionnaires: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    readOnly: PropTypes.bool.isRequired,
    comparisonModes: PropTypes.object
  }

  modeChange(e, modes) {
    const { dispatch, survey, respondentGroups } = this.props
    dispatch(actions.selectMode(modes))
    each(Object.keys(respondentGroups), groupId => {
      let currentChannels = respondentGroups[groupId].channels || []
      currentChannels = currentChannels.filter(channel => some(modes, mode => channel.mode == mode))
      dispatch(respondentActions.selectChannels(survey.projectId, survey.id, groupId, currentChannels))
    })
  }

  modeComparisonChange(e) {
    const { dispatch } = this.props
    dispatch(actions.changeModeComparison())
  }

  modeIncludes(modes, target) {
    return some(modes, ary => isEqual(ary, target))
  }

  questionnairesMatchMode(mode, ids, questionnaires) {
    return every(mode, m =>
      ids && every(ids, id =>
        questionnaires[id] && questionnaires[id].modes && questionnaires[id].modes.indexOf(m) != -1))
  }

  // input(id, inputType, modeComparison, mode, modes, value) {
  //   const { survey, questionnaires, readOnly } = this.props
  //   const questionnaireIds = survey.questionnaireIds
  //   const match = this.questionnairesMatchMode(modes, questionnaireIds, questionnaires)
  //
  //   return (
  //     <p>
  //       <input
  //         id={id}
  //         type={inputType}
  //         name='questionnaire_mode'
  //         className={modeComparison ? 'filled-in' : 'with-gap'}
  //         value={value}
  //         checked={this.modeIncludes(mode, modes)}
  //         onChange={e => this.modeChange(e, modes)}
  //         disabled={readOnly || !match}
  //         />
  //       <label htmlFor={id}>{modeLabel(modes)}</label>
  //     </p>
  //   )
  // }

  addModeComparison = (primary, fallback) => {
    const { dispatch } = this.props
    if (!primary) {
      return
    } else {
      if (primary && !fallback) {
        this.modeChange(null, [primary])
      } else {
        this.modeChange(null, [primary, fallback])
      }
    }
    dispatch(uiActions.addModeComparison())
  }

  selectPrimaryModeForComparison = (mode) => {
    const { dispatch } = this.props
    dispatch(uiActions.comparisonPrimarySelected(mode))
  }

  selectFallbackModeForComparison = (primary, fallback) => {
    const { dispatch } = this.props
    dispatch(uiActions.comparisonFallbackSelected(fallback))
  }

  selectSingleMode = (primary, fallback) => {
    const { dispatch } = this.props
    const mode = fallback ? [primary, fallback] : [primary]
    dispatch(actions.selectMode(mode))
  }

  primarySingleMode = (modes) => (
    modes.length == 0 ? null : modes[0][0]
  )

  fallbackSingleMode = (modes) => (
    (modes.length == 0) || (modes[0].length == 1) ? null : modes[0][1]
  )

  render() {
    const { survey, readOnly, comparisonModes } = this.props

    if (!survey) {
      return <div>Loading...</div>
    }

    const mode = survey.mode || []
    const modeComparison = mode.length > 1 || (!!survey.modeComparison)

    // let inputType = modeComparison ? 'checkbox' : 'radio'

    let primarySelected
    let fallbackSelected
    let primarySelectedHandler
    let fallbackSelectedHandler

    if (modeComparison) {
      primarySelected = comparisonModes.primaryModeSelected
      fallbackSelected = comparisonModes.fallbackModeSelected
      primarySelectedHandler = this.selectPrimaryModeForComparison
      fallbackSelectedHandler = this.selectFallbackModeForComparison
    } else {
      primarySelected = this.primarySingleMode(survey.mode)
      fallbackSelected = this.fallbackSingleMode(survey.mode)
      primarySelectedHandler = this.selectSingleMode
      fallbackSelectedHandler = this.selectSingleMode
    }

    const availableModes = availableOptions(survey.mode)
    const primaryOptions = uniq(map(availableModes, (mode) => mode[0]))
    const fallbackOptions = availableModes.filter((mode) => { return mode[0] == primarySelected }).map((mode) => mode.length == 2 ? mode[1] : null)

    return (
      <div>
        <div className='row'>
          <div className='col s12'>
            <h4>Select mode</h4>
            <p className='flow-text'>
              Select which modes you want to use.
            </p>
          </div>
        </div>
        <div className='row'>
          <div className='col s12'>
            <p>
              <input
                id='questionnaire_mode_comparison'
                type='checkbox'
                checked={modeComparison}
                onChange={e => this.modeComparisonChange(e)}
                className='filled-in'
                disabled={readOnly}
                />
              <label htmlFor='questionnaire_mode_comparison'>Run a comparison to contrast performance between different primary and fallback modes combinations (you can set up the allocations later in the comparisons section)</label>
            </p>
            {
              modeComparison
              ? mode.map((mode) => (
                <div>{modeLabel(mode)}</div>
              )) : null
            }
            {
              /*
              {this.input('questionnaire_mode_ivr', inputType, modeComparison, mode, ['ivr'], 'ivr')}
              {this.input('questionnaire_mode_ivr_sms', inputType, modeComparison, mode, ['ivr', 'sms'], 'ivr_sms')}
              {this.input('questionnaire_mode_ivr_web', inputType, modeComparison, mode, ['ivr', 'mobileweb'], 'ivr_mobileweb')}
              {this.input('questionnaire_mode_sms', inputType, modeComparison, mode, ['sms'], 'sms')}
              {this.input('questionnaire_mode_sms_ivr', inputType, modeComparison, mode, ['sms', 'ivr'], 'sms_ivr')}
              {this.input('questionnaire_mode_sms_mobileweb', inputType, modeComparison, mode, ['sms', 'mobileweb'], 'sms_mobileweb')}
              {this.input('questionnaire_mode_mobileweb', inputType, modeComparison, mode, ['mobileweb'], 'mobileweb')}
              {this.input('questionnaire_mode_mobileweb_sms', inputType, modeComparison, mode, ['mobileweb', 'sms'], 'mobileweb_sms')}
              {this.input('questionnaire_mode_mobileweb_ivr', inputType, modeComparison, mode, ['mobileweb', 'ivr'], 'mobileweb_ivr')}
              */
            }
            <div>
              <Dropdown label={<span>{ primarySelected || 'Primary mode'}</span>}>
                {primaryOptions.map((mode) => {
                  return (
                    <DropdownItem>
                      <a onClick={() => primarySelectedHandler(mode)}>{mode}</a>
                    </DropdownItem>
                  )
                })}
              </Dropdown>
            </div>
            {
              primarySelected
              ? <div>
                <Dropdown label={<span>{ fallbackSelected || 'Fallback mode' }</span>}>
                  {fallbackOptions.map((mode) => {
                    return (
                      <DropdownItem>
                        <a onClick={() => fallbackSelectedHandler(primarySelected, mode)}>{mode || 'no fallback'}</a>
                      </DropdownItem>
                    )
                  })}
                </Dropdown>
              </div> : null
            }
            {
              modeComparison
              ? <div onClick={() => this.addModeComparison(primarySelected, fallbackSelected)}>
                Add mode
              </div> : null
            }
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  comparisonModes: state.ui.data.surveyWizard
})

export default connect(mapStateToProps)(SurveyWizardModeStep)
