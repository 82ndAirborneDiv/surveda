// @flow
import * as api from '../api'

export const FETCH = 'PANEL_SURVEY_FETCH'
export const RECEIVE = 'PANEL_SURVEY_RECEIVE'

export const fetchPanelSurvey = (projectId: number, id: number) => (dispatch: Function, getState: () => Store): Survey => {
  dispatch(fetch(projectId, id))
  return api.fetchPanelSurvey(projectId, id)
    .then(response => {
      dispatch(receive(response.entities.panelSurveys[response.result]))
    })
    .then(() => {
      return getState().panelSurvey.data
    })
}
export const fetch = (projectId: number, id: number): FilteredAction => ({
  type: FETCH,
  id,
  projectId
})

export const receive = (panelSurvey: PanelSurvey) => ({
  type: RECEIVE,
  data: panelSurvey
})
