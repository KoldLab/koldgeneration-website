# koldgeneration-website

My personal website for tools and utilities built with React, shadcn/ui, and Zustand.

## 🚀 Tech Stack

- ⚛️ **React 19** with TypeScript
- ⚡ **Vite** for fast development
- 🎨 **Tailwind CSS** for styling
- 🧩 **shadcn/ui** for beautiful components
- 🐻 **Zustand** for state management
- 🎯 **Lucide React** for icons

## 📦 Installation

```bash
npm install
```

## 🛠️ Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

## 🏗️ Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## 🧹 Linting

Run ESLint:

```bash
npm run lint
```

## 📁 Project Structure

```
src/
├── components/
│   └── ui/              # shadcn/ui components
│       ├── button.tsx
│       └── card.tsx
├── lib/
│   └── utils.ts         # Utility functions
├── store/
│   └── useToolStore.ts  # Zustand store
├── App.tsx              # Main component
├── main.tsx             # Entry point
└── index.css            # Styles
```

## ✨ Features

- 🌓 Dark mode toggle
- 📝 Add/remove personal tools
- 📱 Responsive design
- ♿ Accessible components
- 🎨 Beautiful UI with shadcn

## 🎨 Adding New shadcn Components

To add more shadcn components:

```bash
npx shadcn@latest add <component-name>
```

For example:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add select
```

## 📝 License

MIT
