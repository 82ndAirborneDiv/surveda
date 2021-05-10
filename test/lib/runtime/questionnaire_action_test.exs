defmodule Ask.Runtime.QuestionnaireExportTest do
  use Ask.ModelCase
  use Ask.DummyQuestionnaires
  alias Ask.Questionnaire
  alias Ask.Runtime.{QuestionnaireExport, CleanI18n}

  describe "Ask.Runtime.QuestionnaireExport/1" do
    test "SMS - exports an empty questionnaire" do
      sms_empty_quiz = Map.merge(%Questionnaire{}, @sms_empty_quiz)

      sms_empty_quiz_export = QuestionnaireExport.export(sms_empty_quiz)

      assert sms_empty_quiz_export == %{
               manifest: @sms_empty_quiz,
               audio_ids: []
             }
    end

    test "SMS - exports a simple questionnaire" do
      sms_simple_quiz = Map.merge(%Questionnaire{}, @sms_simple_quiz)

      simple_quiz_export = QuestionnaireExport.export(sms_simple_quiz)

      assert simple_quiz_export == %{
               manifest: @sms_simple_quiz,
               audio_ids: []
             }
    end

    test "IVR - exports a simple questionnaire" do
      ivr_simple_quiz = Map.merge(%Questionnaire{}, @ivr_simple_quiz)

      ivr_simple_quiz_export = QuestionnaireExport.export(ivr_simple_quiz)

      assert ivr_simple_quiz_export == %{
               manifest: @ivr_simple_quiz,
               audio_ids: []
             }
    end

    test "IVR - exports a simple questionnaire with audios" do
      ivr_audio_simple_quiz = Map.merge(%Questionnaire{}, @ivr_audio_simple_quiz)

      ivr_audio_simple_quiz_export = QuestionnaireExport.export(ivr_audio_simple_quiz)

      assert ivr_audio_simple_quiz_export == %{
               manifest: @ivr_audio_simple_quiz,
               audio_ids: [@ivr_audio_id]
             }
    end

    test "Mobile Web - exports a simple questionnaire" do
      mobileweb_simple_quiz = Map.merge(%Questionnaire{}, @mobileweb_simple_quiz)

      mobileweb_simple_quiz_export = QuestionnaireExport.export(mobileweb_simple_quiz)

      assert mobileweb_simple_quiz_export == %{
               manifest: @mobileweb_simple_quiz,
               audio_ids: []
             }
    end

    test "SMS - exports a multilingual questionnaire" do
      sms_multilingual_quiz = Map.merge(%Questionnaire{}, @sms_multilingual_quiz)

      sms_multilingual_quiz_export = QuestionnaireExport.export(sms_multilingual_quiz)

      assert sms_multilingual_quiz_export == %{
               manifest: @sms_multilingual_quiz,
               audio_ids: []
             }
    end

    test "SMS - exports a deleted language simple questionnaire" do
      deleted_language_simple_quiz = Map.merge(%Questionnaire{}, @deleted_language_simple_quiz)

      deleted_language_simple_quiz_export =
        QuestionnaireExport.export(deleted_language_simple_quiz)

      assert deleted_language_simple_quiz_export == %{
               manifest: @deleted_language_simple_quiz_export,
               audio_ids: []
             }
    end

    test "SMS - exports a deleted language with section questionnaire" do
      deleted_language_quiz_with_section =
        Map.merge(%Questionnaire{}, @deleted_language_quiz_with_section)

      deleted_language_quiz_with_section_export =
        QuestionnaireExport.export(deleted_language_quiz_with_section)

      assert deleted_language_quiz_with_section_export == %{
               manifest: @deleted_language_quiz_with_section_export,
               audio_ids: []
             }
    end
  end

  describe "QuestionnaireExport.clean_i18n_quiz/1" do
    test "doesn't change a quiz with no deleted languages" do
      quiz = insert(:questionnaire, languages: ["en"])

      clean = QuestionnaireExport.clean_i18n_quiz(quiz)

      assert clean == quiz
    end

    test "works when quota_completed_steps is nil" do
      quiz = insert(:questionnaire, languages: ["en"], quota_completed_steps: nil)

      clean = QuestionnaireExport.clean_i18n_quiz(quiz)

      assert clean == quiz
    end
  end

  describe "CleanI18n.clean/3" do
    test "cleans a base case" do
      entity = %{"en" => "foo", "es" => "bar"}

      clean = CleanI18n.clean(entity, ["en"], "")

      assert clean == %{"en" => "foo"}
    end

    test "cleans every map element" do
      entity = %{"bar" => %{"en" => "foo", "es" => "bar"}}

      clean = CleanI18n.clean(entity, ["en"], ".[]")

      assert clean == %{"bar" => %{"en" => "foo"}}
    end

    test "cleans every list element" do
      entity = [%{"en" => "foo", "es" => "bar"}]

      clean = CleanI18n.clean(entity, ["en"], ".[]")

      assert clean == [%{"en" => "foo"}]
    end

    test "cleans the requested key of a map" do
      entity = %{"a" => %{"en" => "foo", "es" => "bar"}, "b" => %{"en" => "foo", "es" => "bar"}}

      clean = CleanI18n.clean(entity, ["en"], ".a")

      assert clean == %{"a" => %{"en" => "foo"}, "b" => %{"en" => "foo", "es" => "bar"}}
    end

    test "doesn't crash when the content of the requested key isn't a map" do
      entity = %{"foo" => "bar"}

      clean = CleanI18n.clean(entity, ["baz"], ".foo")

      assert clean == %{"foo" => "bar"}
    end

    test "cleans choices (when the content of one of the requested keys isn't a map)" do
      # A real case cut that was making it crash.
      # What was making it crash: `"ivr" => []`. Because [] isn't a map.
      entity = [
        %{
          "choices" => [
            %{
              "responses" => %{"ivr" => [], "mobileweb" => %{"en" => "foo", "es" => "bar"}}
            }
          ]
        }
      ]

      clean = CleanI18n.clean(entity, ["en"], ".[].choices.[].responses.[]")

      assert clean == [
               %{
                 "choices" => [
                   %{
                     "responses" => %{"ivr" => [], "mobileweb" => %{"en" => "foo"}}
                   }
                 ]
               }
             ]
    end
  end
end
