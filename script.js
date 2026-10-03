(function () {
  "use strict";
  var KEY = "my-todo-v2", THEME = "my-todo-theme";
  var tasks = read(KEY, []), filter = "all";
  var $ = function (id) { return document.getElementById(id); };
  var list = $("list");

  function read(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function save() { write(KEY, tasks); }
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt) n.textContent = txt; return n; }

  $("date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  function setTheme(t) { document.documentElement.dataset.theme = t; $("theme").textContent = t === "dark" ? "☀️" : "🌙"; write(THEME, t); }
  setTheme(read(THEME, window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  $("theme").onclick = function () { setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"); };

  $("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var text = $("text").value.trim(); if (!text) return;
    tasks.unshift({ id: Date.now(), text: text, priority: $("priority").value, due: $("due").value, done: false });
    e.target.reset(); $("priority").value = "med"; save(); render(); $("text").focus();
  });

  $("tabs").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    filter = b.dataset.f;
    [].forEach.call($("tabs").children, function (x) { x.classList.toggle("on", x === b); });
    render();
  });
  $("clear").onclick = function () { tasks = tasks.filter(function (t) { return !t.done; }); save(); render(); };

  function confetti(x, y) {
    var colors = ["#5eead4", "#ff7ab8", "#ffe14d", "#7aa2ff"];
    for (var i = 0; i < 18; i++) {
      var b = el("i", "bit"), a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 80;
      b.style.left = x + "px"; b.style.top = y + "px"; b.style.background = colors[i % 4];
      b.style.setProperty("--x", Math.cos(a) * d + "px"); b.style.setProperty("--y", Math.sin(a) * d + 40 + "px");
      document.body.appendChild(b); setTimeout(b.remove.bind(b), 950);
    }
  }

  function startEdit(t, name) {
    var inp = el("input", "edit"); inp.value = t.text; inp.maxLength = 120;
    name.replaceWith(inp); inp.focus(); inp.select();
    var closed = false;
    function end(ok) { if (closed) return; closed = true; if (ok && inp.value.trim()) t.text = inp.value.trim(); save(); render(); }
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") end(true); if (e.key === "Escape") end(false); });
    inp.addEventListener("blur", function () { end(true); });
  }

  function render() {
    list.innerHTML = "";
    var shown = tasks.filter(function (t) { return filter === "all" || (filter === "done" ? t.done : !t.done); });
    if (!shown.length) list.appendChild(el("li", "empty", filter === "done" ? "Nothing completed yet. Tick a task to see it here." : "No tasks yet. Type one above and press Add task."));
    shown.forEach(function (t) {
      var li = el("li", "task" + (t.done ? " done" : ""));
      var cb = el("input"); cb.type = "checkbox"; cb.checked = t.done; cb.setAttribute("aria-label", "Mark complete: " + t.text);
      cb.onchange = function () {
        t.done = cb.checked; save();
        if (t.done) { var r = cb.getBoundingClientRect(); confetti(r.left + 14, r.top + 14); }
        render();
      };
      var info = el("div", "info"), name = el("p", "name", t.text);
      name.title = "Click to edit"; name.onclick = function () { startEdit(t, name); };
      var sub = el("div", "sub");
      sub.appendChild(el("span", "chip " + t.priority, { low: "Low", med: "Medium", high: "High" }[t.priority]));
      if (t.due) {
        var d = new Date(t.due + "T23:59:59"), late = !t.done && d < new Date();
        sub.appendChild(el("span", late ? "late" : "", (late ? "Overdue: " : "Due ") + d.toLocaleDateString(undefined, { day: "numeric", month: "short" })));
      }
      info.append(name, sub);
      var del = el("button", "del", "🗑"); del.setAttribute("aria-label", "Delete task: " + t.text);
      del.onclick = function () { tasks = tasks.filter(function (k) { return k.id !== t.id; }); save(); render(); };
      li.append(cb, info, del); list.appendChild(li);
    });
    var n = tasks.filter(function (t) { return t.done; }).length, p = tasks.length ? Math.round(n / tasks.length * 100) : 0;
    $("count").textContent = (tasks.length - n) + " pending, " + n + " completed";
    $("pct").textContent = p + "%";
    $("prog").style.strokeDashoffset = 113.1 * (1 - p / 100);
  }
  render();
})();