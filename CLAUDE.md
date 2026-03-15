# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- **Development**: `npm run dev` - Start development server with Vite
- **Build**: `npm run build` - Create production build
- **Linting**: `npm run lint` - Run ESLint checks
- **Preview**: `npm run preview` - Preview build output
- **Testing**: `npm test` - Run tests (add this command)

## Architecture

The project uses a standard React/Vite setup with the following structure:

```
src/
├── App.jsx          # Main application component
├── main.jsx         # Entry point (renders App)
├── assets/          # Static assets
└── ...              # Other components
```

Key entry points:
- `src/main.jsx` - Application entry point
- `src/App.jsx` - Main UI component

## Dependencies

- **React**: ^19.2.4
- **React DOM**: ^19.2.4
- **Vite**: ^8.0.0
- **ESLint**: ^9.39.4

## Development Notes

1. Use `npm run dev` for local development
2. Add test scripts to package.json for testing support
3. Review ESLint configuration in `eslint.config.js` for code quality
4. Consider adding a README.md section for deployment instructions

## Missing Elements

- Test command in package.json
- README.md content summary
- Cursor/Copilot rules configuration (if present)

This file provides a starting point for Claude Code to understand the project structure and common development workflows.