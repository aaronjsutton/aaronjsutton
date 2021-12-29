import "./style.css";

// Assign event listeners to all expandable elements on the page.

const sections = Array.from(
  document.querySelectorAll("[data-expandable]")
) as any;

const controls = Array.from(document.querySelectorAll("[data-expand]"))

controls.forEach((control) => {
  var section: HTMLElement | undefined;


  if (control instanceof HTMLElement) {

    section = sections.find((e: any) => {
      if (e instanceof HTMLElement) {
        return control.dataset.expand === e.dataset.expandable;
      } else {
        return false;
      }
    });

    control.addEventListener("click", () => {
      if (section) {
        section.toggleAttribute("data-open");
      }
    });

  }
});
