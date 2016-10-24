import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as respondentsActions from '../actions/respondents'
import CardTable from '../components/CardTable'

class SurveyRespondents extends Component {
  componentDidMount() {
    const { dispatch, projectId, surveyId } = this.props
    if (projectId && surveyId) {
      dispatch(respondentsActions.fetchRespondents(projectId, surveyId))
    }
  }

  render() {
    /* jQuery extend clones respondents object, in order to build an easy to manage structure without
    modify state */
    const respondents = generateResponsesDictionaryFor(jQuery.extend(true, {}, this.props.respondents))
    const title = parseInt(Object.keys(respondents).length, 10) + " Respondents"

    if (Object.keys(respondents).length === 0) {
      return <div>Loading...</div>
    }

    function generateResponsesDictionaryFor(rs){
      Object.keys(rs).forEach((respondentId, _) =>
        rs[respondentId].responses = responsesDictionaryFrom(rs[respondentId].responses)
      )
      return rs
    }

    function responsesDictionaryFrom(responseArray){
      const res = {}
      for (const key in responseArray){
        res[responseArray[key].name] = responseArray[key].value
      }
      return res
    }

    function allFieldNames(rs) {
      let fieldNames = Object.keys(rs).map((key) => (rs[key].responses))
      fieldNames = fieldNames.map((response) => Object.keys(response))
      return [].concat.apply([], fieldNames)
    }

    function respondentKeys(rs) {
      return Object.keys(rs)
    }

    function hasResponded(rs, respondentId, fieldName){
      return Object.keys(rs[respondentId].responses).includes(fieldName)
    }

    function responseOf(rs, respondentId, fieldName){
      return hasResponded(rs, respondentId, fieldName) ? rs[respondentId].responses[fieldName] : "-"
    }

    return (
      <CardTable title={ title }>
        <thead>
          <tr>
            <th>Phone number</th>
            {allFieldNames(respondents).map(field =>
              <th key={field}>{field}</th>
            )}
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {respondentKeys(respondents).map(respondentId =>
            <tr key={respondentId}>
              <td> {respondents[respondentId].phoneNumber}</td>
              {allFieldNames(respondents).map(function(field){
                return <td key={parseInt(respondentId, 10)+field}>{responseOf(respondents, respondentId, field)}</td>
              })}
              <td>
                {respondents[respondentId].date ? new Date(respondents[respondentId].date).toUTCString() : "-"}
              </td>
            </tr>
          )}
        </tbody>
      </CardTable>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    projectId: ownProps.params.projectId,
    surveyId: ownProps.params.surveyId,
    respondents: state.respondents
  }
}

export default connect(mapStateToProps)(SurveyRespondents);