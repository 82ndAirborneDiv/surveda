defmodule Ask.Runtime.Session do
  alias Ask.Runtime.{Flow, Channel, Session}
  alias Ask.Repo
  defstruct [:channel, :flow, :respondent, :retries]

  @timeout 10

  def start(questionnaire, respondent, channel, retries \\ []) do
    runtime_channel = Ask.Channel.runtime_channel(channel)
    flow = Flow.start(questionnaire, channel.type)
    runtime_channel |> Channel.setup(respondent)

    flow = case runtime_channel |> Channel.can_push_question? do
      true ->
        case flow |> Flow.step do
          {:end, _} -> :end
          {:ok, flow, %{prompts: [prompt]}} ->
            runtime_channel |> Channel.ask(respondent.phone_number, [prompt])
            flow
        end

      false ->
        flow
    end

    case flow do
      :end -> :end
      _ ->
        session = %Session{channel: channel, flow: flow, respondent: respondent, retries: retries}
        {session, current_timeout(session)}
    end
  end

  def timeout(session) do
    case session.retries do
      [] -> :failed
      [_ | retries] ->
        runtime_channel = Ask.Channel.runtime_channel(session.channel)
        case runtime_channel |> Channel.can_push_question? do
          true ->
            {:ok, _flow, %{prompts: prompts}} = Flow.retry(session.flow)
            runtime_channel |> Channel.ask(session.respondent.phone_number, prompts)

          false ->
            runtime_channel |> Channel.setup(session.respondent)
        end
        session = %{session | retries: retries}
        {session, current_timeout(session)}
    end
  end

  def sync_step(session, reply) do
    case Flow.step(session.flow, reply) do
      {:end, %{stores: stores}} ->
        store_responses(session.respondent, stores)
        :end

      {:ok, flow, %{prompts: [prompt], stores: stores}} ->
        store_responses(session.respondent, stores)
        {:ok, %{session | flow: flow}, {:prompt, prompt}, @timeout}
    end
  end

  def dump(session) do
    %{
      channel_id: session.channel.id,
      flow: session.flow |> Flow.dump,
      respondent_id: session.respondent.id,
      retries: session.retries
    }
  end

  def load(state) do
    %Session{
      channel: Repo.get(Ask.Channel, state["channel_id"]),
      flow: Flow.load(state["flow"]),
      respondent: Repo.get(Ask.Respondent, state["respondent_id"]),
      retries: state["retries"]
    }
  end

  defp store_responses(respondent, stores) do
    stores |> Enum.each(fn {field_name, value} ->
      respondent
      |> Ecto.build_assoc(:responses, field_name: field_name, value: value)
      |> Ask.Repo.insert
    end)
  end

  defp current_timeout(%Session{retries: []}) do
    @timeout
  end

  defp current_timeout(%Session{retries: [next_retry | _]}) do
    next_retry
  end
end
