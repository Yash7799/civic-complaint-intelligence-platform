document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll("button");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      button.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(0.98)" },
          { transform: "scale(1)" }
        ],
        {
          duration: 180,
          easing: "ease-out"
        }
      );
    });
  });

  const cards = document.querySelectorAll(".feature-card, .dept-card, .metric-box");

  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transition = "transform 0.25s ease, box-shadow 0.25s ease";
      card.style.transform = "translateY(-4px)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
    });
  });
});
