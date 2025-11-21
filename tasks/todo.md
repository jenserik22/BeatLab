# Todo

- [X] Move the Swing control UI from `Transport.jsx` to `Mixer.jsx`.
- [X] Update the props in `App.js` to pass `swing` and `handleSwingChange` to `Mixer.jsx` instead of `Transport.jsx`.
- [X] Adjust the CSS in `App.css` for the moved swing control.
- [X] Review changes and ensure everything works as expected.

# Review

- Moved the "Swing" control from the `Transport` component to the `Mixer` component, under the "Global Filter" section.
- Updated `App.js` to pass the `swing` and `handleSwingChange` props to the `Mixer` component.
- Removed the specific CSS for the swing control and updated the JSX in `Mixer.jsx` to match the styling of the other controls in the mixer.