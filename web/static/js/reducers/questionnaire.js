import filter from 'lodash/filter'
import findIndex from 'lodash/findIndex'

import * as actions from '../actions/questionnaire'
import uuid from 'node-uuid'
import fetchReducer from './fetch'

const dataReducer = (state, action) => {
  switch (action.type) {
    case actions.CHANGE_NAME: return changeName(state, action)
    case actions.TOGGLE_MODE: return toggleMode(state, action)
    default: return steps(state, action)
  }
}

const steps = (state, action) => {
  const newSteps = state.steps == null ? null : stepsReducer(state.steps, action)

  return do {
    if (newSteps !== state.steps) {
      ({
        ...state,
        steps: newSteps
      })
    } else {
      state
    }
  }
}

const stepsReducer = (state, action) => {
  switch (action.type) {
    case actions.ADD_STEP: return addStep(state, action)
    case actions.CHANGE_STEP_TITLE: return changeStepTitle(state, action)
    case actions.CHANGE_STEP_TYPE: return changeStepType(state, action)
    case actions.CHANGE_STEP_PROMPT_SMS: return changeStepSmsPrompt(state, action)
    case actions.CHANGE_STEP_PROMPT_IVR: return changeStepIvrPrompt(state, action)
    case actions.CHANGE_STEP_AUDIO_ID_IVR: return changeStepIvrAudioId(state, action)
    case actions.CHANGE_STEP_STORE: return changeStepStore(state, action)
    case actions.DELETE_STEP: return deleteStep(state, action)
    case actions.ADD_CHOICE: return addChoice(state, action)
    case actions.DELETE_CHOICE: return deleteChoice(state, action)
    case actions.CHANGE_CHOICE: return changeChoice(state, action)
  }

  return state
}

const addChoice = (state, action) => {
  return changeStep(state, action.stepId, (step) => ({
    ...step,
    choices: [
      ...step.choices,
      {
        value: '',
        responses: {
          sms: [],
          ivr: []
        },
        skipLogic: null
      }
    ]
  }))
}

const deleteChoice = (state, action) => {
  return changeStep(state, action.stepId, (step) => ({
    ...step,
    choices: [
      ...step.choices.slice(0, action.index),
      ...step.choices.slice(action.index + 1)
    ]
  }))
}

const changeChoice = (state, action) => {
  let smsValues = action.choiceChange.smsValues
  let ivrValues = action.choiceChange.ivrValues
  if (action.choiceChange.autoComplete && smsValues == '' && ivrValues == '') {
    [smsValues, ivrValues] = autoComplete(state, action.choiceChange.response)
  }
  let ivrArrayValues = splitValues(ivrValues)
  return changeStep(state, action.stepId, (step) => ({
    ...step,
    choices: [
      ...step.choices.slice(0, action.choiceChange.index),
      {
        ...step.choices[action.choiceChange.index],
        value: action.choiceChange.response,
        responses: {
          sms: splitValues(smsValues),
          ivr: ivrArrayValues
        },
        skipLogic: action.choiceChange.skipLogic
      },
      ...step.choices.slice(action.choiceChange.index + 1)
    ]
  }))
}

const autoComplete = (state, value) => {
  let setted = false

  let smsValues = ''
  let ivrValues = ''

  state.forEach((step) => {
    if (!setted) {
      step.choices.forEach((choice) => {
        if (choice.value == value && !setted) {
          setted = true
          smsValues = choice.responses.sms.join(',')
          ivrValues = choice.responses.ivr.join(',')
        }
      })
    }
  })
  return [smsValues, ivrValues]
}

const splitValues = (values) => {
  return values.split(',').map((r) => r.trim()).filter(r => r.length != 0)
}

const deleteStep = (state, action) => {
  return filter(state, s => s.id != action.stepId)
}

const changeStep = (state, stepId, func) => {
  const stepIndex = findIndex(state, s => s.id == stepId)
  return [
    ...state.slice(0, stepIndex),
    func(state[stepIndex]),
    ...state.slice(stepIndex + 1)
  ]
}

const changeStepSmsPrompt = (state, action) => {
  return changeStep(state, action.stepId, step => ({
    ...step,
    prompt: {
      ...step.prompt,
      sms: action.newPrompt
    }
  }))
}

const changeStepIvrPrompt = (state, action) => {
  return changeStep(state, action.stepId, step => ({
    ...step,
    prompt: {
      ...step.prompt,
      ivr: {
        ...step.prompt.ivr,
        text: action.newPrompt.text,
        audioSource: action.newPrompt.audioSource
      }
    }
  }))
}

const changeStepIvrAudioId = (state, action) => {
  return changeStep(state, action.stepId, step => ({
    ...step,
    prompt: {
      ...step.prompt,
      ivr: {
        ...step.prompt.ivr,
        audioId: action.newId,
        audioSource: 'upload'
      }
    }
  }))
}

const changeStepTitle = (state, action) => {
  return changeStep(state, action.stepId, step => ({
    ...step,
    title: action.newTitle
  }))
}

const changeStepType = (state, action) => {
  return changeStep(state, action.stepId, step => ({
    ...step,
    type: action.stepType,
    choices: []
  }))
}

const changeStepStore = (state, action) => {
  return changeStep(state, action.stepId, step => ({
    ...step,
    store: action.newStore
  }))
}

const addStep = (state, action) => {
  return [
    ...state,
    newStep()
  ]
}

const newStep = () => ({
  id: uuid.v4(),
  type: 'multiple-choice',
  title: '',
  store: '',
  prompt: {
    sms: '',
    ivr: {
      text: '',
      audioSource: 'tts'
    }
  },
  choices: []
})

const toggleMode = (state, action) => {
  let modes = state.modes
  if (modes.indexOf(action.mode) == -1) {
    modes = modes.slice()
    modes.push(action.mode)
  } else {
    modes = modes.filter(mode => mode != action.mode)
  }
  return {
    ...state,
    modes
  }
}

const changeName = (state, action) => {
  return {
    ...state,
    name: action.newName
  }
}

const validateReducer = (reducer) => {
  return (state, action) => {
    const newState = reducer(state, action)
    validate(newState)
    return newState
  }
}

const validate = (state) => {
  if (!state.data) return

  state.errors = {}
  const context = {
    sms: state.data.modes.indexOf('sms') != -1,
    ivr: state.data.modes.indexOf('ivr') != -1,
    errors: state.errors
  }

  validateSteps('steps', state.data.steps, context)
}

const validateSteps = (path, steps, context) => {
  for (let i = 0; i < steps.length; i++) {
    validateStep(`${path}[${i}]`, steps[i], context)
  }
}

const validateStep = (path, step, context) => {
  if (context.sms && isBlank(step.prompt.sms)) {
    addError(context, `${path}.prompt.sms`, 'SMS prompt must not be blank')
  }

  if (context.ivr && step.prompt.ivr && step.prompt.ivr.audioSource == 'tts' && isBlank(step.prompt.ivr.text)) {
    addError(context, `${path}.prompt.ivr.text`, 'Voice prompt must not be blank')
  }

  if (step.type == 'multiple-choice') {
    validateChoices(`${path}.choices`, step.choices, context)
  }
}

const validateChoices = (path, choices, context) => {
  if (choices.length < 2) {
    addError(context, path, 'Must have at least two responses')
  }

  for (let i = 0; i < choices.length; i++) {
    validateChoice(`${path}[${i}]`, choices[i], context)
  }

  const values = []
  let sms = []
  let ivr = []
  for (let i = 0; i < choices.length; i++) {
    let choice = choices[i]
    if (values.includes(choice.value)) {
      addError(context, `${path}[${i}].value`, 'Value already used in a previous response')
    }
    for (let choiceSms of choice.responses.sms) {
      if (sms.includes(choiceSms)) {
        addError(context, `${path}[${i}].sms`, `Value "${choiceSms}" already used in a previous response`)
      }
    }
    for (let choiceIvr of choice.responses.ivr) {
      if (ivr.includes(choiceIvr)) {
        addError(context, `${path}[${i}].ivr`, `Value "${choiceIvr}" already used in a previous response`)
      }
    }
    values.push(choice.value)
    sms.push(...choice.responses.sms)
    ivr.push(...choice.responses.ivr)
  }
}

const validateChoice = (path, choice, context) => {
  if (isBlank(choice.value)) {
    addError(context, `${path}.value`, 'Response must not be blank')
  }

  if (context.sms && choice.responses.sms.length == 0) {
    addError(context, `${path}.sms`, 'SMS must not be blank')
  }

  if (context.ivr) {
    if (choice.responses.ivr.length == 0) {
      addError(context, `${path}.ivr`, '"Phone call" must not be blank')
    }

    if (choice.responses.ivr.some(value => !value.match('^[0-9#*]*$'))) {
      addError(context, `${path}.ivr`, '"Phone call" must only consist of single digits, "#" or "*"')
    }
  }
}

const addError = (context, path, error) => {
  context.errors[path] = context.errors[path] || []
  context.errors[path].push(error)
}

const isBlank = (value) => {
  return !value || value.trim().length == 0
}

export default validateReducer(fetchReducer(actions, dataReducer))
