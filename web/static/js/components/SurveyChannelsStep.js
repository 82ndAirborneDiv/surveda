import React, { PropTypes, Component } from 'react'
import merge from 'lodash/merge'
import { Link, withRouter } from 'react-router'
import { connect } from 'react-redux'
import * as actions from '../actions/surveys'
import * as channelsActions from '../actions/channels'
import { updateSurvey } from '../api'

class SurveyChannelsStep extends Component {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(channelsActions.fetchChannels());
  }

  handleSubmit(survey) {
    const { dispatch, projectId, router } = this.props
    updateSurvey(survey.projectId, survey)
      .then(survey => dispatch(actions.updateSurvey(survey)))
      .then(() => router.push(`/projects/${survey.projectId}/surveys/${survey.id}/edit`))
      .catch((e) => dispatch(actions.receiveSurveysError(e)))
  }

  render() {
    let input
    let channels_input = []
    const { survey, channels } = this.props

    if (!survey || !channels) {
      return <div>Loading...</div>
    }

    let surveyChannels = Object.values(survey.channels)
    let currentChannelId = (surveyChannels.length > 0 ? surveyChannels[surveyChannels.length - 1].channelId : null)

    return (
      <div className="col s12 m7 offset-m1">
        <div className="row">
          <div className="col s12">
            <h4>Select mode & channels</h4>
            <p className="flow-text">
              Define which modes you want to use. You have to select a channel for each survey mode.
            </p>
          </div>
        </div>
        <div className="row">
          <div className="input-field col s12">
            <select defaultValue={currentChannelId} ref={ref => $(ref).material_select()}>
              { Object.keys(channels).map((channelId) =>
                <option key={channelId} id={channelId} name="channel" value={ channelId } ref={ node => {channels_input.push({id: channelId, node:node})}} >
                  {channels[channelId].name}
                </option>
              )}
              <option>Select please</option>
              <option>Select please</option>
              <option>Select please</option>
            </select>
            <label> Channels </label>
          </div>
        </div>
        <div className="row">
          <div className="col s12">
            <button className="btn waves-effect waves-light" type="button" onClick={() =>
                this.handleSubmit(merge({}, survey, {channel_id: channels_input.find(element => element.node.selected).id }))
              }>
                Submit
            </button>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  channels: state.channels,
  survey: state.surveys[ownProps.params.surveyId]
})

export default withRouter(connect(mapStateToProps)(SurveyChannelsStep));
