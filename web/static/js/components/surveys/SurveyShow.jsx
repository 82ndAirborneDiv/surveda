// @flow
import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import * as actions from '../../actions/survey'
import * as surveysActions from '../../actions/surveys'
import * as respondentActions from '../../actions/respondents'
import * as folderActions from '../../actions/folder'
import * as panelSurveysActions from '../../actions/panelSurveys'
import SurveyStatus from './SurveyStatus'
import * as routes from '../../routes'
import { Tooltip, Modal, dispositionGroupLabel, dispositionLabel } from '../ui'
import { stopSurvey, repeatSurvey } from '../../api'
import sum from 'lodash/sum'
import { modeLabel } from '../../questionnaire.mode'
import { referenceColorClasses, referenceColors, referenceColorClassForUnassigned, referenceColorForUnassigned } from '../../referenceColors'
import classNames from 'classnames/bind'
import QueueSize from '../charts/QueueSize'
import SuccessRate from '../charts/SuccessRate'
import Forecasts from '../charts/Forecasts'
import Stats from '../charts/Stats'
import { translate } from 'react-i18next'
import SurveyRetriesPanel from './SurveyRetriesPanel'

type State = {
  responsive: boolean,
  contacted: boolean,
  uncontacted: boolean,
  stopUnderstood: boolean
};

class SurveyShow extends Component<any, State> {
  static propTypes = {
    t: PropTypes.func,
    dispatch: PropTypes.func,
    router: PropTypes.object,
    project: PropTypes.object,
    projectId: PropTypes.string.isRequired,
    surveyId: PropTypes.string.isRequired,
    survey: PropTypes.object,
    questionnaires: PropTypes.object,
    respondentsByDisposition: PropTypes.object,
    reference: PropTypes.array,
    completedByDate: PropTypes.object,
    attemptedRespondents: PropTypes.number,
    totalRespondents: PropTypes.number,
    target: PropTypes.number,
    completionPercentage: PropTypes.number,
    cumulativePercentages: PropTypes.object,
    completionRate: PropTypes.number,
    estimatedSuccessRate: PropTypes.number,
    initialSuccessRate: PropTypes.number,
    successRate: PropTypes.number,
    exhausted: PropTypes.number,
    available: PropTypes.number,
    neededToComplete: PropTypes.number,
    additionalCompletes: PropTypes.number,
    additionalRespondents: PropTypes.number
  }

  constructor(props) {
    super(props)
    this.state = {
      responsive: false, contacted: false, uncontacted: false, stopUnderstood: false
    }
  }

  componentWillMount() {
    const { dispatch, projectId, surveyId } = this.props
    dispatch(actions.fetchSurveyIfNeeded(projectId, surveyId))
    dispatch(respondentActions.fetchRespondentsStats(projectId, surveyId))
    dispatch(actions.fetchSurveyStats(projectId, surveyId))

    // Fetch folders for breadcrumb
    dispatch(folderActions.fetchFolders(projectId))
    // Fetch surveys for breadcrumb
    dispatch(surveysActions.fetchSurveys(projectId))
    // Fetch panel surveys for breadcrumb
    dispatch(panelSurveysActions.fetchPanelSurveys(projectId))
  }

  componentDidUpdate() {
    const { survey, router } = this.props
    if (survey && survey.state == 'not_ready') {
      router.replace(routes.surveyEdit(survey.projectId, survey.id))
    }
  }

  showHistograms() {
    const { survey } = this.props
    return survey && survey.state == 'running'
  }

  stopSurvey() {
    this.setState({stopUnderstood: false})
    this.refs.stopModal.open()
  }

  repeatSurvey() {
    const { projectId, surveyId, router } = this.props
    repeatSurvey(projectId, surveyId)
      .then(response => {
        const survey = response.entities.surveys[response.result]
        router.push(routes.surveyEdit(projectId, survey.id))
      })
  }

  toggleStopUnderstood() {
    this.setState((state) => ({ stopUnderstood: !state.stopUnderstood }))
  }

  stopCancel() {
    this.refs.stopModal.close()
  }

  confirmStopSurvey() {
    const { projectId, surveyId, router } = this.props
    this.refs.stopModal.close()
    stopSurvey(projectId, surveyId)
      .then(() => router.push(routes.surveyEdit(projectId, surveyId)))
  }

  iconForMode(mode: string) {
    const { t } = this.props
    let icon = null
    switch (mode) {
      case 'sms':
        icon = 'sms'
        break
      case 'ivr':
        icon = 'phone'
        break
      case 'mobileweb':
        icon = 'phonelink'
        break
      default:
        throw new Error(t('Unknown mode: {{mode}}', {mode}))
    }
    return icon
  }

  letterForIndex(index) {
    return String.fromCodePoint(65 + index) // A, B, C, ...
  }

  titleFor(questionnaires) {
    return Object.keys(questionnaires).length > 1
      ? this.props.t('Questionnaire performance comparison')
      : questionnaires[Object.keys(questionnaires)[0]].name
  }

  toggleLock(e) {
    const { dispatch } = this.props
    dispatch(actions.toggleLock())
  }

  render() {
    const { questionnaires, survey, respondentsByDisposition, reference, attemptedRespondents, cumulativePercentages, target, project, t, projectId, surveyId,
      estimatedSuccessRate, initialSuccessRate, successRate, completionRate, exhausted, available, neededToComplete, additionalCompletes, additionalRespondents } = this.props
    const { stopUnderstood } = this.state

    if (!survey || !cumulativePercentages || !questionnaires || !respondentsByDisposition || !reference) {
      return <p>{t('Loading...')}</p>
    }

    const readOnly = !project || project.readOnly

    let stopComponent = null
    let switchComponent = null
    let repeatComponent = null
    if (!readOnly && survey.state == 'running') {
      if (project.level == 'owner' || project.level == 'admin') {
        let lockOpenClass, lockClass
        if (survey.locked) {
          lockOpenClass = 'grey-text'
          lockClass = 'white-text'
        } else {
          lockOpenClass = 'white-text'
          lockClass = 'grey-text'
        }
        switchComponent = <div className='switch right'>
          <label>
            <i className={`material-icons ${lockOpenClass}`}>lock_open</i>
            <input type='checkbox' checked={survey.locked} onChange={e => this.toggleLock(e)} />
            <span className='lever' />
            <i className={`material-icons ${lockClass}`}>lock</i>
          </label>
        </div>
      }
      stopComponent = (
        <div className='stop-container'>
          <Tooltip text={t('Stop survey')}>
            <a className='btn-floating btn-large waves-effect waves-light red right' onClick={() => this.stopSurvey()} disabled={survey.locked}>
              <i className='material-icons'>stop</i>
            </a>
          </Tooltip>
          { switchComponent }
        </div>
      )
    }

    if (survey.isPanelSurvey) {
      const hint =
        survey.isRepeatable
        ? t('This survey is complete, you may follow up with a new survey sent to a subset of the respondents of this survey')
          // A panel survey isn't repeatable when any of the following conditions occurs:
          : survey.state != 'terminated'
            // 1. The survey isn't terminated
            ? t("This survey isn't complete yet. After that, you may follow up with a new survey sent to a subset of the respondents of this survey")
            // 2. The survey has subsequent occurrences
            : t('This survey is complete, but it has subsequent occurrences. You can follow up only the latest occurrence of a panel survey')
      repeatComponent = (
        <div className='repeat-survey'>
          <div className='row top-separator'>
            <div className='col s12' />
          </div>
          <div className='row'>
            <div className='col s10 hint'>
              {hint}
            </div>
            <div className='col s2'>
              <a className={classNames('btn blue right', { disabled: survey.locked || !survey.isRepeatable })}
                onClick={() => this.repeatSurvey()}>{t('Repeat')}</a>
            </div>
          </div>
        </div>
      )
    }

    let title = this.titleFor(questionnaires)

    let stats = [
      {value: target, label: t('Target')},
      {value: respondentsByDisposition.responsive.detail.completed.count, label: t('Completes')},
      {value: respondentsByDisposition.responsive.detail.partial.count, label: t('Partials')},
      {value: attemptedRespondents, label: t('Attempted Respondents')}
    ]
    let colors = referenceColors(reference.length)

    const hasQuotas = survey.quotas.vars.length > 0

    let forecastsReferences = reference.map((r, i) => {
      const name = r.name ? r.name : ''
      const modes = r.modes ? modeLabel(r.modes) : ''
      const separator = name && modes ? ' | ' : ''

      return {
        label: `${name}${separator}${modes}`,
        color: colors[i],
        id: r.id
      }
    })

    if (hasQuotas) {
      forecastsReferences = [
        {
          label: 'unassigned',
          color: referenceColorForUnassigned(),
          id: ''
        },
        ...forecastsReferences
      ]
    }

    // TODO: we should be doing this when receiving properties, not at render
    let forecasts = forecastsReferences.map(d => {
      const values = (cumulativePercentages[d.id] || []).map(v => (
        { time: new Date(v.date), value: Number(v.percent) }
      ))

      return {...d, values}
    })

    return (
      <div className='cockpit'>
        <div className='row'>
          {stopComponent}
          <Modal card ref='stopModal' id='stop_survey_modal'>
            <div className='modal-content'>
              <div className='card-title header'>
                <h5>{t('Stop survey')}</h5>
                <p>{t('This will finalize the survey execution')}</p>
              </div>
              <div className='card-content'>
                <div className='row'>
                  <div className='col s12'>
                    <p className='red-text alert-left-icon'>
                      <i className='material-icons'>warning</i>
                      {t('Stopped surveys cannot be restarted')}
                    </p>
                  </div>
                </div>
                <div className='row'>
                  <div className='col s12'>
                    <p>
                      {t('Once you stop the survey, all invitations will be halted immediately.')}
                    </p>
                    <p>
                      {t('Respondents who are currently answering the survey will be cut off. Once you stop, you cannot restart.')}
                    </p>
                  </div>
                </div>
                <div className='row'>
                  <div className='col s12'>
                    <input
                      id='stop_understood'
                      type='checkbox'
                      checked={stopUnderstood}
                      onChange={() => this.toggleStopUnderstood()}
                      className='filled-in' />
                    <label htmlFor='stop_understood'>{t('Understood')}</label>
                  </div>
                </div>
              </div>
              <div className='card-action'>
                <a
                  className={classNames('btn-large red', { disabled: !stopUnderstood })}
                  onClick={() => this.confirmStopSurvey()}>
                  {t('Stop')}
                </a>
                <a className='btn-flat grey-text' onClick={() => this.stopCancel()}>{t('Cancel')}</a>
              </div>
            </div>
          </Modal>
          <div className='col s12'>
            <h4>
              {title}
            </h4>
          </div>
          <div className='col s12'>
            <SurveyStatus survey={survey} />
          </div>
        </div>
        {repeatComponent}
        <div className='row'>
          <div className='col s12'>
            <div className='card' style={{'width': '100%', padding: '60px 30px'}}>
              <div className='header'>
                <div className='title'>{t('Percent of completes')}</div>
                {survey.countPartialResults
                  ? <div className='description'>{t('Count partials as completed')}</div>
                  : ''
                }
              </div>
              <Stats data={stats} />
              <Forecasts data={forecasts} ceil={100} forecast={survey.state == 'running'} />
              { this.showHistograms() ? <SurveyRetriesPanel projectId={projectId} surveyId={surveyId} /> : null }
              <div className='row' style={{ 'display': 'flex', 'alignItems': 'center', 'marginTop': '20px' }}>
                <div style={{ 'width': '50%' }}>
                  <div className='header'>
                    <div className='title'>{t('SUCCESS RATE')}</div>
                    <div className='description'>{t('Estimated by combining initial and current values')}</div>
                  </div>
                  <SuccessRate initial={initialSuccessRate} actual={successRate} estimated={estimatedSuccessRate} progress={completionRate} exhausted={exhausted} weight={24} />
                </div>
                <div style={{ 'width': '50%' }}>
                  <div className='header'>
                    <div className='title'>{t('QUEUE SIZE')}</div>
                    <div className='description'>{t('Amount of respondents that are estimated we need to contact to reach the target completes. It increases when the success rate decreases and viceversa.')}</div>
                  </div>
                  <QueueSize exhausted={exhausted} available={available} needed={neededToComplete} additionalCompletes={additionalCompletes} additionalRespondents={additionalRespondents} weight={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='row'>
          <div className='col s12'>
            {this.dispositions(respondentsByDisposition, reference, hasQuotas)}
          </div>
        </div>
      </div>
    )
  }

  // Round a number to two decimals, but only if the number has decimals
  round(num) {
    if (num == parseInt(num)) {
      return num
    } else {
      return num.toFixed(2)
    }
  }

  expandGroup(group) {
    let newState = {
      ...this.state
    }
    newState[group] = !this.state[group]
    this.setState(newState)
  }

  referenceIds(reference) {
    return Object.keys(reference).map((refKey) => reference[refKey].id)
  }

  groupRows(group, groupStats, reference, hasQuotas) {
    let details = groupStats.detail
    let detailsKeys = Object.keys(details)
    const defaultZeroValue = '-'
    let colorClasses = referenceColorClasses(this.referenceIds(reference).length)
    let referenceIds = hasQuotas ? ['', ...this.referenceIds(reference)] : this.referenceIds(reference)

    const colorClassFor = (referenceId, index) => {
      if (hasQuotas) {
        if (referenceId) {
          return colorClasses[index - 1]
        } else {
          return referenceColorClassForUnassigned()
        }
      } else {
        return colorClasses[index]
      }
    }

    const groupStatsbyReference = (referenceIds, detailsKeys, colorClasses, details) => {
      if (referenceIds.length > 1) {
        return referenceIds.map((referenceId, i) => {
          const totals = detailsKeys.map((detail) => details[detail].byReference[referenceId] || 0)
          return <td key={referenceId} className={classNames('right-align', colorClassFor(referenceId, i))}>{sum(totals) || defaultZeroValue}</td>
        })
      }
    }
    const groupRow =
      <tr key={group}>
        <td>{dispositionGroupLabel(group)}</td>
        {groupStatsbyReference(referenceIds, detailsKeys, colorClasses, details)}
        <td className='right-align'>{groupStats.count || defaultZeroValue}</td>
        <td className='right-align'>{this.round(groupStats.percent)}%</td>
        <td className='expand-column'>
          <a className='link' onClick={e => this.expandGroup(group)}>
            <i className='material-icons right grey-text'>{this.state[group] ? 'expand_less' : 'expand_more'}</i>
          </a>
        </td>
      </tr>

    let rows = null
    if (this.state[group]) {
      rows = detailsKeys.map((detail) => {
        let individualStat = details[detail]

        let byReference = individualStat['byReference']
        let referenceColumns = null
        if (referenceIds.length > 1) {
          referenceColumns = referenceIds.map((referenceId, i) => {
            const value = byReference[referenceId] || defaultZeroValue

            return <td key={referenceId} className={classNames('right-align', colorClassFor(referenceId, i))}>{value}</td>
          })
        }

        return (
          <tr className='detail-row' key={detail}>
            <td>{dispositionLabel(detail)}</td>
            {referenceColumns}
            <td className='right-align'>{individualStat.count}</td>
            <td className='right-align'>{this.round(individualStat.percent)}%</td>
            <td className='expand-column' />
          </tr>
        )
      })
    }

    return [groupRow, rows]
  }

  dispositions(respondentsByDisposition, reference, hasQuotas) {
    const { t } = this.props
    const dispositionsGroup = ['responsive', 'contacted', 'uncontacted']
    let referenceIds = hasQuotas ? ['', ...this.referenceIds(reference)] : this.referenceIds(reference)
    return (
      <div className='card overflow'>
        <div className='card-table-title'>
          <div>
            {t('Dispositions')}
          </div>
          <div className='disposition-flow-chart-link'>
            <a
              href='https://github.com/instedd/surveda/wiki/Disposition-flow-chart'
              target='_blank'
            >
              {t('View disposition flow chart')}
            </a>
          </div>
        </div>
        <div className='card-table'>
          <table>
            <thead>
              <tr>
                <th>{t('Status')}</th>
                {referenceIds.length > 1 ? referenceIds.map((referenceId) => (<th key={referenceId || 'unassigned'} className='right-align' />)) : []}
                <th className='right-align'>{t('Quantity')}</th>
                <th className='right-align'>
                  {t('Percent')}
                </th>
              </tr>
            </thead>
            <tbody>
              {
                dispositionsGroup.map(group => {
                  let groupStats = respondentsByDisposition[group]
                  return this.groupRows(group, groupStats, reference, hasQuotas)
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const respondentsStatsRoot = state.respondentsStats[ownProps.params.surveyId]
  const surveyStats = state.surveyStats.surveyId == ownProps.params.surveyId ? state.surveyStats.stats : null

  let respondentsByDisposition = null
  let cumulativePercentages = {}
  let attemptedRespondents = 0
  let totalRespondents = 0
  let target = 0
  let completionPercentage = 0
  let reference = null

  if (respondentsStatsRoot) {
    respondentsByDisposition = respondentsStatsRoot.respondentsByDisposition
    cumulativePercentages = respondentsStatsRoot.cumulativePercentages
    attemptedRespondents = respondentsStatsRoot.attemptedRespondents
    totalRespondents = respondentsStatsRoot.totalRespondents
    target = respondentsStatsRoot.target
    completionPercentage = respondentsStatsRoot.completionPercentage
    reference = respondentsStatsRoot.reference
  }

  return ({
    projectId: ownProps.params.projectId,
    project: state.project.data,
    surveyId: ownProps.params.surveyId,
    survey: state.survey.data,
    questionnaires: !state.survey.data ? {} : state.survey.data.questionnaires,
    respondentsByDisposition: respondentsByDisposition,
    cumulativePercentages: cumulativePercentages,
    attemptedRespondents: attemptedRespondents,
    totalRespondents: totalRespondents,
    target: target,
    reference: reference,
    completionPercentage: completionPercentage,
    completionRate: surveyStats ? surveyStats.completion_rate : null,
    estimatedSuccessRate: surveyStats ? surveyStats.estimated_success_rate : null,
    initialSuccessRate: surveyStats ? surveyStats.initial_success_rate : null,
    successRate: surveyStats ? surveyStats.success_rate : null,
    exhausted: surveyStats ? surveyStats.exhausted : null,
    available: surveyStats ? surveyStats.available : null,
    neededToComplete: surveyStats ? surveyStats.needed_to_complete : null,
    additionalCompletes: surveyStats ? surveyStats.additional_completes : null,
    additionalRespondents: surveyStats ? surveyStats.additional_respondents : null
  })
}

export default translate()(withRouter(connect(mapStateToProps)(SurveyShow)))
