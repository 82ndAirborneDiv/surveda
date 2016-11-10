defmodule Ask.SessionTest do
  use Ask.ModelCase
  use Ask.DummySteps
  import Ask.Factory
  alias Ask.Runtime.Session
  alias Ask.TestChannel

  setup do
    quiz = insert(:questionnaire, steps: @dummy_steps)
    respondent = insert(:respondent)
    test_channel = TestChannel.new
    channel = build(:channel, settings: test_channel |> TestChannel.settings)
    {:ok, quiz: quiz, respondent: respondent, test_channel: test_channel, channel: channel}
  end

  test "start", %{quiz: quiz, respondent: respondent, test_channel: test_channel, channel: channel} do
    phone_number = respondent.phone_number

    {session, timeout} = Session.start(quiz, respondent, channel)
    assert %Session{} = session
    assert 10 = timeout

    assert_receive [:setup, ^test_channel, ^respondent]
    assert_receive [:ask, ^test_channel, ^phone_number, ["Do you smoke? Reply 1 for YES, 2 for NO"]]
  end

  test "start with channel without push", %{quiz: quiz, respondent: respondent} do
    test_channel = TestChannel.new(false)
    channel = build(:channel, settings: test_channel |> TestChannel.settings)

    {session, timeout} = Session.start(quiz, respondent, channel)
    assert %Session{} = session
    assert 10 = timeout

    assert_receive [:setup, ^test_channel, ^respondent]
    refute_receive _
  end

  test "retry question", %{quiz: quiz, respondent: respondent, test_channel: test_channel, channel: channel} do
    phone_number = respondent.phone_number

    assert {session, 5} = Session.start(quiz, respondent, channel, [5])
    assert_receive [:setup, ^test_channel, ^respondent]
    assert_receive [:ask, ^test_channel, ^phone_number, ["Do you smoke? Reply 1 for YES, 2 for NO"]]

    assert {session, 10} = Session.timeout(session)
    assert_receive [:ask, ^test_channel, ^phone_number, ["Do you smoke? Reply 1 for YES, 2 for NO"]]

    assert :failed = Session.timeout(session)
  end

  test "last retry", %{quiz: quiz, respondent: respondent, test_channel: test_channel, channel: channel} do
    phone_number = respondent.phone_number

    {session, 10} = Session.start(quiz, respondent, channel)
    assert_receive [:setup, ^test_channel, ^respondent]
    assert_receive [:ask, ^test_channel, ^phone_number, ["Do you smoke? Reply 1 for YES, 2 for NO"]]

    assert :failed = Session.timeout(session)
  end

  test "uses retry configuration", %{quiz: quiz, respondent: respondent, channel: channel} do
    assert {_, 60} = Session.start(quiz, respondent, channel, [60])
  end

  test "step", %{quiz: quiz, respondent: respondent, channel: channel} do
    {session, _} = Session.start(quiz, respondent, channel)

    step_result = Session.sync_step(session, "N")
    assert {:ok, %Session{}, {:prompt, "Do you exercise? Reply 1 for YES, 2 for NO"}, 10} = step_result

    assert [response] = respondent |> Ecto.assoc(:responses) |> Ask.Repo.all
    assert response.field_name == "Smokes"
    assert response.value == "No"
  end

  test "end", %{quiz: quiz, respondent: respondent, channel: channel} do
    {session, _} = Session.start(quiz, respondent, channel)

    {:ok, session, _, _} = Session.sync_step(session, "Y")
    {:ok, session, _, _} = Session.sync_step(session, "N")
    step_result = Session.sync_step(session, "99")
    assert :end == step_result

    responses = respondent
    |> Ecto.assoc(:responses)
    |> Ecto.Query.order_by(:id)
    |> Ask.Repo.all

    assert [
      %{field_name: "Smokes", value: "Yes"},
      %{field_name: "Exercises", value: "No"},
      %{field_name: "Perfect Number", value: "99"}] = responses
  end
end
