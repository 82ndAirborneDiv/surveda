import React from 'react'
import { Route, IndexRoute, IndexRedirect } from 'react-router'
import App from './components/layout/App'
import ProjectIndex from './components/projects/ProjectIndex'
import SurveyEdit from './components/surveys/SurveyEdit'
import SurveyIndex from './components/surveys/SurveyIndex'
import SurveyShow from './components/surveys/SurveyShow'
import SurveySettings from './components/surveys/SurveySettings'
import QuestionnaireIndex from './components/questionnaires/QuestionnaireIndex'
import QuestionnaireEditor from './components/questionnaires/QuestionnaireEditor'
import ChannelIndex from './components/ChannelIndex'
import ProjectTabs from './components/projects/ProjectTabs'
import SurveyTabs from './components/surveys/SurveyTabs'
import RespondentIndex from './components/respondents/RespondentIndex'
import ProjectTitle from './components/projects/ProjectTitle'
import SurveyTitle from './components/surveys/SurveyTitle'
import QuestionnaireTitle from './components/questionnaires/QuestionnaireTitle'
import CollaboratorIndex from './components/collaborators/CollaboratorIndex'
import InviteConfirmation from './components/InviteConfirmation'

export default (
  <Route path='/' component={App}>
    <IndexRedirect to='projects' />

    <Route path='/projects' title='Projects'>
      <IndexRoute component={ProjectIndex} />

      <Route path=':projectId' title={ProjectTitle}>
        <IndexRedirect to='surveys' />

        <Route path='surveys'>
          <IndexRoute components={{ body: SurveyIndex, tabs: ProjectTabs }} />

          <Route path=':surveyId' title={SurveyTitle}>
            <IndexRoute components={{ body: SurveyShow, tabs: SurveyTabs }} />
            <Route path='respondents' components={{ body: RespondentIndex, tabs: SurveyTabs }} />
            <Route path='settings' components={{ body: SurveySettings, tabs: SurveyTabs }} />
            <Route path='edit' component={SurveyEdit} showSavingStatus />
          </Route>
        </Route>

        <Route path='questionnaires' >
          <IndexRoute components={{ body: QuestionnaireIndex, tabs: ProjectTabs }} />
          <Route path=':questionnaireId' >
            <IndexRedirect to='edit' />
          </Route>
          <Route path=':questionnaireId/edit' component={QuestionnaireEditor} title={QuestionnaireTitle} showSavingStatus />
        </Route>

        <Route path='collaborators' >
          <IndexRoute components={{ body: CollaboratorIndex, tabs: ProjectTabs }} />
        </Route>
      </Route>
    </Route>

    <Route path='confirm'>
      <IndexRoute component={InviteConfirmation} />
    </Route>

    <Route path='/channels' title='Channels' >
      <IndexRoute component={ChannelIndex} />
    </Route>
  </Route>
)

export const root = '/'
export const projects = '/projects'
export const project = (id) => `${projects}/${id}`
export const surveyIndex = (projectId) => `${project(projectId)}/surveys`
export const survey = (projectId, surveyId) => `${surveyIndex(projectId)}/${surveyId}`
export const surveyRespondents = (projectId, surveyId) => `${survey(projectId, surveyId)}/respondents`
export const surveySettings = (projectId, surveyId) => `${survey(projectId, surveyId)}/settings`
export const respondentsCSV = (projectId, surveyId, offset) => `/api/v1${surveyRespondents(projectId, surveyId)}/csv?offset=${offset}`
export const respondentsDispositionHistoryCSV = (projectId, surveyId) => `/api/v1${surveyRespondents(projectId, surveyId)}/disposition_history_csv`
export const respondentsIncentivesCSV = (projectId, surveyId) => `/api/v1${surveyRespondents(projectId, surveyId)}/incentives_csv`
export const surveyEdit = (projectId, surveyId) => `${survey(projectId, surveyId)}/edit`
export const questionnaireIndex = (projectId) => `${project(projectId)}/questionnaires`
export const collaboratorIndex = (projectId) => `${project(projectId)}/collaborators`
export const questionnaire = (projectId, questionnaireId) => `${questionnaireIndex(projectId)}/${questionnaireId}`
export const editQuestionnaire = (projectId, questionnaireId) => `${questionnaire(projectId, questionnaireId)}/edit`
export const exportQuestionnaireZip = (projectId, questionnaireId) => `/api/v1${questionnaire(projectId, questionnaireId)}/export_zip`

export const channels = '/channels'

export const showOrEditSurvey = (s) => {
  if (s.state == 'not_ready' || s.state == 'ready') {
    return surveyEdit(s.projectId, s.id)
  } else {
    return survey(s.projectId, s.id)
  }
}
