import * as api from '../api'

export const RECEIVE_RESPONDENTS = 'RECEIVE_RESPONDENTS'
export const FETCH_RESPONDENTS = 'FETCH_RESPONDENTS'
export const CREATE_RESPONDENT = 'CREATE_RESPONDENT'
export const UPDATE_RESPONDENT = 'UPDATE_RESPONDENT'
export const RECEIVE_RESPONDENTS_ERROR = 'RECEIVE_RESPONDENTS_ERROR'
export const RECEIVE_RESPONDENTS_STATS = 'RECEIVE_RESPONDENTS_STATS'

export const fetchRespondents = (
  projectId,
  surveyId,
  limit,
  page,
  filter = '',
  sortBy = null,
  sortAsc = true
) => (dispatch, getState) => {
  dispatch(startFetchingRespondents(surveyId, page, sortBy, sortAsc, filter))
  api
    .fetchRespondents(projectId, surveyId, limit, page, sortBy, sortAsc, filter)
    .then((response) => {
      const state = getState().respondents
      const lastFetchResponse =
        state.surveyId == surveyId &&
        state.page.number == page &&
        state.sortBy == sortBy &&
        state.sortAsc == sortAsc &&
        state.filter == filter
      if (lastFetchResponse) {
        dispatch(
          receiveRespondents(
            surveyId,
            page,
            response.entities.respondents || {},
            response.respondentsCount,
            response.result,
            sortBy,
            sortAsc,
            filter
          )
        )
      }
    })
}
export const fetchRespondentsStats = (projectId, surveyId) => dispatch => {
  api.fetchRespondentsStats(projectId, surveyId)
    .then(stats => dispatch(receiveRespondentsStats(stats)))
}

export const receiveRespondentsStats = (response) => ({
  type: RECEIVE_RESPONDENTS_STATS,
  response
})

export const receiveRespondents = (surveyId, page, respondents, respondentsCount, order, sortBy, sortAsc, filter) => ({
  type: RECEIVE_RESPONDENTS,
  surveyId,
  page,
  respondents,
  respondentsCount,
  order,
  sortBy,
  sortAsc,
  filter
})

export const createRespondent = (response) => ({
  type: CREATE_RESPONDENT,
  id: response.result,
  respondent: response.entities.respondents[response.result]
})

export const updateRespondent = (response) => ({
  type: UPDATE_RESPONDENT,
  id: response.result,
  respondent: response.entities.respondents[response.result]
})

export const updateRespondentsFilter = (projectId, surveyId, filter) => (dispatch, getState) => {
  const { sortBy, sortAsc, page } = getState().respondents
  dispatch(fetchRespondents(projectId, surveyId, page.size, 1, filter, sortBy, sortAsc))
}

export const receiveRespondentsError = (error) => ({
  type: RECEIVE_RESPONDENTS_ERROR,
  error
})

export const startFetchingRespondents = (surveyId, page, sortBy, sortAsc, filter) => ({
  type: FETCH_RESPONDENTS,
  surveyId,
  page,
  sortBy,
  sortAsc,
  filter
})

export const sortRespondentsBy = (projectId, surveyId, newSortBy) => (dispatch, getState) => {
  const { page, sortBy, sortAsc, filter } = getState().respondents
  const newSortAsc = sortBy == newSortBy ? !sortAsc : true
  dispatch(fetchRespondents(projectId, surveyId, page.size, 1, filter, newSortBy, newSortAsc))
}
