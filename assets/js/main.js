import "bootstrap/dist/js/bootstrap.bundle.min.js";

const enableMultiSelectToggle = () => {
	document.querySelectorAll("select[multiple]").forEach((select) => {
		select.addEventListener("mousedown", (event) => {
			const option = event.target.closest("option");
			if (!option) {
				return;
			}
			event.preventDefault();
			option.selected = !option.selected;
		});
	});
};

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", enableMultiSelectToggle);
} else {
	enableMultiSelectToggle();
}
