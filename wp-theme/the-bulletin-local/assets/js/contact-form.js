/**
 * Contact form — AJAX submit to admin-ajax.php (action: tbl_contact).
 * Recipient is set server-side from the subsite slug; the client just sends
 * the message.
 */
(function () {
	var form = document.getElementById("tbl-contact-form");
	if (!form || typeof window.TBL_CONTACT === "undefined") return;

	var statusEl = document.getElementById("tbl-contact-status");

	function setStatus(state, msg) {
		if (!statusEl) return;
		if (state) statusEl.dataset.state = state; else statusEl.removeAttribute("data-state");
		statusEl.textContent = msg || "";
	}

	form.addEventListener("submit", function (e) {
		e.preventDefault();
		var btn = form.querySelector("button[type=submit]");
		setStatus("sending", "Sending…");
		if (btn) btn.disabled = true;

		var fd = new FormData(form);
		fd.append("action", "tbl_contact");
		fd.append("nonce", window.TBL_CONTACT.nonce);

		fetch(window.TBL_CONTACT.ajaxUrl, {
			method: "POST",
			body: fd,
			credentials: "same-origin"
		})
			.then(function (res) { return res.json().then(function (j) { return { ok: res.ok, json: j }; }); })
			.then(function (r) {
				if (r.ok && r.json && r.json.success) {
					setStatus("ok", (r.json.data && r.json.data.message) || "Thanks for reaching out!");
					form.reset();
					if (window.turnstile && typeof window.turnstile.reset === "function") {
						window.turnstile.reset();
					}
				} else {
					var msg = (r.json && r.json.data && r.json.data.message) || "Something went wrong. Please try again.";
					setStatus("error", msg);
					if (btn) btn.disabled = false;
					if (window.turnstile && typeof window.turnstile.reset === "function") {
						window.turnstile.reset();
					}
				}
			})
			.catch(function () {
				setStatus("error", "Couldn't reach the server. Please try again.");
				if (btn) btn.disabled = false;
				if (window.turnstile && typeof window.turnstile.reset === "function") {
					window.turnstile.reset();
				}
			});
	});
})();
