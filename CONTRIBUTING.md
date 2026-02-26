# Contributing to Ellaura

Thank you for your interest in contributing to Ellaura! This document provides guidelines and instructions for contributing.

## 🏁 Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ELLAURA.git
   cd ELLAURA
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📐 Code Style

- **React**: Use functional components with hooks
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Styling**: Use Tailwind CSS utility classes — avoid inline styles
- **State**: Use the existing context pattern (`AppContext.jsx`) for global state
- **Imports**: Group imports — React first, then libraries, then local files

## 📁 Project Structure

```
src/
├── components/    ← Reusable UI components
├── context/       ← Global state providers
├── lib/           ← Utility functions & API clients
└── pages/         ← Route-level page components
```

### Adding a New Page

1. Create `src/pages/YourPage.jsx`
2. Add a route in `src/App.jsx`
3. Add navigation link in `src/components/Header.jsx` (if needed)

### Adding a New Component

1. Create `src/components/YourComponent.jsx`
2. Use the existing design tokens (see `tailwind.config.js`)
3. Support both dark and light themes

## 🔀 Pull Request Process

1. Ensure your code works in both **Demo Mode** and with Supabase connected
2. Test on mobile and desktop viewports
3. Update documentation if needed
4. Write a clear PR description explaining:
   - **What** changed
   - **Why** it was needed
   - **How** to test it
5. Request a review from a maintainer

## 🐛 Reporting Bugs

Open an issue with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS details
- Screenshots if applicable

## 💡 Feature Requests

Open an issue with:
- Clear description of the feature
- Why it would be valuable
- Any mockups or references

## 🔒 Security

If you find a security vulnerability, please **do not** open a public issue. Instead, email the maintainers directly.

---

Thank you for helping make Ellaura better! 🌹
