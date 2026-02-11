# **App Name**: WinDoor System

## Core Features:

- Parametric Design Input: Allow users to input dimensions and parameters (in mm) for window and door designs, updating the local state. Designs should include system selection, dimension input, panel configuration, glass/mesh selection and parameter-driven drag-resize.
- Real-time 2D Visualization: Render a 2D representation of the window/door design using SVG, updating in real-time based on user input.
- Backend Design Validation: Send design parameters to the backend API to validate the design against manufacturing rules and constraints.
- Manufacturing Output Generation: Generate manufacturing-ready outputs, including aluminium cut lists and glass cut sizes, in formats like PDF and DXF.
- Design Versioning: Enable versioning for designs, rules, and outputs to track changes and maintain a history of design iterations. Store key entities in a data model that includes users, projects, designs, window systems, profiles, rules, and outputs.

## Style Guidelines:

- Primary color: Deep teal (#008080) for a professional and technical feel, referencing the precision required in manufacturing.
- Background color: Light grey (#E0E0E0), a desaturated tint of the primary color for a clean, uncluttered workspace.
- Accent color: Pale gold (#E6BE8A), to add a highlight analogous to teal and create a premium, professional feeling.
- Font pairing: 'Space Grotesk' for headlines and 'Inter' for body text. 'Space Grotesk' is a proportional sans-serif font with a computerized, techy, scientific feel; 'Inter' is a grotesque-style sans-serif with a modern, machined, objective, neutral look.
- Use minimalist, technical icons to represent different design parameters and manufacturing options.
- Maintain a clean and structured layout, focusing on ease of use and clear presentation of design parameters and outputs.
- Use subtle transitions and animations to provide feedback on user interactions and highlight important design changes.