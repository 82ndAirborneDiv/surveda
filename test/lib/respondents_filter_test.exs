defmodule Ask.RespondentsFilterTest do
  import Ecto.Query, only: [from: 2]
  use Ask.ConnCase
  alias Ask.RespondentsFilter
  alias Ecto.Adapters.SQL

  @dummy_string "my-string"
  @dummy_date "2020-06-02"

  setup_all do
    {:ok, %{date_format_string: RespondentsFilter.date_format_string()}}
  end

  describe "parsing" do
    test "parse disposition from q" do
      q = "disposition:#{@dummy_string}"

      filter = RespondentsFilter.parse(q)

      assert filter.disposition == @dummy_string
    end

    test "parse since from q", %{date_format_string: date_format_string} do
      q = "since:#{@dummy_date}"

      filter = RespondentsFilter.parse(q)

      assert filter.since == Timex.parse!(@dummy_date, date_format_string)
    end

    test "parse since and disposition", %{date_format_string: date_format_string} do
      q = "since:#{@dummy_date} disposition:#{@dummy_string}"

      filter = RespondentsFilter.parse(q)

      assert filter.since == Timex.parse!(@dummy_date, date_format_string)
      assert filter.disposition == @dummy_string

      # change the arguments order
      q = "disposition:#{@dummy_string} since:#{@dummy_date}"

      filter = RespondentsFilter.parse(q)

      assert filter.since == Timex.parse!(@dummy_date, date_format_string)
      assert filter.disposition == @dummy_string
    end

    test "parse when irrelevant stuffs", %{date_format_string: date_format_string} do
      q = "foo disposition:#{@dummy_string} bar since:#{@dummy_date} baz"

      filter = RespondentsFilter.parse(q)

      assert filter.since == Timex.parse!(@dummy_date, date_format_string)
      assert filter.disposition == @dummy_string

      # change the arguments order
      q = "disposition:#{@dummy_string} foo bar since:#{@dummy_date}"

      filter = RespondentsFilter.parse(q)

      assert filter.since == Timex.parse!(@dummy_date, date_format_string)
      assert filter.disposition == @dummy_string
    end

    test "put disposition when empty" do
      filter = %RespondentsFilter{}

      filter = RespondentsFilter.put_disposition(filter, @dummy_string)

      assert filter.disposition == @dummy_string
      refute filter.since
    end

    test "put disposition when since", %{date_format_string: date_format_string} do
      filter = %RespondentsFilter{since: Timex.parse!(@dummy_date, date_format_string)}

      filter = RespondentsFilter.put_disposition(filter, @dummy_string)

      assert filter.since == Timex.parse!(@dummy_date, date_format_string)
      assert filter.disposition == @dummy_string
    end

    test "put disposition when exists", %{date_format_string: date_format_string} do
      filter = %RespondentsFilter{
        disposition: "old-disposition",
        since: Timex.parse!(@dummy_date, date_format_string)
      }

      filter = RespondentsFilter.put_disposition(filter, @dummy_string)

      assert filter.since == Timex.parse!(@dummy_date, date_format_string)
      assert filter.disposition == @dummy_string
    end

    test "parse since when empty", %{date_format_string: date_format_string} do
      filter = %RespondentsFilter{}

      filter = RespondentsFilter.parse_since(filter, @dummy_date)

      assert filter.since == Timex.parse!(@dummy_date, date_format_string)
      refute filter.disposition
    end

    test "parse since when disposition", %{date_format_string: date_format_string} do
      filter = %RespondentsFilter{disposition: @dummy_string}

      filter = RespondentsFilter.parse_since(filter, @dummy_date)

      assert filter.since == Timex.parse!(@dummy_date, date_format_string)
      assert filter.disposition == @dummy_string
    end

    test "parse since when exists", %{date_format_string: date_format_string} do
      filter = %RespondentsFilter{
        disposition: @dummy_string,
        since: Timex.parse!("2019-01-01", date_format_string)
      }

      filter = RespondentsFilter.parse_since(filter, @dummy_date)

      assert filter.since == Timex.parse!(@dummy_date, date_format_string)
      assert filter.disposition == @dummy_string
    end

    test "put final" do
      filter = %RespondentsFilter{}

      filter = RespondentsFilter.put_final(filter, @dummy_string)

      assert filter.final == @dummy_string
    end
  end

  describe "filtering" do
    setup do
      now = Timex.now()
      insert_respondents_set(now)

      {
        :ok,
        now: now, total_respondents_count: count_all_respondents()
      }
    end

    test "filter by disposition", %{total_respondents_count: total_respondents_count} do
      queued_filter_where = disposition_filter_where("queued")
      started_filter_where = disposition_filter_where("started")
      contacted_filter_where = disposition_filter_where("contacted")

      queued_respondents_count = filter_respondents_and_count(queued_filter_where)
      started_respondents_count = filter_respondents_and_count(started_filter_where)
      contacted_respondents_count = filter_respondents_and_count(contacted_filter_where)

      assert total_respondents_count == 45
      assert queued_respondents_count == 6
      assert started_respondents_count == 15
      assert contacted_respondents_count == 24
    end

    test "filter by since", %{
      now: now,
      total_respondents_count: total_respondents_count
    } do
      yesterday_filter_where = since_days_ago_filter_where(now, 1)
      three_days_ago_filter_where = since_days_ago_filter_where(now, 3)
      five_days_ago_filter_where = since_days_ago_filter_where(now, 5)

      since_yesterday_respondents_count = filter_respondents_and_count(yesterday_filter_where)

      since_three_days_ago_respondents_count =
        filter_respondents_and_count(three_days_ago_filter_where)

      since_five_days_ago_respondents_count =
        filter_respondents_and_count(five_days_ago_filter_where)

      assert total_respondents_count == 45
      assert since_yesterday_respondents_count == 12
      assert since_three_days_ago_respondents_count == 27
      assert since_five_days_ago_respondents_count == 45
    end

    test "filter by disposition and since", %{
      now: now,
      total_respondents_count: total_respondents_count
    } do
      queued_yesterday_filter_where = disposition_since_days_ago_filter_where("queued", now, 1)

      started_three_days_ago_filter_where =
        disposition_since_days_ago_filter_where("started", now, 3)

      contacted_five_days_ago_filter_where =
        disposition_since_days_ago_filter_where("contacted", now, 5)

      queued_yesterday_respondents_count =
        filter_respondents_and_count(queued_yesterday_filter_where)

      started_three_days_ago_respondents_count =
        filter_respondents_and_count(started_three_days_ago_filter_where)

      contacted_five_days_ago_respondents_count =
        filter_respondents_and_count(contacted_five_days_ago_filter_where)

      assert total_respondents_count == 45
      assert queued_yesterday_respondents_count == 1
      assert started_three_days_ago_respondents_count == 9
      assert contacted_five_days_ago_respondents_count == 24
    end
  end

  # These tests try to cover the case where Surveda is being used by external services like
  # SurvedaOnaConnector
  # Before the repondents filter module existed, the "since" url param received in the respondent
  # controller was being applied directly. So the understanding of the received date format string
  # was delegated to Ecto
  # See: https://github.com/instedd/surveda-ona-connector
  # Details: lib/surveda_ona_connector/runtime/surveda_client.ex#L58-L66
  describe "filter by since without parsing it" do
    setup do
      # prepare the dates
      dummy_date = Timex.parse!("2020-06-01", "{YYYY}-{0M}-{0D}")
      two_days_after = Timex.shift(dummy_date, days: 2)
      # prepare the respondents
      for _ <- 1..2, do: insert(:respondent, disposition: "queued", updated_at: dummy_date)
      for _ <- 1..3, do: insert(:respondent, disposition: "queued", updated_at: two_days_after)

      {
        :ok,
        total_respondents_count: count_all_respondents()
      }
    end

    test "support a RFC 3339 5.6 date-time variation used by Ona connector", %{
      total_respondents_count: total_respondents_count
    } do
      # prepare the date in a format string that Ecto should handle properly
      day_between = "2020-06-02 00:20:56.000000Z"

      # put since directly (without parsing it), filter, and count
      since_day_between_respondents_count = put_since_filter_and_count(day_between)

      assert total_respondents_count == 5
      assert since_day_between_respondents_count == 3
    end

    test "support a ISO 8601 date-time variation", %{
      total_respondents_count: total_respondents_count
    } do
      # prepare the date in a format string that Ecto should handle properly
      day_between = "2020-06-02T19:20:30+01:00"

      # put since directly (without parsing it), filter, and count
      since_day_between_respondents_count = put_since_filter_and_count(day_between)

      assert total_respondents_count == 5
      assert since_day_between_respondents_count == 3
    end
  end

  # These tests try to cover the support for optimized queries used by the respondent controller
  # for generating the CSV results file
  # See https://github.com/instedd/surveda/commit/c812c676045debac25da816ba40f29ed5331b0a9
  describe "support optimized queries" do
    setup do
      # prepare the respondents
      for _ <- 1..2, do: insert(:respondent, disposition: "queued")
      for _ <- 1..3, do: insert(:respondent, disposition: "started")

      {
        :ok,
        total_respondents_count: count_all_respondents()
      }
    end

    test "filter using optimized queries", %{
      total_respondents_count: total_respondents_count
    } do
      optimized_filter_where = disposition_filter_where("queued", optimized: true)
      optimized_query = optimized_count_respondents_query(optimized_filter_where)

      filtered_respondents_count = Repo.one(optimized_query)
      optimized_sql = SQL.to_sql(:all, Repo, optimized_query)

      assert total_respondents_count == 5
      assert filtered_respondents_count == 2

      assert optimized_sql == {
               """
               SELECT count(r0.`id`)
                FROM `respondents` AS r0
                INNER JOIN `respondents` AS r1 ON r0.`id` = r1.`id`
                WHERE (TRUE AND (r1.`disposition` = ?))
               """
               |> String.replace("\n", ""),
               ["queued"]
             }
    end

    test "filter without using optimized queries", %{
      total_respondents_count: total_respondents_count
    } do
      filter_where = disposition_filter_where("queued")
      query = count_respondents_query(filter_where)

      filtered_respondents_count = Repo.one(query)
      sql = SQL.to_sql(:all, Repo, query)

      assert total_respondents_count == 5
      assert filtered_respondents_count == 2

      assert sql == {
               """
               SELECT count(r0.`id`)
                FROM `respondents` AS r0
                WHERE (TRUE AND (r0.`disposition` = ?))
               """
               |> String.replace("\n", ""),
               ["queued"]
             }
    end
  end

  # Put since directly (without parsing it), filter, and count
  defp put_since_filter_and_count(date_time_string) do
    RespondentsFilter.put_since(%RespondentsFilter{}, date_time_string)
    |> RespondentsFilter.filter_where()
    |> filter_respondents_and_count()
  end

  defp insert_respondents_set(now) do
    two_days_ago = Timex.shift(now, days: -2)
    four_days_ago = Timex.shift(now, days: -4)

    for _ <- 1..1, do: insert(:respondent, disposition: "queued")
    for _ <- 1..2, do: insert(:respondent, disposition: "queued", updated_at: two_days_ago)
    for _ <- 1..3, do: insert(:respondent, disposition: "queued", updated_at: four_days_ago)
    for _ <- 1..4, do: insert(:respondent, disposition: "started")
    for _ <- 1..5, do: insert(:respondent, disposition: "started", updated_at: two_days_ago)
    for _ <- 1..6, do: insert(:respondent, disposition: "started", updated_at: four_days_ago)
    for _ <- 1..7, do: insert(:respondent, disposition: "contacted")
    for _ <- 1..8, do: insert(:respondent, disposition: "contacted", updated_at: two_days_ago)
    for _ <- 1..9, do: insert(:respondent, disposition: "contacted", updated_at: four_days_ago)
  end

  defp disposition_since_days_ago_filter_where(disposition, now, days_ago),
    do:
      %RespondentsFilter{disposition: disposition, since: Timex.shift(now, days: -days_ago)}
      |> RespondentsFilter.filter_where()

  defp since_days_ago_filter_where(now, days_ago),
    do:
      %RespondentsFilter{since: Timex.shift(now, days: -days_ago)}
      |> RespondentsFilter.filter_where()

  defp disposition_filter_where(disposition, options \\ []) do
    optimized = Keyword.get(options, :optimized, false)

    %RespondentsFilter{disposition: disposition}
    |> RespondentsFilter.filter_where(optimized: optimized)
  end

  defp count_all_respondents() do
    Repo.one(
      from(r in "respondents",
        select: count(r.id)
      )
    )
  end

  defp filter_respondents_and_count(filter_where), do:
    count_respondents_query(filter_where)
    |> Repo.one()

  defp count_respondents_query(filter_where),
    do:
      from(r in "respondents",
        where: ^filter_where,
        select: count(r.id)
      )

  defp optimized_count_respondents_query(filter_where),
    do:
      from(r in "respondents",
        join: r1 in "respondents",
        on: r.id == r1.id,
        where: ^filter_where,
        select: count(r.id)
      )
end
