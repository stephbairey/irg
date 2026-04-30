/**
 * Mobile navigation toggle. Vanilla JS.
 *
 * Closes on link tap, on Escape, when the viewport grows past the desktop
 * breakpoint, and when tapping outside the menu.
 */
(function () {
	var btn  = document.getElementById("tbl-nav-toggle");
	var menu = document.getElementById("tbl-nav-mobile");
	if (!btn || !menu) return;

	var iconOpen  = btn.querySelector(".tbl-icon-open");
	var iconClose = btn.querySelector(".tbl-icon-close");

	function setOpen(open) {
		btn.setAttribute("aria-expanded", open ? "true" : "false");
		btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
		if (open) menu.removeAttribute("hidden"); else menu.setAttribute("hidden", "");
		if (iconOpen)  iconOpen.toggleAttribute("hidden", open);
		if (iconClose) iconClose.toggleAttribute("hidden", !open);
		document.body.style.overflow = open ? "hidden" : "";
	}

	btn.addEventListener("click", function () {
		setOpen(btn.getAttribute("aria-expanded") !== "true");
	});

	menu.addEventListener("click", function (e) {
		if (e.target.tagName === "A") setOpen(false);
	});

	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
			setOpen(false);
			btn.focus();
		}
	});

	document.addEventListener("click", function (e) {
		if (btn.getAttribute("aria-expanded") !== "true") return;
		if (btn.contains(e.target) || menu.contains(e.target)) return;
		setOpen(false);
	});

	if (window.matchMedia) {
		var mq = window.matchMedia("(min-width: 768px)");
		mq.addEventListener("change", function (e) {
			if (e.matches) setOpen(false);
		});
	}
})();
