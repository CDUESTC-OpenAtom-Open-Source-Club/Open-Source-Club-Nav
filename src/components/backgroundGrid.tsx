import React from "react";

/**
 * BackgroundGrid component provides the subtle grid pattern seen in the background
 * of the original design. It uses a CSS linear gradient to create the grid effect.
 */
const BackgroundGrid = () => {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, #f0f0f0 1px, transparent 1px),
          linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
        `,
        backgroundSize: "25px 25px",
        opacity: 0.5,
      }}
    />
  );
};

export default BackgroundGrid;
