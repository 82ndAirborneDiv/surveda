// @flow
import React, { Component } from 'react'
import { withRouter, browserHistory } from 'react-router'
import * as questionnaireActions from '../../actions/questionnaire'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as routes from '../../routes'
import { Tooltip } from '../ui'
import { startSimulation, messageSimulation } from '../../api.js'
import ChatWindow from './ChatWindow'
import DispositionChart from './DispositionChart'
import SimulationSteps from './SimulationSteps'
import { translate } from 'react-i18next'

type ChatMessage = {
  type: string,
  body: string
}

type Submission = {
  stepId: string,
  response: ?string
}

type Simulation = {
  messagesHistory: Array<ChatMessage>,
  submissions: Array<Submission>,
  simulationStatus: string,
  disposition: string,
  respondentId: string,
  currentStep: string,
  questionnaire: Questionnaire
}

type Props = {
  projectId: number,
  questionnaireId: number,
  mode: string,
  questionnaireActions: Object,
  t: Function,
  router: Object
}

type State = {
  simulation: ?Simulation
}

class QuestionnaireSimulation extends Component<Props, State> {
  state = {
    simulation: null
  }

  componentDidMount = () => {
    browserHistory.listen(this.onRouteChange)
  }

  onRouteChange = () => {
    document.querySelectorAll('.toast').forEach(t => t.remove())
  }

  /**
   * This component doesn't do this fetch for itself
   * The title component (rendered above) needs the questionnaire in the redux store
   */
  fetchQuestionnaireForTitle = () => {
    const { projectId, questionnaireId } = this.props
    this.props.questionnaireActions.fetchQuestionnaireIfNeeded(projectId, questionnaireId)
  }

  componentWillMount() {
    const { projectId, questionnaireId, mode } = this.props
    if (projectId && questionnaireId) {
      this.fetchQuestionnaireForTitle()
      // We only support SMS for now
      if (mode == 'sms') {
        startSimulation(projectId, questionnaireId, mode).then(result => {
          this.setState({ simulation: {
            messagesHistory: result.messagesHistory,
            submissions: result.submissions,
            simulationStatus: result.simulationStatus,
            disposition: result.disposition,
            respondentId: result.respondentId,
            currentStep: result.currentStep,
            questionnaire: result.questionnaire
          }})
        })
      }
    }
  }

  handleMessageResult = result => {
    const { simulation } = this.state
    const { t } = this.props
    if (result.simulationStatus == 'expired') {
      // When the simulation expires we avoid refreshing (and so, erasing) the current state
      // So we only update the simulation status and we send a message to the end user
      // This allow us to handle this particular situation properly
      window.Materialize.toast(t('This simulation is expired. Please refresh to start a new one'))
      this.setState({
        simulation: {
          ...simulation,
          simulationStatus: result.simulationStatus
        }
      })
    } else {
      if (result.simulationStatus == 'ended') {
        window.Materialize.toast(t('This simulation is ended. Please refresh to start a new one'))
      }
      this.setState({
        simulation: {
          ...simulation,
          messagesHistory: result.messagesHistory,
          submissions: result.submissions,
          simulationStatus: result.simulationStatus,
          disposition: result.disposition,
          currentStep: result.currentStep
        }
      })
    }
  }

  handleATMessage = message => {
    const { projectId, questionnaireId } = this.props
    const { simulation } = this.state
    if (simulation) {
      this.addMessage(message)
      messageSimulation(projectId, questionnaireId, simulation.respondentId, message.body).then(result => {
        this.handleMessageResult(result)
      })
    }
  }

  addMessage = message => {
    const { simulation } = this.state
    if (simulation) {
      this.setState({
        simulation: {
          ...simulation,
          messagesHistory: [
            ...simulation.messagesHistory,
            message
          ]
        }
      })
    }
  }

  render() {
    const { simulation } = this.state
    const { router, projectId, questionnaireId } = this.props
    const simulationIsActive = simulation && simulation.simulationStatus == 'active'
    const closeSimulationButton = (
      <div>
        <Tooltip text='Close Simulation'>
          <a key='one' className='btn-floating btn-large waves-effect waves-light red right' style={{marginTop: '-6.1rem'}} href='#' onClick={() => router.push(routes.editQuestionnaire(projectId, questionnaireId))}>
            <i className='material-icons'>close</i>
          </a>
        </Tooltip>
      </div>
    )

    return <div className='simulator-container'>
      {
        simulation
        ? <div>
          {closeSimulationButton}
          <div className='col s12 m4'>
            <DispositionChart disposition={simulation.disposition} />
          </div>
          <div className='col s12 m4'>
            <SimulationSteps steps={simulation.questionnaire.steps}
              currentStepId={simulation.currentStep}
              submissions={simulation.submissions}
              simulationIsEnded={simulation.simulationStatus == 'ended'}
            />
          </div>
          <div className='col s12 m4'>
            <ChatWindow messages={simulation.messagesHistory} onSendMessage={this.handleATMessage} chatTitle={'SMS mode'} readOnly={!simulationIsActive} />
          </div>
        </div>
        : 'Loading'
      }
    </div>
  }
}

const mapStateToProps = (state, ownProps) => ({
  projectId: parseInt(ownProps.params.projectId),
  questionnaireId: parseInt(ownProps.params.questionnaireId),
  mode: ownProps.params.mode
})

const mapDispatchToProps = (dispatch) => ({
  questionnaireActions: bindActionCreators(questionnaireActions, dispatch)
})

export default translate()(withRouter(connect(mapStateToProps, mapDispatchToProps)(QuestionnaireSimulation)))