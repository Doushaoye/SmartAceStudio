# **App Name**: SmartHome AI Planner

## Core Features:

- Product Data Initialization: Initializes the application with a local JSON database containing smart home product details (id, name, brand, category, price, budget_level, description).
- AI-Powered Product Selection: Analyzes user inputs (property area, layout, budget tier, floor plan image if provided, custom needs) along with the full product catalog using the OpenAI API to generate a tailored list of smart home products.
- AI Analysis Report Generation: Generates an analysis report as a markdown string explaining features compromised due to budget, suggestions for upgrades, and ways to save money using generative AI as a tool.
- Dynamic Budget Calculation: Calculates the total budget by mapping AI-selected product IDs to product prices in the local JSON database and summing the costs.
- Interactive Planning Form: A multi-step form where users input property details (area, layout), select a budget tier, upload a floor plan image, and describe custom needs.
- Detailed Proposal Dashboard: Displays a summary of the calculated total price, the AI-generated analysis report (rendered using a Markdown renderer), and a categorized/itemized list of smart home products.
- Itemized Product Table: Displays products selected using the generative AI model, categorized by the selected home area, listing the product image, name, category, quantity, unit price, and subtotal.

## Style Guidelines:

- Primary color: Deep sky blue (#3399FF), evoking a sense of trust and technological advancement.
- Background color: Light gray (#F0F2F5), providing a clean and modern backdrop that doesn't distract from the content.
- Accent color: Vivid violet (#9F00FF), used to highlight key interactive elements and calls to action, adding a touch of sophistication.
- Headline font: 'Space Grotesk' (sans-serif) for headlines and short amounts of body text, providing a tech-forward and modern aesthetic. Body font: 'Inter' (sans-serif) used for longer passages of body text
- Lucide React icons for a clean, consistent, and modern look throughout the application.
- Clean, component-based UI using Tailwind CSS for a modern, responsive design.
- Subtle animations (e.g., loading spinners, transitions) to enhance user experience and provide feedback during AI processing.