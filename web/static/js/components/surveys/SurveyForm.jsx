import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { CollectionItem } from '../ui'
import SurveyWizardQuestionnaireStep from './SurveyWizardQuestionnaireStep'
import SurveyWizardRespondentsStep from './SurveyWizardRespondentsStep'
import SurveyWizardChannelsStep from './SurveyWizardChannelsStep'
import SurveyWizardScheduleStep from './SurveyWizardScheduleStep'
import SurveyWizardCutoffStep from './SurveyWizardCutoffStep'

class SurveyForm extends Component {
  static propTypes = {
    projectId: PropTypes.any.isRequired,
    survey: PropTypes.object.isRequired,
    questionnaires: PropTypes.object,
    respondents: PropTypes.object,
    channels: PropTypes.object,
    errors: PropTypes.object
  }

  componentDidMount() {
    $('.scrollspy').scrollSpy()
    const sidebar = $(this.refs.sidebar)
    sidebar.pushpin({ top: sidebar.offset().top, offset: 60 })
  }

  allModesHaveAChannel(modes, channels, allChannels) {
    const selectedTypes = channels.map(id => allChannels[id].type)
    return modes.filter(mode => selectedTypes.indexOf(mode) != -1).length == modes.length
  }

  render() {
    const { survey, projectId, questionnaires, channels, respondents, errors } = this.props
    const questionnaireStepCompleted = survey.questionnaireId != null
    const respondentsStepCompleted = survey.respondentsCount > 0
    const channelStepCompleted = survey.mode != null && survey.channels && Object.keys(channels).length != 0 && this.allModesHaveAChannel(survey.mode, survey.channels, channels)
    const cutoffStepCompleted = survey.cutoff != null && survey.cutoff != ''
    const validRetryConfiguration = !errors || (!errors.smsRetryConfiguration && !errors.ivrRetryConfiguration)
    const scheduleStepCompleted =
      survey.scheduleDayOfWeek != null && (
        survey.scheduleDayOfWeek.sun ||
        survey.scheduleDayOfWeek.mon ||
        survey.scheduleDayOfWeek.tue ||
        survey.scheduleDayOfWeek.wed ||
        survey.scheduleDayOfWeek.thu ||
        survey.scheduleDayOfWeek.fri ||
        survey.scheduleDayOfWeek.sat
      ) && validRetryConfiguration

    const mandatorySteps = [questionnaireStepCompleted, respondentsStepCompleted, channelStepCompleted, scheduleStepCompleted]
    const numberOfCompletedSteps = mandatorySteps.filter(function(item) { return item == true }).length
    const percentage = `${(100 / mandatorySteps.length * numberOfCompletedSteps).toFixed(0)}%`

    return (
      <div className='row'>
        <div className='col s12 m4'>
          <div className='sidebar' ref='sidebar'>
            <ul className='collection with-header wizard'>
              <li className='collection-header'>
                <h5>Progress <span className='right'>{percentage}</span></h5>
                <p>
                Complete the following tasks to get your Survey ready.
                </p>
                <div className='progress'>
                  <div className='determinate' style={{ width: percentage }} />
                </div>
              </li>
              <CollectionItem path='#questionnaire' icon='assignment' text='Select a questionnaire' completed={questionnaireStepCompleted} />
              <CollectionItem path='#respondents' icon='group' text='Upload your respondents list' completed={respondentsStepCompleted} />
              <CollectionItem path='#channels' icon='settings_input_antenna' text='Select mode and channels' completed={channelStepCompleted} />
              <CollectionItem path='#schedule' icon='today' text='Setup a schedule' completed={scheduleStepCompleted} />
              <CollectionItem path='#cutoff' icon='remove_circle' text='Setup cutoff rules' completed={cutoffStepCompleted} />
              {/* <CollectionItem path={`#`} icon='attach_money' text='Assign incentives' completed={cutoffStepCompleted} />
            <CollectionItem className='optional' path={`#`} icon='call_split' text='Experiments' completed={scheduleStepCompleted} /> */}
            </ul>
          </div>
        </div>
        <div className='col s12 m7 offset-m1 wizard-content'>
          <div id='questionnaire' className='row scrollspy'>
            <SurveyWizardQuestionnaireStep projectId={projectId} survey={survey} questionnaires={questionnaires} />
          </div>
          <div id='respondents' className='row scrollspy'>
            <SurveyWizardRespondentsStep projectId={projectId} survey={survey} respondents={respondents} />
          </div>
          <div id='channels' className='row scrollspy'>
            <SurveyWizardChannelsStep channels={channels} survey={survey} />
          </div>
          <div id='schedule' className='row scrollspy'>
            <SurveyWizardScheduleStep survey={survey} />
          </div>
          <div id='cutoff' className='row scrollspy'>
            <SurveyWizardCutoffStep survey={survey} />
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  errors: state.survey.errors
})

export default connect(mapStateToProps)(SurveyForm)
