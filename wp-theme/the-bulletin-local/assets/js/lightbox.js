/**
 * Photo lightbox. Vanilla JS.
 */
(function () {
	var grid = document.querySelector(".tbl-photo-grid");
	var box  = document.getElementById("tbl-lightbox");
	if (!grid || !box) return;

	var img     = box.querySelector(".tbl-lightbox-image");
	var caption = box.querySelector(".tbl-lightbox-caption");
	var closeBtn = box.querySelector(".tbl-lightbox-close");

	function open(full, cap, alt) {
		img.src = full;
		img.alt = alt || "";
		if (cap) {
			caption.textContent = cap;
			caption.removeAttribute("hidden");
		} else {
			caption.textContent = "";
			caption.setAttribute("hidden", "");
		}
		box.removeAttribute("hidden");
		document.body.style.overflow = "hidden";
		closeBtn.focus();
	}

	function close() {
		box.setAttribute("hidden", "");
		img.src = "";
		document.body.style.overflow = "";
	}

	grid.addEventListener("click", function (e) {
		var btn = e.target.closest(".tbl-photo");
		if (!btn) return;
		var full = btn.getAttribute("data-full") || "";
		var cap  = btn.getAttribute("data-caption") || "";
		var alt  = btn.querySelector("img") ? btn.querySelector("img").getAttribute("alt") : "";
		if (full) open(full, cap, alt);
	});

	closeBtn.addEventListener("click", close);

	box.addEventListener("click", function (e) {
		if (e.target === box) close();
	});

	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape" && !box.hasAttribute("hidden")) close();
	});
})();
