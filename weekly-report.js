/**********************************************************************************************************************
 * Tsubaiso Bookmarklet: Weekly Report (JavaScript)
 **********************************************************************************************************************/

!function($) {

    // Func: 時分を分に換算
    var hm2min = function(hm) {
        if (hm == null || hm.toString() == "") return null;
        var matches = hm.match("(\\d+):(\\d+)");
        return parseInt(matches[1]) * 60 + parseInt(matches[2]);
    };

    // Func: 分を時分に換算
    var min2hm = function(min) {
        if (min == null || min.toString() == "") return null;
        min = parseInt(min);
        var h = Math.floor(min / 60), m = min % 60;
        for (h = h.toString(); h.length < 2; h = "0" + h);
        for (m = m.toString(); m.length < 2; m = "0" + m);
        return h + ":" + m;
    };

    // Func: 分の丸め (切り上げ)
    var rupmin = function(min) {
        if (min == null || min.toString() == "") return null;
        min = parseInt(min);
        var d = min % 15;
        return d ? min + (15 - d) : min;
    };

    // Func: 分の丸め (切り下げ)
    var rdownmin = function(min) {
        if (min == null || min.toString() == "") return null;
        min = parseInt(min);
        return min - min % 15;
    };

    // Func: 曜日の文字列化
    var day2str = function(day) {
        return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];
    }

    // 年月を特定
    var action = $("form[action^='/timecards/update_monthly']").attr("action");
    var year = parseInt(action.match("year=(\\d+)")[1]);
    var month = parseInt(action.match("month=(\\d+)")[1]);

    // 日別データ収集
    var days = $("form table tr:has(td[id^='punch_time_'])").map(function(index, day) {
        day = $(day);
        var res    = { date: new Date(year, month - 1, index + 1) };
        res.start  = hm2min(day.find("td[id^='punch_time_'][id$='_0']").text());
        res.end    = hm2min(day.find("td[id^='punch_time_'][id$='_3']").text());
        res.rest   = hm2min(day.find(".calculated_break_minutes").data("value"));
        if (res.start != null && res.end != null && res.rest != null) res.work   = res.end - res.rest - res.start;
        res.rstart = rupmin(res.start);
        res.rend   = rdownmin(res.end);
        res.rrest  = rdownmin(res.rest);
        if (res.rstart != null && res.rend != null && res.rrest != null) res.rwork  = res.rend - res.rrest - res.rstart;
        res.memo   = $("#d_" + res.date.getDate() + "_memo").val();
        return res;
    });

    // 週別データ収集
    var weeks = [];
    $.each(days, function(index, day) {
        if (!index || !day.date.getDay()) weeks.push({ title: "第" + (weeks.length + 1) + "週", days: [] });
        weeks[weeks.length - 1].days.push(day);
    });
    $.each(weeks, function(index, week) {
        week.total = { work: 0, rwork: 0 };
        $.each(week.days, function(index, day) {
            if (day.work) week.total.work += day.work;
            if (day.rwork) week.total.rwork += day.rwork;
        });
    });
    weeks.push({ title: "合計", days: [], total: { work: 0, rwork: 0 } });
    $.each(days, function(index, day) {
        if (day.work) weeks[weeks.length - 1].total.work += day.work;
        if (day.rwork) weeks[weeks.length - 1].total.rwork += day.rwork;
    });

    // レポート
    var doc = window.open("", "_blank").document, head = $(doc.head), body = $(doc.body);
    head.append(
        $("<base>", { href: "https://akihyro.github.io/tsubaiso-bookmarklet/" }),
        $("<title>", { text: "Tsubaiso Weekly Report" }),
        $("<link>", { href: "weekly-report.css", rel: "stylesheet", type: "text/css" })
    );
    body.append($("<h1>", { text: "Tsubaiso Weekly Report" }));
    $.each(weeks, function(index, week) {
        body.append(
            $("<h2>", { text: week.title }),
            $("<table>").append(
                $("<tr>").append(
                    $("<th>", { class: "date", text: "日付" }),
                    $("<th>", { class: "day",  text: "曜日" }),
                    $("<th>", { class: "sep" }),
                    $("<th>", { class: "time", text: "開始" }),
                    $("<th>", { class: "time", text: "終了" }),
                    $("<th>", { class: "time", text: "休憩" }),
                    $("<th>", { class: "time", text: "勤務" }),
                    $("<th>", { class: "sep" }),
                    $("<th>", { class: "time", text: "開始 (丸め)" }),
                    $("<th>", { class: "time", text: "終了 (丸め)" }),
                    $("<th>", { class: "time", text: "休憩 (丸め)" }),
                    $("<th>", { class: "time", text: "勤務 (丸め)" }),
                    $("<th>", { class: "sep" }),
                    $("<th>", { class: "memo", text: "メモ" })
                ),
                $.map(week.days, function(day, index) {
                    return $("<tr>", { class: "day-" + day.date.getDay() }).append(
                        $("<td>", { class: "date", text: day.date.getDate() }),
                        $("<td>", { class: "day",  text: day2str(day.date.getDay()) }),
                        $("<td>", { class: "sep" }),
                        $("<td>", { class: "time", text: min2hm(day.start) || "-" }),
                        $("<td>", { class: "time", text: min2hm(day.end) || "-" }),
                        $("<td>", { class: "time", text: min2hm(day.rest) || "-" }),
                        $("<td>", { class: "time", text: min2hm(day.work) || "-" }),
                        $("<td>", { class: "sep" }),
                        $("<td>", { class: "time", text: min2hm(day.rstart) || "-" }),
                        $("<td>", { class: "time", text: min2hm(day.rend) || "-" }),
                        $("<td>", { class: "time", text: min2hm(day.rrest) || "-" }),
                        $("<td>", { class: "time", text: min2hm(day.rwork) || "-" }),
                        $("<td>", { class: "sep" }),
                        $("<td>", { class: "memo", text: day.memo })
                    )
                }),
                $("<tr>", { class: "day-total" }).append(
                    $("<td>", { class: "date" }),
                    $("<td>", { class: "day" }),
                    $("<td>", { class: "sep" }),
                    $("<td>", { class: "time" }),
                    $("<td>", { class: "time" }),
                    $("<td>", { class: "time" }),
                    $("<td>", { class: "time", text: min2hm(week.total.work) }),
                    $("<td>", { class: "sep" }),
                    $("<td>", { class: "time" }),
                    $("<td>", { class: "time" }),
                    $("<td>", { class: "time" }),
                    $("<td>", { class: "time", text: min2hm(week.total.rwork) }),
                    $("<td>", { class: "sep" }),
                    $("<td>", { class: "memo" })
                )
            )
        );
    });

}(jQuery);
